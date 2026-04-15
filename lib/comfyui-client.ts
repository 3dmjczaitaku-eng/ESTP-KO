/**
 * ComfyUI API Client
 * Interfaces with local ComfyUI server for video generation
 */

const COMFYUI_API_URL = 'http://localhost:8188'

/** Timeout for API requests in milliseconds */
const API_TIMEOUT_MS = 60_000

/** Polling interval for job completion in milliseconds */
const POLL_INTERVAL_MS = 5_000

/** Maximum polling attempts (5 seconds * 120 = 10 minutes) */
const MAX_POLL_ATTEMPTS = 120

export interface ComfyUIUploadResult {
  name: string
  subfolder: string
  type: string
}

export interface ComfyUIPromptResponse {
  prompt_id: string
}

export interface ComfyUIHistoryEntry {
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
}

export interface ComfyUIHistory {
  [promptId: string]: ComfyUIHistoryEntry
}

export interface ComfyUIDownloadResult {
  buffer: ArrayBuffer
  filename: string
}

export class ComfyUIError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ComfyUIError'
  }
}

/**
 * Upload image to ComfyUI server
 */
export async function uploadImage(
  filePath: string,
  imageBuffer: ArrayBuffer,
  subfolder: string = '',
): Promise<ComfyUIUploadResult> {
  const fileName = filePath.split('/').pop() || 'image.jpg'
  const formData = new FormData()

  formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), fileName)
  if (subfolder) {
    formData.append('subfolder', subfolder)
  }

  try {
    const response = await fetchWithTimeout(
      `${COMFYUI_API_URL}/upload/image`,
      {
        method: 'POST',
        body: formData,
      },
      API_TIMEOUT_MS,
    )

    if (!response.ok) {
      throw new ComfyUIError(
        'UPLOAD_FAILED',
        `Upload failed: ${response.statusText}`,
      )
    }

    return (await response.json()) as ComfyUIUploadResult
  } catch (error) {
    if (error instanceof ComfyUIError) throw error
    throw new ComfyUIError(
      'UPLOAD_ERROR',
      `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Submit workflow to ComfyUI
 */
export async function submitWorkflow(
  workflow: Record<string, unknown>,
): Promise<string> {
  try {
    const response = await fetchWithTimeout(
      `${COMFYUI_API_URL}/prompt`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
      },
      API_TIMEOUT_MS,
    )

    if (!response.ok) {
      throw new ComfyUIError(
        'SUBMIT_FAILED',
        `Workflow submission failed: ${response.statusText}`,
      )
    }

    const data = (await response.json()) as ComfyUIPromptResponse
    return data.prompt_id
  } catch (error) {
    if (error instanceof ComfyUIError) throw error
    throw new ComfyUIError(
      'SUBMIT_ERROR',
      `Failed to submit workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Poll for workflow completion
 */
export async function pollForCompletion(
  promptId: string,
  pollIntervalMs: number = POLL_INTERVAL_MS,
  maxAttempts: number = MAX_POLL_ATTEMPTS,
): Promise<ComfyUIHistoryEntry> {
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetchWithTimeout(
        `${COMFYUI_API_URL}/history/${promptId}`,
        { method: 'GET' },
        API_TIMEOUT_MS,
      )

      if (!response.ok) {
        throw new ComfyUIError(
          'HISTORY_FAILED',
          `Failed to fetch history: ${response.statusText}`,
        )
      }

      const history = (await response.json()) as ComfyUIHistory
      if (history[promptId]) {
        return history[promptId]
      }
    } catch (error) {
      if (error instanceof ComfyUIError) throw error
      throw new ComfyUIError(
        'POLL_ERROR',
        `Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }

    attempts++
    if (attempts < maxAttempts) {
      await sleep(pollIntervalMs)
    }
  }

  throw new ComfyUIError(
    'TIMEOUT',
    `Workflow did not complete within ${maxAttempts * pollIntervalMs}ms`,
  )
}

/**
 * Download output file from ComfyUI
 */
export async function downloadOutput(
  filename: string,
  subfolder: string = 'output',
): Promise<ComfyUIDownloadResult> {
  try {
    const response = await fetchWithTimeout(
      `${COMFYUI_API_URL}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=output`,
      { method: 'GET' },
      API_TIMEOUT_MS,
    )

    if (!response.ok) {
      throw new ComfyUIError(
        'DOWNLOAD_FAILED',
        `Download failed: ${response.statusText}`,
      )
    }

    const buffer = await response.arrayBuffer()
    return { buffer, filename }
  } catch (error) {
    if (error instanceof ComfyUIError) throw error
    throw new ComfyUIError(
      'DOWNLOAD_ERROR',
      `Failed to download output: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
