/**
 * Replicate API Client
 * Generates product images via Stable Diffusion
 */

const REPLICATE_API_URL = 'https://api.replicate.com/v1'

/**
 * Default model version (Stable Diffusion 3).
 * Can be overridden via REPLICATE_MODEL_VERSION environment variable.
 */
const DEFAULT_MODEL_VERSION =
  'a9edd823462c3cedf3b66a3bab018e9c694057f747a2d2a280bd124df8d6f01b'

/** Timeout for image download requests in milliseconds. */
const DOWNLOAD_TIMEOUT_MS = 30_000

export interface ImageGenerationParams {
  prompt: string;
  numOutputs?: number;
  width?: number;
  height?: number;
  negativePrompt?: string;
  schedulerName?: string;
  /** Polling interval in milliseconds. Defaults to 5000. Overridable for testing. */
  pollIntervalMs?: number;
}

export interface ImageGenerationResult {
  urls: string[];
  error?: string;
}

export interface DownloadResult {
  buffer?: ArrayBuffer;
  error?: string;
}

/**
 * Generate images using Replicate API.
 * Requires REPLICATE_API_TOKEN environment variable.
 *
 * The model version defaults to DEFAULT_MODEL_VERSION but can be
 * overridden via the REPLICATE_MODEL_VERSION environment variable.
 *
 * API error details are never forwarded to the caller to prevent
 * information leakage. Internal details are logged server-side only.
 */
export async function generateImages(
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return {
      urls: [],
      error: 'REPLICATE_API_TOKEN not set',
    }
  }

  const modelVersion =
    process.env.REPLICATE_MODEL_VERSION || DEFAULT_MODEL_VERSION
  const pollIntervalMs = params.pollIntervalMs ?? 5000

  try {
    // Create prediction
    const predictionRes = await fetch(
      `${REPLICATE_API_URL}/predictions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: modelVersion,
          input: {
            prompt: params.prompt,
            num_outputs: params.numOutputs || 1,
            width: params.width || 512,
            height: params.height || 512,
            negative_prompt:
              params.negativePrompt ||
              'blurry, low quality, distorted',
            scheduler: params.schedulerName || 'normal',
          },
        }),
      }
    )

    if (!predictionRes.ok) {
      // Log details server-side only; never expose to caller
      const detail = await predictionRes.json().catch(() => ({}))
      console.error('[replicate] prediction creation failed:', detail)
      return {
        urls: [],
        error: 'Failed to create prediction',
      }
    }

    let prediction = await predictionRes.json()

    // Poll for completion (max 5 minutes)
    let attempts = 0
    const maxAttempts = 60
    while (
      (prediction.status === 'starting' ||
        prediction.status === 'processing') &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
      attempts++

      const checkRes = await fetch(
        `${REPLICATE_API_URL}/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Token ${token}`,
          },
        }
      )

      if (!checkRes.ok) {
        return {
          urls: [],
          error: 'Failed to check prediction status',
        }
      }

      prediction = await checkRes.json()
    }

    if (prediction.status === 'succeeded' && prediction.output) {
      return {
        urls: Array.isArray(prediction.output)
          ? prediction.output
          : [prediction.output],
      }
    }

    if (prediction.status === 'failed') {
      // Log internal error server-side; return generic message to caller
      console.error('[replicate] prediction failed:', prediction.error)
      return {
        urls: [],
        error: 'Prediction failed',
      }
    }

    return {
      urls: [],
      error: 'Prediction timeout',
    }
  } catch (err) {
    console.error('[replicate] unexpected error:', err)
    return {
      urls: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Downloads an image from a URL and returns its ArrayBuffer.
 * Uses AbortController to enforce a 30-second timeout.
 * Returns a DownloadResult (never throws).
 */
export async function downloadImage(url: string): Promise<DownloadResult> {
  if (!url) {
    return { error: 'URL must not be empty' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      return { error: `HTTP ${response.status}: ${response.statusText}` }
    }
    const buffer = await response.arrayBuffer()
    return { buffer }
  } catch (err) {
    clearTimeout(timeoutId)
    return {
      error: err instanceof Error ? err.message : 'Unknown download error',
    }
  }
}
