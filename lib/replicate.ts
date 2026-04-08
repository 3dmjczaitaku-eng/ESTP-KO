/**
 * Replicate API Client
 * Generates product images via Stable Diffusion
 */

const REPLICATE_API_URL = 'https://api.replicate.com/v1'

export interface ImageGenerationParams {
  prompt: string;
  numOutputs?: number;
  width?: number;
  height?: number;
  negativePrompt?: string;
  schedulerName?: string;
}

export interface ImageGenerationResult {
  urls: string[];
  error?: string;
}

/**
 * Generate images using Replicate API
 * Requires REPLICATE_API_TOKEN environment variable
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
          version:
            'a9edd823462c3cedf3b66a3bab018e9c694057f747a2d2a280bd124df8d6f01b', // Stable Diffusion 3
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
      const error = await predictionRes.json()
      return {
        urls: [],
        error: error.detail || 'Failed to create prediction',
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
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5s
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
      return {
        urls: [],
        error: prediction.error || 'Prediction failed',
      }
    }

    return {
      urls: [],
      error: 'Prediction timeout',
    }
  } catch (err) {
    return {
      urls: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
