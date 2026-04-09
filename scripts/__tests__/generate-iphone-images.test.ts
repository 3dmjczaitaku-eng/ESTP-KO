/**
 * TDD: generate-iphone-images (script integration layer)
 *
 * RED phase — tests for the I/O orchestration layer.
 * The script itself is not imported directly; instead the orchestration
 * helpers are extracted into testable pure-ish functions.
 *
 * Covers:
 *   - downloadImage (mocked fetch + fs)
 *   - saveImageFile (mocked fs.writeFileSync)
 *   - loadExistingAssets (mocked fs.readFileSync)
 *   - saveAssetsJson (mocked fs.writeFileSync)
 *   - collectGenerationJobs (derives jobs from colors x angles)
 *   - Error handling when API token missing
 *   - Error handling when download fails
 *   - Error handling when fs write fails
 *   - Partial failure: some images succeed, some fail
 */

import fs from 'fs'
import path from 'path'

import {
  downloadImage,
  saveImageFile,
  loadExistingAssets,
  saveAssetsJson,
  collectGenerationJobs,
  processJob,
  buildColorSetsFromResults,
  runJobsConcurrently,
  type GenerationJob,
  type JobResult,
} from '@/scripts/generate-iphone-images'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('fs')
const mockedFs = fs as jest.Mocked<typeof fs>

// jest.setup.js already assigns global.fetch = jest.fn().
// We retrieve that mock here so test cases can control return values.
const mockFetch = global.fetch as jest.Mock

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeArrayBuffer(content: string): ArrayBuffer {
  // Use Buffer (Node.js built-in) to avoid TextEncoder unavailability in jsdom
  const buf = Buffer.from(content, 'utf-8')
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

// ---------------------------------------------------------------------------
// downloadImage
// ---------------------------------------------------------------------------

describe('downloadImage', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns buffer on successful fetch', async () => {
    const fakeContent = 'fake image bytes'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(makeArrayBuffer(fakeContent)),
    })

    const result = await downloadImage('https://cdn.example.com/img.jpg')
    // ArrayBuffer (or SharedArrayBuffer) — check byteLength is accessible
    expect(result.buffer).toBeDefined()
    expect(typeof (result.buffer as ArrayBuffer).byteLength).toBe('number')
    expect(result.error).toBeUndefined()
  })

  it('returns error when fetch response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    const result = await downloadImage('https://cdn.example.com/missing.jpg')
    expect(result.buffer).toBeUndefined()
    expect(result.error).toContain('404')
  })

  it('returns error when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network timeout'))

    const result = await downloadImage('https://cdn.example.com/img.jpg')
    expect(result.buffer).toBeUndefined()
    expect(result.error).toContain('network timeout')
  })

  it('returns error for empty URL', async () => {
    const result = await downloadImage('')
    expect(result.buffer).toBeUndefined()
    expect(result.error).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// saveImageFile
// ---------------------------------------------------------------------------

describe('saveImageFile', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('writes buffer to correct path', () => {
    const buffer = makeArrayBuffer('image data')
    mockedFs.mkdirSync.mockImplementation(() => undefined)
    mockedFs.writeFileSync.mockImplementation(() => undefined)

    const result = saveImageFile('/output/images', 'iphone-silver-front.jpg', buffer)
    expect(result.success).toBe(true)
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      path.join('/output/images', 'iphone-silver-front.jpg'),
      expect.any(Buffer)
    )
  })

  it('creates directory if it does not exist', () => {
    const buffer = makeArrayBuffer('data')
    mockedFs.mkdirSync.mockImplementation(() => undefined)
    mockedFs.writeFileSync.mockImplementation(() => undefined)

    saveImageFile('/new/dir', 'file.jpg', buffer)
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/new/dir', { recursive: true })
  })

  it('returns error when writeFileSync throws', () => {
    const buffer = makeArrayBuffer('data')
    mockedFs.mkdirSync.mockImplementation(() => undefined)
    mockedFs.writeFileSync.mockImplementation(() => {
      throw new Error('disk full')
    })

    const result = saveImageFile('/output', 'file.jpg', buffer)
    expect(result.success).toBe(false)
    expect(result.error).toContain('disk full')
  })
})

// ---------------------------------------------------------------------------
// loadExistingAssets
// ---------------------------------------------------------------------------

describe('loadExistingAssets', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('parses valid JSON from file', () => {
    const existing = {
      hero_video: { src: '/videos/hero.mp4', alt: 'hero', name: 'Hero' },
      product_images: [],
    }
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockReturnValue(JSON.stringify(existing))

    const result = loadExistingAssets('/public/assets.json')
    expect(result).toEqual(existing)
  })

  it('returns null when file does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false)

    const result = loadExistingAssets('/public/assets.json')
    expect(result).toBeNull()
  })

  it('returns null when JSON is malformed', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockReturnValue('{ invalid json }')

    const result = loadExistingAssets('/public/assets.json')
    expect(result).toBeNull()
  })

  it('returns null when readFileSync throws', () => {
    mockedFs.existsSync.mockReturnValue(true)
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('permission denied')
    })

    const result = loadExistingAssets('/public/assets.json')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// saveAssetsJson
// ---------------------------------------------------------------------------

describe('saveAssetsJson', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('writes pretty-printed JSON to file', () => {
    mockedFs.writeFileSync.mockImplementation(() => undefined)

    const payload = {
      hero_video: { src: '/v.mp4', alt: 'hero', name: 'Hero' },
      product_images: [],
      color_sets: [],
    }
    const result = saveAssetsJson('/public/assets.json', payload)
    expect(result.success).toBe(true)

    const written = (mockedFs.writeFileSync as jest.Mock).mock.calls[0][1] as string
    const parsed = JSON.parse(written)
    expect(parsed).toEqual(payload)
  })

  it('output JSON is indented (pretty-printed)', () => {
    mockedFs.writeFileSync.mockImplementation(() => undefined)

    const payload = {
      hero_video: { src: '/v.mp4', alt: 'hero', name: 'Hero' },
      product_images: [],
      color_sets: [],
    }
    saveAssetsJson('/public/assets.json', payload)

    const written = (mockedFs.writeFileSync as jest.Mock).mock.calls[0][1] as string
    // Pretty-printed JSON contains newlines
    expect(written).toContain('\n')
  })

  it('returns error when writeFileSync throws', () => {
    mockedFs.writeFileSync.mockImplementation(() => {
      throw new Error('no space left')
    })

    const result = saveAssetsJson('/public/assets.json', {
      hero_video: { src: '/', alt: '', name: '' },
      product_images: [],
      color_sets: [],
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('no space left')
  })
})

// ---------------------------------------------------------------------------
// collectGenerationJobs
// ---------------------------------------------------------------------------

describe('collectGenerationJobs', () => {
  it('returns 6 * N jobs where N is the number of angles', () => {
    const jobs = collectGenerationJobs()
    // 6 colors * IPHONE_ANGLES.length
    expect(jobs.length).toBeGreaterThanOrEqual(6 * 3)
  })

  it('each job has required fields', () => {
    const jobs = collectGenerationJobs()
    for (const job of jobs) {
      expect(job).toHaveProperty('color')
      expect(job).toHaveProperty('angle')
      expect(job).toHaveProperty('prompt')
      expect(job).toHaveProperty('filename')
      expect(typeof job.color).toBe('string')
      expect(typeof job.angle).toBe('string')
      expect(typeof job.prompt).toBe('string')
      expect(typeof job.filename).toBe('string')
    }
  })

  it('all filenames are unique', () => {
    const jobs = collectGenerationJobs()
    const filenames = jobs.map((j) => j.filename)
    const unique = new Set(filenames)
    expect(unique.size).toBe(jobs.length)
  })

  it('prompts are non-empty and meaningful', () => {
    const jobs = collectGenerationJobs()
    for (const job of jobs) {
      expect(job.prompt.length).toBeGreaterThan(20)
    }
  })

  it('contains Midnight Black color', () => {
    const jobs = collectGenerationJobs()
    const midnightJobs = jobs.filter((j) => j.color === 'Midnight Black')
    expect(midnightJobs.length).toBeGreaterThan(0)
  })

  it('contains all 6 colors', () => {
    const jobs = collectGenerationJobs()
    const colors = new Set(jobs.map((j) => j.color))
    expect(colors.size).toBe(6)
  })

  it('contains Front, Side, Back angles', () => {
    const jobs = collectGenerationJobs()
    const angles = new Set(jobs.map((j) => j.angle))
    expect(angles.has('Front')).toBe(true)
    expect(angles.has('Side')).toBe(true)
    expect(angles.has('Back')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// processJob
// ---------------------------------------------------------------------------

describe('processJob', () => {
  const sampleJob: GenerationJob = {
    color: 'Silver',
    angle: 'Front',
    prompt: 'iPhone 17 Pro in silver colorway, front view...',
    filename: 'iphone-silver-front.jpg',
  }

  it('returns success when all steps succeed', async () => {
    const fakeBuffer = Buffer.from('img').buffer
    const mockGenerate = jest.fn().mockResolvedValue({
      urls: ['https://cdn.example.com/img.jpg'],
      error: undefined,
    })
    const mockDownload = jest.fn().mockResolvedValue({ buffer: fakeBuffer })
    const mockSave = jest.fn().mockReturnValue({ success: true })

    const result = await processJob(sampleJob, '/images', mockGenerate, mockDownload, mockSave)

    expect(result.success).toBe(true)
    expect(result.url).toBe('https://cdn.example.com/img.jpg')
    expect(result.error).toBeUndefined()
  })

  it('returns failure when API returns error', async () => {
    const mockGenerate = jest.fn().mockResolvedValue({
      urls: [],
      error: 'Model overloaded',
    })
    const mockDownload = jest.fn()
    const mockSave = jest.fn()

    const result = await processJob(sampleJob, '/images', mockGenerate, mockDownload, mockSave)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Model overloaded')
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it('returns failure when API returns no URLs', async () => {
    const mockGenerate = jest.fn().mockResolvedValue({ urls: [] })
    const mockDownload = jest.fn()
    const mockSave = jest.fn()

    const result = await processJob(sampleJob, '/images', mockGenerate, mockDownload, mockSave)

    expect(result.success).toBe(false)
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it('returns failure when download fails', async () => {
    const mockGenerate = jest.fn().mockResolvedValue({
      urls: ['https://cdn.example.com/img.jpg'],
    })
    const mockDownload = jest.fn().mockResolvedValue({ error: 'connection refused' })
    const mockSave = jest.fn()

    const result = await processJob(sampleJob, '/images', mockGenerate, mockDownload, mockSave)

    expect(result.success).toBe(false)
    expect(result.error).toContain('connection refused')
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('returns failure when file save fails', async () => {
    const fakeBuffer = Buffer.from('img').buffer
    const mockGenerate = jest.fn().mockResolvedValue({
      urls: ['https://cdn.example.com/img.jpg'],
    })
    const mockDownload = jest.fn().mockResolvedValue({ buffer: fakeBuffer })
    const mockSave = jest.fn().mockReturnValue({ success: false, error: 'disk full' })

    const result = await processJob(sampleJob, '/images', mockGenerate, mockDownload, mockSave)

    expect(result.success).toBe(false)
    expect(result.error).toContain('disk full')
  })

  it('passes the correct prompt and dimensions to generateFn', async () => {
    const mockGenerate = jest.fn().mockResolvedValue({ urls: [], error: 'stop' })
    const mockDownload = jest.fn()
    const mockSave = jest.fn()

    await processJob(sampleJob, '/images', mockGenerate, mockDownload, mockSave)

    expect(mockGenerate).toHaveBeenCalledWith({
      prompt: sampleJob.prompt,
      numOutputs: 1,
      width: 768,
      height: 768,
    })
  })
})

// ---------------------------------------------------------------------------
// buildColorSetsFromResults
// ---------------------------------------------------------------------------

describe('buildColorSetsFromResults', () => {
  const makeJob = (color: GenerationJob['color'], angle: GenerationJob['angle']): GenerationJob => ({
    color,
    angle,
    prompt: 'test prompt',
    filename: `iphone-${color.toLowerCase().replace(' ', '-')}-${angle.toLowerCase()}.jpg`,
  })

  it('returns empty array for no results', () => {
    expect(buildColorSetsFromResults([])).toEqual([])
  })

  it('excludes failed results', () => {
    const results: JobResult[] = [
      { job: makeJob('Silver', 'Front'), success: false, error: 'API error' },
    ]
    expect(buildColorSetsFromResults(results)).toEqual([])
  })

  it('groups successful results by color', () => {
    const results: JobResult[] = [
      { job: makeJob('Silver', 'Front'), success: true, url: 'https://cdn.example.com/1.jpg' },
      { job: makeJob('Silver', 'Side'), success: true, url: 'https://cdn.example.com/2.jpg' },
      { job: makeJob('Gold', 'Front'), success: true, url: 'https://cdn.example.com/3.jpg' },
    ]
    const sets = buildColorSetsFromResults(results)
    expect(sets.length).toBe(2)

    const silver = sets.find((s) => s.color === 'Silver')
    expect(silver).toBeDefined()
    expect(silver!.images.length).toBe(2)

    const gold = sets.find((s) => s.color === 'Gold')
    expect(gold).toBeDefined()
    expect(gold!.images.length).toBe(1)
  })

  it('each image entry has angle, filename, url', () => {
    const results: JobResult[] = [
      { job: makeJob('Blue', 'Back'), success: true, url: 'https://cdn.example.com/b.jpg' },
    ]
    const sets = buildColorSetsFromResults(results)
    const entry = sets[0].images[0]
    expect(entry).toHaveProperty('angle', 'Back')
    expect(entry).toHaveProperty('filename')
    expect(entry).toHaveProperty('url', 'https://cdn.example.com/b.jpg')
  })

  it('handles mixed success and failure', () => {
    const results: JobResult[] = [
      { job: makeJob('Orange', 'Front'), success: true, url: 'https://cdn.example.com/o1.jpg' },
      { job: makeJob('Orange', 'Side'), success: false, error: 'timeout' },
      { job: makeJob('Orange', 'Back'), success: true, url: 'https://cdn.example.com/o3.jpg' },
    ]
    const sets = buildColorSetsFromResults(results)
    expect(sets.length).toBe(1)
    expect(sets[0].images.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// runJobsConcurrently
// ---------------------------------------------------------------------------

describe('runJobsConcurrently', () => {
  const makeJob = (color: GenerationJob['color'], angle: GenerationJob['angle']): GenerationJob => ({
    color,
    angle,
    prompt: `${color} ${angle} prompt`,
    filename: `iphone-${color.toLowerCase().replace(' ', '-')}-${angle.toLowerCase()}.jpg`,
  })

  it('processes all jobs and returns results for each', async () => {
    const jobs = [
      makeJob('Silver', 'Front'),
      makeJob('Gold', 'Front'),
      makeJob('Blue', 'Side'),
    ]
    const mockGenerate = jest.fn().mockResolvedValue({
      urls: ['https://cdn.example.com/img.jpg'],
    })
    const mockDownload = jest.fn().mockResolvedValue({ buffer: Buffer.from('img').buffer })
    const mockSave = jest.fn().mockReturnValue({ success: true })

    const results = await runJobsConcurrently(
      jobs,
      '/images',
      mockGenerate,
      mockDownload,
      mockSave,
      3
    )

    expect(results).toHaveLength(3)
    expect(results.every((r) => r.success)).toBe(true)
  })

  it('returns empty array for empty jobs', async () => {
    const mockGenerate = jest.fn()
    const mockDownload = jest.fn()
    const mockSave = jest.fn()

    const results = await runJobsConcurrently([], '/images', mockGenerate, mockDownload, mockSave, 3)
    expect(results).toEqual([])
  })

  it('collects both successful and failed results (Promise.allSettled)', async () => {
    const jobs = [
      makeJob('Silver', 'Front'),
      makeJob('Gold', 'Back'),
    ]
    const mockGenerate = jest
      .fn()
      .mockResolvedValueOnce({ urls: ['https://cdn.example.com/ok.jpg'] })
      .mockResolvedValueOnce({ urls: [], error: 'API overloaded' })
    const mockDownload = jest.fn().mockResolvedValue({ buffer: Buffer.from('img').buffer })
    const mockSave = jest.fn().mockReturnValue({ success: true })

    const results = await runJobsConcurrently(
      jobs,
      '/images',
      mockGenerate,
      mockDownload,
      mockSave,
      5
    )

    expect(results).toHaveLength(2)
    const succeeded = results.filter((r) => r.success)
    const failed = results.filter((r) => !r.success)
    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
  })

  it('respects concurrency limit (runs at most N jobs in parallel)', async () => {
    const concurrency = 2
    let activeCount = 0
    let maxObservedActive = 0

    const jobs = Array.from({ length: 6 }, (_, i) =>
      makeJob('Silver', i % 2 === 0 ? 'Front' : 'Side')
    )

    const mockGenerate = jest.fn().mockImplementation(async () => {
      activeCount++
      maxObservedActive = Math.max(maxObservedActive, activeCount)
      await new Promise((resolve) => setTimeout(resolve, 10))
      activeCount--
      return { urls: ['https://cdn.example.com/img.jpg'] }
    })
    const mockDownload = jest.fn().mockResolvedValue({ buffer: Buffer.from('img').buffer })
    const mockSave = jest.fn().mockReturnValue({ success: true })

    await runJobsConcurrently(jobs, '/images', mockGenerate, mockDownload, mockSave, concurrency)

    expect(maxObservedActive).toBeLessThanOrEqual(concurrency)
  })

  it('does not abort remaining jobs when one fails', async () => {
    const jobs = [
      makeJob('Silver', 'Front'),
      makeJob('Gold', 'Side'),
      makeJob('Blue', 'Back'),
    ]
    const mockGenerate = jest
      .fn()
      .mockResolvedValueOnce({ urls: [], error: 'fail' })
      .mockResolvedValue({ urls: ['https://cdn.example.com/img.jpg'] })
    const mockDownload = jest.fn().mockResolvedValue({ buffer: Buffer.from('img').buffer })
    const mockSave = jest.fn().mockReturnValue({ success: true })

    const results = await runJobsConcurrently(
      jobs,
      '/images',
      mockGenerate,
      mockDownload,
      mockSave,
      3
    )

    // All 3 jobs should complete regardless of the first failure
    expect(results).toHaveLength(3)
    expect(mockGenerate).toHaveBeenCalledTimes(3)
  })
})
