/**
 * Prompt Generator using Claude Vision
 * Analyzes facility photos and generates prompts for Wan2.1-I2V video generation
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs/promises'

export interface PromptGenerationResult {
  positivePrompt: string
  negativePrompt: string
}

const NEGATIVE_PROMPT_TEMPLATE =
  'blur, distortion, unrealistic motion, artifacts, low quality, flickering, abrupt cuts, watermark, text, logo'

const POSITIVE_PROMPT_TEMPLATE = (sceneDescription: string): string => {
  return `${sceneDescription}, creative workspace, soft natural lighting, subtle realistic motion, people working, documentary style, cinematic, high quality, smooth movement`
}

export class PromptGeneratorError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'PromptGeneratorError'
  }
}

/**
 * Generate prompts from an image file using Claude Vision
 */
export async function generatePromptsFromFile(
  imagePath: string,
): Promise<PromptGenerationResult> {
  try {
    // Read image file
    const imageBuffer = await fs.readFile(imagePath)
    const base64Image = imageBuffer.toString('base64')

    // Determine media type from file extension
    const ext = imagePath.split('.').pop()?.toLowerCase()
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
    if (ext === 'png') mediaType = 'image/png'
    else if (ext === 'gif') mediaType = 'image/gif'
    else if (ext === 'webp') mediaType = 'image/webp'

    return await generatePromptsFromBase64(base64Image, mediaType)
  } catch (error) {
    if (error instanceof PromptGeneratorError) throw error
    throw new PromptGeneratorError(
      'FILE_READ_ERROR',
      `Failed to read image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Generate prompts from base64-encoded image using Claude Vision
 */
export async function generatePromptsFromBase64(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg',
): Promise<PromptGenerationResult> {
  try {
    const client = new Anthropic()

    // Call Claude Vision API
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this facility/workspace image and generate a prompt for an AI video generation model (Wan2.1-I2V).

The prompt should:
1. Describe the scene concisely (what you see - people, objects, environment)
2. Focus on elements that suggest natural, subtle motion (breathing, working hands, slight head turns)
3. Avoid mention of camera motion
4. Be suitable for documentary-style video generation

Return ONLY the scene description in a single line, without any preamble or explanation.
Example: "Modern office with people working at desks, natural sunlight streaming through large windows"`,
            },
          ],
        },
      ],
    })

    // Extract text response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    if (!responseText.trim()) {
      throw new PromptGeneratorError(
        'INVALID_RESPONSE',
        'Claude Vision returned empty response',
      )
    }

    const sceneDescription = responseText.trim()
    const positivePrompt = POSITIVE_PROMPT_TEMPLATE(sceneDescription)
    const negativePrompt = NEGATIVE_PROMPT_TEMPLATE

    return {
      positivePrompt,
      negativePrompt,
    }
  } catch (error) {
    if (error instanceof PromptGeneratorError) throw error
    throw new PromptGeneratorError(
      'CLAUDE_API_ERROR',
      `Failed to generate prompts: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Batch generate prompts for multiple images
 */
export async function generatePromptsForImages(
  imagePaths: string[],
): Promise<Array<{ path: string; prompts: PromptGenerationResult; error?: string }>> {
  const results = []

  for (const imagePath of imagePaths) {
    try {
      const prompts = await generatePromptsFromFile(imagePath)
      results.push({ path: imagePath, prompts })
    } catch (error) {
      results.push({
        path: imagePath,
        prompts: {
          positivePrompt: '',
          negativePrompt: NEGATIVE_PROMPT_TEMPLATE,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}
