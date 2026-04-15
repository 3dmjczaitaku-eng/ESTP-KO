/**
 * ComfyUI API Client Tests
 *
 * Covers:
 *   - uploadImage: success path
 *   - uploadImage: fetch error
 *   - uploadImage: non-ok response
 *   - submitWorkflow: success path
 *   - submitWorkflow: fetch error
 *   - pollForCompletion: success on first attempt
 *   - pollForCompletion: success after polling
 *   - pollForCompletion: timeout (max attempts exceeded)
 *   - pollForCompletion: fetch error
 *   - downloadOutput: success path
 *   - downloadOutput: fetch error
 *   - ComfyUIError: proper error handling
 */

import {
  uploadImage,
  submitWorkflow,
  pollForCompletion,
  downloadOutput,
  ComfyUIError,
} from '@/lib/comfyui-client'

const mockFetch = global.fetch as jest.Mock

describe('ComfyUI API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('uploadImage', () => {
    it('uploads image successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'photo.jpg',
            subfolder: 'facility',
            type: 'input',
          }),
      })

      const buffer = new ArrayBuffer(100)
      const result = await uploadImage('path/to/photo.jpg', buffer, 'facility')

      expect(result.name).toBe('photo.jpg')
      expect(result.subfolder).toBe('facility')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload/image'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('throws ComfyUIError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      })

      const buffer = new ArrayBuffer(100)
      await expect(uploadImage('photo.jpg', buffer)).rejects.toThrow(ComfyUIError)
    })

    it('throws ComfyUIError on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const buffer = new ArrayBuffer(100)
      await expect(uploadImage('photo.jpg', buffer)).rejects.toThrow(ComfyUIError)
    })
  })

  describe('submitWorkflow', () => {
    it('submits workflow successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ prompt_id: 'prompt-123' }),
      })

      const workflow = { model: 'wan2.1-i2v' }
      const promptId = await submitWorkflow(workflow)

      expect(promptId).toBe('prompt-123')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/prompt'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('throws ComfyUIError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      })

      await expect(submitWorkflow({})).rejects.toThrow(ComfyUIError)
    })

    it('throws ComfyUIError on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(submitWorkflow({})).rejects.toThrow(ComfyUIError)
    })
  })

  describe('pollForCompletion', () => {
    it('returns history on first poll', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            'prompt-123': {
              inputs: { image: 'photo.jpg' },
              outputs: { video: 'output.mp4' },
            },
          }),
      })

      const result = await pollForCompletion('prompt-123', 100, 10)

      expect(result.inputs.image).toBe('photo.jpg')
      expect(result.outputs.video).toBe('output.mp4')
    })

    it('polls until completion', async () => {
      // First poll: not ready
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      // Second poll: ready
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            'prompt-456': {
              inputs: {},
              outputs: { video: 'output.mp4' },
            },
          }),
      })

      const result = await pollForCompletion('prompt-456', 0, 10)

      expect(result.outputs.video).toBe('output.mp4')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('throws ComfyUIError on timeout', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await expect(pollForCompletion('prompt-789', 0, 2)).rejects.toThrow(ComfyUIError)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('throws ComfyUIError on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(pollForCompletion('prompt-000', 100, 5)).rejects.toThrow(ComfyUIError)
    })
  })

  describe('downloadOutput', () => {
    it('downloads output successfully', async () => {
      const mockBuffer = new ArrayBuffer(1024)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockBuffer),
      })

      const result = await downloadOutput('output.mp4', 'output')

      expect(result.buffer).toBe(mockBuffer)
      expect(result.filename).toBe('output.mp4')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/view'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('throws ComfyUIError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      })

      await expect(downloadOutput('missing.mp4')).rejects.toThrow(ComfyUIError)
    })

    it('throws ComfyUIError on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(downloadOutput('output.mp4')).rejects.toThrow(ComfyUIError)
    })
  })

  describe('ComfyUIError', () => {
    it('constructs error with code and message', () => {
      const error = new ComfyUIError('TEST_ERROR', 'Test message')

      expect(error.code).toBe('TEST_ERROR')
      expect(error.message).toBe('Test message')
      expect(error.name).toBe('ComfyUIError')
    })

    it('instanceof Error', () => {
      const error = new ComfyUIError('TEST', 'message')

      expect(error instanceof Error).toBe(true)
      expect(error instanceof ComfyUIError).toBe(true)
    })
  })
})
