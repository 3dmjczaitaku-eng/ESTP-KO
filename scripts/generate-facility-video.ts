import fs from 'fs'
import path from 'path'
import { ComfyUIClient } from '../lib/comfyui-client'
import { buildWan21Workflow } from '../lib/wan21-workflow'
import { generateVideoPrompt } from '../lib/prompt-generator'
import { convertToWebm, extractPoster } from '../lib/video-converter'

const COMFYUI_URL = process.env.COMFYUI_URL ?? 'http://localhost:8188'
const CLIENT_ID = `claude-${Date.now()}`

async function processPhoto(
  client: ComfyUIClient,
  photoPath: string,
  outputDir: string
): Promise<void> {
  const filename = path.basename(photoPath)
  const id = path.basename(photoPath, path.extname(photoPath))
  console.log(`\n[photo] Processing: ${filename}`)

  // 1. Generate prompts via Claude Vision
  console.log('  -> Generating prompts...')
  const imageBuffer = fs.readFileSync(photoPath)
  const prompts = await generateVideoPrompt(imageBuffer, filename)
  console.log(`  ok Positive: ${prompts.positive.slice(0, 60)}...`)

  // 2. Upload image to ComfyUI
  console.log('  -> Uploading to ComfyUI...')
  const uploadedName = await client.uploadImage(imageBuffer, filename)

  // 3. Build and submit workflow
  console.log('  -> Submitting Wan2.1 workflow...')
  const workflow = buildWan21Workflow({
    imageFilename: uploadedName,
    positivePrompt: prompts.positive,
    negativePrompt: prompts.negative,
    outputPrefix: `facility-${id}`,
  })
  const promptId = await client.submitWorkflow({ prompt: workflow, client_id: CLIENT_ID })
  console.log(`  ok Job ID: ${promptId}`)

  // 4. Poll until done (~2-5 minutes on Apple Silicon)
  console.log('  -> Waiting for generation...')
  const output = await client.pollUntilDone(promptId)
  console.log(`  ok Generated: ${output.filename}`)

  // 5. Download generated video
  const downloadUrl = client.getDownloadUrl(output.filename, output.type)
  const videoRes = await fetch(downloadUrl)
  if (!videoRes.ok) throw new Error(`Download failed: ${videoRes.status}`)
  const tmpMp4 = path.join(outputDir, `${id}-tmp.mp4`)
  fs.writeFileSync(tmpMp4, Buffer.from(await videoRes.arrayBuffer()))

  // 6. Convert to webm + extract poster frame
  const webmPath = path.join(outputDir, `${id}.webm`)
  const posterPath = path.join(outputDir, `${id}-poster.jpg`)
  console.log('  -> Converting to .webm...')
  await convertToWebm(tmpMp4, webmPath)
  await extractPoster(tmpMp4, posterPath)
  fs.unlinkSync(tmpMp4)

  console.log(`  done: ${webmPath}`)
}

async function main(): Promise<void> {
  const photosDir = process.argv[2] ?? './photos/facility'
  const outputDir = process.argv[3] ?? './public/videos'

  if (!fs.existsSync(photosDir)) {
    console.error(`Error: Photos directory not found: ${photosDir}`)
    process.exit(1)
  }

  fs.mkdirSync(outputDir, { recursive: true })

  const photos = fs.readdirSync(photosDir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .map(f => path.join(photosDir, f))

  if (photos.length === 0) {
    console.error(`Error: No photos found in ${photosDir}`)
    process.exit(1)
  }

  console.log('Facility Video Generator')
  console.log(`Photos: ${photos.length} found`)
  console.log(`ComfyUI: ${COMFYUI_URL}`)

  const client = new ComfyUIClient(COMFYUI_URL)

  // Verify ComfyUI is reachable before starting
  try {
    const res = await fetch(`${COMFYUI_URL}/system_stats`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    console.error(`Error: ComfyUI not reachable at ${COMFYUI_URL}`)
    console.error('  Start ComfyUI Desktop App and try again.')
    process.exit(1)
  }

  for (const photo of photos) {
    await processPhoto(client, photo, outputDir)
  }

  console.log('\nAll videos generated!')
  console.log('Next: Update FacilitySection to use <video> tags (Task 7)')
}

main().catch(err => {
  console.error('Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
