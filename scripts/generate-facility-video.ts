#!/usr/bin/env node

/**
 * Generate facility videos from photos using ComfyUI + FFmpeg
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/generate-facility-video.ts
 *     --photos ./photos/facility
 *     --output ./public/videos
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { generatePromptsFromFile } from '../lib/prompt-generator'
import { generateWan21Workflow } from '../lib/wan21-workflow'
import {
  uploadImage,
  submitWorkflow,
  pollForCompletion,
  downloadOutput,
  ComfyUIError,
} from '../lib/comfyui-client'
import { convertToWebM } from '../lib/video-converter'

interface Options {
  photos: string
  output: string
  resolution?: string
}

function parseArgs(): Options {
  const args = process.argv.slice(2)
  const options: Options = {
    photos: './photos/facility',
    output: './public/videos',
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--photos' && args[i + 1]) {
      options.photos = args[i + 1]
      i++
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1]
      i++
    } else if (args[i] === '--resolution' && args[i + 1]) {
      options.resolution = args[i + 1]
      i++
    }
  }

  return options
}

async function processPhoto(
  photoPath: string,
  photosDir: string,
  outputDir: string,
): Promise<void> {
  const fileName = path.basename(photoPath, path.extname(photoPath))
  const relativeDir = path.relative(photosDir, path.dirname(photoPath))
  const uploadSubfolder = relativeDir || 'input'

  console.log(`Processing: ${fileName}`)

  // Step 1: Read image and generate prompts
  let positivePrompt: string
  let negativePrompt: string

  try {
    const prompts = await generatePromptsFromFile(photoPath)
    positivePrompt = prompts.positivePrompt
    negativePrompt = prompts.negativePrompt
    console.log(`  ✓ Generated prompts`)
  } catch (error) {
    console.error(`  ✗ Failed to generate prompts:`, error)
    return
  }

  // Step 2: Generate Wan2.1 workflow
  const workflow = generateWan21Workflow({
    imageFileName: path.basename(photoPath),
    imageSubfolder: uploadSubfolder,
    positivePrompt,
    negativePrompt,
    seed: Math.floor(Math.random() * 1000000),
  })
  console.log(`  ✓ Generated Wan2.1 workflow`)

  // Step 3: Upload image to ComfyUI
  let imageData: Buffer

  try {
    imageData = await fs.readFile(photoPath)
  } catch (error) {
    console.error(`  ✗ Failed to read image:`, error)
    return
  }

  try {
    await uploadImage(photoPath, imageData as any, uploadSubfolder)
    console.log(`  ✓ Uploaded image to ComfyUI`)
  } catch (error) {
    console.error(`  ✗ Failed to upload image:`, error)
    return
  }

  // Step 4: Submit workflow
  let promptId: string

  try {
    promptId = await submitWorkflow(workflow)
    console.log(`  ✓ Submitted workflow (ID: ${promptId})`)
  } catch (error) {
    console.error(`  ✗ Failed to submit workflow:`, error)
    return
  }

  // Step 5: Poll for completion
  let history

  try {
    history = await pollForCompletion(promptId)
    console.log(`  ✓ Workflow completed`)
  } catch (error) {
    console.error(`  ✗ Workflow failed:`, error)
    return
  }

  // Step 6: Download output video
  let videoBuffer: ArrayBuffer

  try {
    const result = await downloadOutput('output.mp4', 'output')
    videoBuffer = result.buffer
    console.log(`  ✓ Downloaded output video`)
  } catch (error) {
    console.error(`  ✗ Failed to download video:`, error)
    return
  }

  // Step 7: Convert to WebM
  const tempMp4 = path.join(outputDir, `${fileName}-temp.mp4`)

  try {
    // Write temporary MP4
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(tempMp4, Buffer.from(videoBuffer))

    // Convert to WebM
    const { webmPath, posterPath } = await convertToWebM(tempMp4, outputDir, fileName)

    // Clean up temp MP4
    await fs.rm(tempMp4, { force: true })

    console.log(`  ✓ Converted to WebM: ${webmPath}`)
    console.log(`  ✓ Extracted poster: ${posterPath}`)
  } catch (error) {
    console.error(`  ✗ Failed to convert video:`, error)
    return
  }
}

async function main() {
  const options = parseArgs()

  console.log('Facility Video Generator')
  console.log(`Photos dir: ${options.photos}`)
  console.log(`Output dir: ${options.output}`)
  console.log('')

  // Find all photos
  let photos: string[] = []

  try {
    const files = await fs.readdir(options.photos, { recursive: true })
    photos = files
      .filter((f) => typeof f === 'string' && /\.(jpg|jpeg|png)$/i.test(f))
      .map((f) => path.join(options.photos, f as string))
  } catch (error) {
    console.error('Failed to read photos directory:', error)
    process.exit(1)
  }

  if (photos.length === 0) {
    console.log('No photos found.')
    return
  }

  console.log(`Found ${photos.length} photo(s)\n`)

  // Process each photo
  for (const photoPath of photos) {
    try {
      await processPhoto(photoPath, options.photos, options.output)
    } catch (error) {
      console.error(`Error processing ${photoPath}:`, error)
    }
    console.log('')
  }

  console.log('Done!')
}

main().catch(console.error)
