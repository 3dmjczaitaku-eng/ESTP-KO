/**
 * TDD: lib/replicate.ts
 *
 * RED phase — tests written before implementation changes.
 * Covers:
 *   - generateImages: success path (status: succeeded)
 *   - generateImages: failed prediction (status: failed)
 *   - generateImages: timeout (max polling attempts exceeded)
 *   - generateImages: API error on prediction creation
 *   - generateImages: missing REPLICATE_API_TOKEN
 *   - generateImages: model version from env var REPLICATE_MODEL_VERSION
 *   - generateImages: error detail NOT leaked to caller
 *   - downloadImage: AbortController timeout (30s)
 *   - downloadImage: success path
 *   - downloadImage: non-ok HTTP response
 *   - downloadImage: fetch throws (network error)
 *   - downloadImage: AbortSignal triggers on timeout
 */

import { generateImages, downloadImage } from '@/lib/replicate'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = global.fetch as jest.Mock

// ---------------------------------------------------------------------------
// generateImages
// ---------------------------------------------------------------------------

describe('generateImages', () => {
  const originalToken = process.env.REPLICATE_API_TOKEN
  const originalVersion = process.env.REPLICATE_MODEL_VERSION

  beforeEach(() => {
    mockFetch.mockReset()
    // Set a default token for most tests
    process.env.REPLICATE_API_TOKEN = 'test-token'
    delete process.env.REPLICATE_MODEL_VERSION
  })

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.REPLICATE_API_TOKEN
    } else {
      process.env.REPLICATE_API_TOKEN = originalToken
    }
    if (originalVersion === undefined) {
      delete process.env.REPLICATE_MODEL_VERSION
    } else {
      process.env.REPLICATE_MODEL_VERSION = originalVersion
    }
  })

  it('returns error when REPLICATE_API_TOKEN is not set', async () => {
    delete process.env.REPLICATE_API_TOKEN
    const result = await generateImages({ prompt: 'test' })
    expect(result.urls).toEqual([])
    expect(result.error).toBeTruthy()
  })

  it('returns urls on succeeded prediction', async () => {
    // POST /predictions -> starting
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'pred-123', status: 'starting' }),
    })
    // GET /predictions/pred-123 -> succeeded
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'pred-123',
          status: 'succeeded',
          output: ['https://cdn.replicate.com/image.jpg'],
        }),
    })

    const result = await generateImages({ prompt: 'iPhone photo', pollIntervalMs: 0 })
    expect(result.error).toBeUndefined()
    expect(result.urls).toEqual(['https://cdn.replicate.com/image.jpg'])
  })

  it('handles output as single string (not array)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'pred-456', status: 'starting' }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'pred-456',
          status: 'succeeded',
          output: 'https://cdn.replicate.com/single.jpg',
        }),
    })

    const result = await generateImages({ prompt: 'test', pollIntervalMs: 0 })
    expect(result.urls).toEqual(['https://cdn.replicate.com/single.jpg'])
  })

  it('returns error on failed prediction status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'pred-789', status: 'starting' }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'pred-789',
          status: 'failed',
          error: 'CUDA out of memory',
        }),
    })

    const result = await generateImages({ prompt: 'test', pollIntervalMs: 0 })
    expect(result.urls).toEqual([])
    expect(result.error).toBeTruthy()
  })

  it('returns timeout error when max polling attempts exceeded', async () => {
    // POST create prediction
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'pred-long', status: 'starting' }),
    })
    // All polling calls return 'processing'
    for (let i = 0; i < 60; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'pred-long', status: 'processing' }),
      })
    }

    const result = await generateImages({ prompt: 'test', pollIntervalMs: 0 })
    expect(result.urls).toEqual([])
    expect(result.error).toMatch(/timeout/i)
  })

  it('returns error when prediction creation fails (non-ok HTTP)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({ detail: 'Invalid model version abc123' }),
    })

    const result = await generateImages({ prompt: 'test' })
    expect(result.urls).toEqual([])
    expect(result.error).toBeTruthy()
  })

  it('does NOT leak API error detail to caller (security)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          detail: 'SECRET_INTERNAL_ERROR: token=sk-abc123 model_version=xyz',
        }),
    })

    const result = await generateImages({ prompt: 'test' })
    // The raw detail string must NOT appear in the error returned to caller
    expect(result.error).not.toContain('SECRET_INTERNAL_ERROR')
    expect(result.error).not.toContain('sk-abc123')
    expect(result.error).not.toContain('token=')
    expect(result.error).toBeTruthy()
  })

  it('returns generic error when polling status check fails (non-ok)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'pred-err', status: 'starting' }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    })

    const result = await generateImages({ prompt: 'test', pollIntervalMs: 0 })
    expect(result.urls).toEqual([])
    expect(result.error).toBeTruthy()
  })

  it('uses REPLICATE_MODEL_VERSION env var when set', async () => {
    process.env.REPLICATE_MODEL_VERSION = 'custom-version-hash-999'

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'pred-v', status: 'starting' }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'pred-v',
          status: 'succeeded',
          output: ['https://cdn.example.com/img.jpg'],
        }),
    })

    await generateImages({ prompt: 'test', pollIntervalMs: 0 })

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(callBody.version).toBe('custom-version-hash-999')
  })

  it('uses default hardcoded version when REPLICATE_MODEL_VERSION is not set', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'pred-def', status: 'starting' }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'pred-def',
          status: 'succeeded',
          output: ['https://cdn.example.com/img.jpg'],
        }),
    })

    await generateImages({ prompt: 'test', pollIntervalMs: 0 })

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    // Should use the default hardcoded version
    expect(typeof callBody.version).toBe('string')
    expect(callBody.version.length).toBeGreaterThan(10)
  })

  it('returns error on unexpected fetch throw during creation', async () => {
    mockFetch.mockRejectedValueOnce(new Error('DNS lookup failed'))

    const result = await generateImages({ prompt: 'test' })
    expect(result.urls).toEqual([])
    expect(result.error).toBeTruthy()
  })

  it('returns unknown error string when thrown value is not an Error instance', async () => {
    // Simulate a non-Error thrown value (e.g. a string or plain object)
    mockFetch.mockRejectedValueOnce('network unavailable')

    const result = await generateImages({ prompt: 'test' })
    expect(result.urls).toEqual([])
    expect(result.error).toBeTruthy()
  })

  it('handles predictionRes.json() rejection gracefully (catch fallback)', async () => {
    // predictionRes.ok is false AND json() rejects — exercises .catch(() => ({}))
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error('not json')),
    })

    const result = await generateImages({ prompt: 'test' })
    expect(result.urls).toEqual([])
    expect(result.error).toBe('Failed to create prediction')
  })
})

// ---------------------------------------------------------------------------
// downloadImage
// ---------------------------------------------------------------------------

describe('downloadImage', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns buffer on successful download', async () => {
    const fakeBuffer = Buffer.from('fake image').buffer
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeBuffer),
    })

    const result = await downloadImage('https://cdn.replicate.com/img.jpg')
    expect(result.error).toBeUndefined()
    expect(result.buffer).toBeDefined()
    expect(typeof (result.buffer as ArrayBuffer).byteLength).toBe('number')
  })

  it('returns error on non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    })

    const result = await downloadImage('https://cdn.replicate.com/img.jpg')
    expect(result.buffer).toBeUndefined()
    expect(result.error).toContain('403')
  })

  it('returns error when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network timeout'))

    const result = await downloadImage('https://cdn.replicate.com/img.jpg')
    expect(result.buffer).toBeUndefined()
    expect(result.error).toBeTruthy()
  })

  it('returns error for empty URL', async () => {
    const result = await downloadImage('')
    expect(result.buffer).toBeUndefined()
    expect(result.error).toBeTruthy()
  })

  it('uses AbortController signal when fetching', async () => {
    // Capture the signal passed to fetch
    let capturedSignal: AbortSignal | undefined
    mockFetch.mockImplementationOnce((_url: string, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal | undefined
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('data').buffer),
      })
    })

    await downloadImage('https://cdn.replicate.com/img.jpg')

    // Verify that an AbortSignal was passed to fetch
    expect(capturedSignal).toBeDefined()
    expect(capturedSignal).toBeInstanceOf(AbortSignal)
  })

  it('returns error when AbortController aborts (timeout simulation)', async () => {
    mockFetch.mockImplementationOnce(
      (_url: string, _init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          // Simulate abort by rejecting with a DOMException
          const error = new DOMException('The operation was aborted.', 'AbortError')
          setTimeout(() => reject(error), 0)
        })
    )

    const result = await downloadImage('https://cdn.replicate.com/img.jpg')
    expect(result.buffer).toBeUndefined()
    expect(result.error).toBeTruthy()
  })

  it('returns unknown download error string when thrown value is not an Error instance', async () => {
    mockFetch.mockRejectedValueOnce('plain string rejection')

    const result = await downloadImage('https://cdn.replicate.com/img.jpg')
    expect(result.buffer).toBeUndefined()
    expect(result.error).toBe('Unknown download error')
  })

  it('AbortController callback fires and aborts the request (fake timers)', async () => {
    jest.useFakeTimers()

    let rejectFetch!: (reason: unknown) => void
    mockFetch.mockImplementationOnce((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        rejectFetch = reject
        // When signal aborts, reject with AbortError
        if (init?.signal) {
          (init.signal as AbortSignal).addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }
      })
    })

    const downloadPromise = downloadImage('https://cdn.replicate.com/img.jpg')

    // Advance timers to trigger the 30-second AbortController timeout
    jest.advanceTimersByTime(30001)

    const result = await downloadPromise
    expect(result.buffer).toBeUndefined()
    expect(result.error).toBeTruthy()

    jest.useRealTimers()
  })
})
