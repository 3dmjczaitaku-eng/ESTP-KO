/**
 * iPhone Image Generation Script — I/O Orchestration Layer
 *
 * Generates 6-color x multi-angle iPhone 17 Pro images via Replicate API,
 * saves them to public/images/, and updates public/assets.json.
 *
 * Usage:
 *   REPLICATE_API_TOKEN=<token> npx ts-node scripts/generate-iphone-images.ts
 *
 * Environment:
 *   REPLICATE_API_TOKEN  - Replicate API token (required)
 */

import fs from 'fs'
import path from 'path'

import {
  buildPrompt,
  buildFilename,
  buildAssetsJson,
  IPHONE_COLORS,
  IPHONE_ANGLES,
  type IPhoneColor,
  type IPhoneAngle,
  type ColorImageSet,
  type ColorImageEntry,
  type GeneratedAssetsJson,
} from '../lib/iphone-image-generator'

import { generateImages, downloadImage as replicateDownloadImage } from '../lib/replicate'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerationJob {
  color: IPhoneColor
  angle: IPhoneAngle
  prompt: string
  filename: string
}

export interface DownloadResult {
  buffer?: ArrayBuffer
  error?: string
}

export interface WriteResult {
  success: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// collectGenerationJobs
// ---------------------------------------------------------------------------

/**
 * Produces the full matrix of (color x angle) generation jobs.
 * Each job is self-contained with the prompt and target filename.
 */
export function collectGenerationJobs(): GenerationJob[] {
  const jobs: GenerationJob[] = []
  for (const color of IPHONE_COLORS) {
    for (const angle of IPHONE_ANGLES) {
      jobs.push({
        color,
        angle,
        prompt: buildPrompt(color, angle),
        filename: buildFilename(color, angle),
      })
    }
  }
  return jobs
}

// ---------------------------------------------------------------------------
// downloadImage
// ---------------------------------------------------------------------------

/**
 * Downloads an image from a URL with a 30-second timeout.
 * Delegates to lib/replicate.downloadImage which uses AbortController.
 * Returns a DownloadResult (never throws).
 */
export async function downloadImage(url: string): Promise<DownloadResult> {
  return replicateDownloadImage(url)
}

// ---------------------------------------------------------------------------
// saveImageFile
// ---------------------------------------------------------------------------

/**
 * Writes an ArrayBuffer to disk at <dir>/<filename>.
 * Creates the directory if it does not exist.
 * Returns a WriteResult (never throws).
 */
export function saveImageFile(
  dir: string,
  filename: string,
  buffer: ArrayBuffer
): WriteResult {
  try {
    fs.mkdirSync(dir, { recursive: true })
    const filePath = path.join(dir, filename)
    fs.writeFileSync(filePath, Buffer.from(buffer))
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown write error',
    }
  }
}

// ---------------------------------------------------------------------------
// loadExistingAssets
// ---------------------------------------------------------------------------

/**
 * Reads and parses public/assets.json.
 * Returns null if the file does not exist or is malformed.
 */
export function loadExistingAssets(
  filePath: string
): GeneratedAssetsJson | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8') as string
    return JSON.parse(raw) as GeneratedAssetsJson
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// saveAssetsJson
// ---------------------------------------------------------------------------

/**
 * Serializes and writes an assets payload to disk as pretty-printed JSON.
 * Returns a WriteResult (never throws).
 */
export function saveAssetsJson(
  filePath: string,
  payload: GeneratedAssetsJson
): WriteResult {
  try {
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2))
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown write error',
    }
  }
}

// ---------------------------------------------------------------------------
// processJob — testable job execution unit
// ---------------------------------------------------------------------------

export interface JobResult {
  job: GenerationJob
  success: boolean
  url?: string
  error?: string
}

/**
 * Executes a single generation job: generate -> download -> save.
 * All I/O is injected via parameters to enable unit testing.
 *
 * @param job           - the generation job definition
 * @param imagesDir     - target directory for saved images
 * @param generateFn    - Replicate API caller (injectable for testing)
 * @param downloadFn    - HTTP image downloader (injectable for testing)
 * @param saveFn        - filesystem writer (injectable for testing)
 */
export async function processJob(
  job: GenerationJob,
  imagesDir: string,
  generateFn: typeof generateImages,
  downloadFn: typeof downloadImage,
  saveFn: typeof saveImageFile
): Promise<JobResult> {
  const genResult = await generateFn({
    prompt: job.prompt,
    numOutputs: 1,
    width: 768,
    height: 768,
  })

  if (genResult.error || genResult.urls.length === 0) {
    return { job, success: false, error: genResult.error ?? 'no output from API' }
  }

  const imageUrl = genResult.urls[0]
  const downloadResult = await downloadFn(imageUrl)

  if (downloadResult.error || !downloadResult.buffer) {
    return { job, success: false, error: downloadResult.error ?? 'empty download' }
  }

  const writeResult = saveFn(imagesDir, job.filename, downloadResult.buffer)
  if (!writeResult.success) {
    return { job, success: false, error: writeResult.error }
  }

  return { job, success: true, url: imageUrl }
}

// ---------------------------------------------------------------------------
// buildColorSetsFromResults — testable aggregation
// ---------------------------------------------------------------------------

/**
 * Aggregates successful job results into ColorImageSet groups.
 */
export function buildColorSetsFromResults(results: JobResult[]): ColorImageSet[] {
  const map = new Map<IPhoneColor, ColorImageEntry[]>()

  for (const result of results) {
    if (!result.success || !result.url) continue
    const { color, angle, filename } = result.job
    if (!map.has(color)) map.set(color, [])
    map.get(color)!.push({ angle, filename, url: result.url })
  }

  return Array.from(map.entries()).map(([color, images]) => ({ color, images }))
}

// ---------------------------------------------------------------------------
// runJobsConcurrently — parallel execution with concurrency limit
// ---------------------------------------------------------------------------

/**
 * Runs generation jobs concurrently with a configurable concurrency limit.
 * Uses Promise.allSettled so all results are collected regardless of failures.
 *
 * @param jobs        - list of generation jobs
 * @param imagesDir   - target directory for saved images
 * @param generateFn  - Replicate API caller (injectable for testing)
 * @param downloadFn  - HTTP image downloader (injectable for testing)
 * @param saveFn      - filesystem writer (injectable for testing)
 * @param concurrency - max simultaneous jobs (default: 4)
 */
export async function runJobsConcurrently(
  jobs: GenerationJob[],
  imagesDir: string,
  generateFn: typeof generateImages,
  downloadFn: typeof downloadImage,
  saveFn: typeof saveImageFile,
  concurrency = 4
): Promise<JobResult[]> {
  const results: JobResult[] = []
  const queue = [...jobs]

  async function processNext(): Promise<void> {
    const job = queue.shift()
    if (!job) return
    const result = await processJob(job, imagesDir, generateFn, downloadFn, saveFn)
    results.push(result)
    await processNext()
  }

  const workers = Array.from(
    { length: Math.min(concurrency, jobs.length) },
    () => processNext()
  )

  await Promise.allSettled(workers)
  return results
}

// ---------------------------------------------------------------------------
// Main orchestration
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    console.error(
      'Error: REPLICATE_API_TOKEN not set.\n' +
        '  Set your token: export REPLICATE_API_TOKEN=your_token_here'
    )
    process.exit(1)
  }

  const projectRoot = process.cwd()
  const imagesDir = path.join(projectRoot, 'public', 'images')
  const assetsJsonPath = path.join(projectRoot, 'public', 'assets.json')

  const jobs = collectGenerationJobs()
  console.log(`Starting generation of ${jobs.length} images (${IPHONE_COLORS.length} colors x ${IPHONE_ANGLES.length} angles)`)

  const results = await runJobsConcurrently(
    jobs,
    imagesDir,
    generateImages,
    downloadImage,
    saveImageFile,
    4
  )

  for (const result of results) {
    if (result.success) {
      console.log(`  Saved: public/images/${result.job.filename}`)
    } else {
      console.error(`  Failed [${result.job.color}/${result.job.angle}]: ${result.error}`)
    }
  }

  const colorSets = buildColorSetsFromResults(results)
  const existing = loadExistingAssets(assetsJsonPath)
  const payload = buildAssetsJson(colorSets, existing)
  const saveResult = saveAssetsJson(assetsJsonPath, payload)

  if (!saveResult.success) {
    console.error(`Failed to write assets.json: ${saveResult.error}`)
    process.exit(1)
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length
  console.log(`\nDone. Success: ${successCount} / Failed: ${failCount}`)
  console.log('Updated: public/assets.json')
}

// Run only when executed directly (not when imported by tests)
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
