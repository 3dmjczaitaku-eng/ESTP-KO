/**
 * Asset Generation Script
 * Generates product images via Replicate API and updates assets.json
 *
 * Usage:
 *   npx ts-node scripts/generate-assets.ts
 *
 * Environment:
 *   REPLICATE_API_TOKEN - Replicate API token (get from https://replicate.com/account)
 */

import fs from 'fs'
import path from 'path'
import { generateImages } from '../lib/replicate'

interface AssetConfig {
  prompts: Array<{
    name: string;
    prompt: string;
    filename: string;
  }>;
}

const ASSETS_CONFIG: AssetConfig = {
  prompts: [
    {
      name: 'Front angle',
      prompt:
        'Premium smartphone from the front, sleek glass and titanium design, product photography, studio lighting, white background, professional product shot, 4K',
      filename: 'iphone-angle-1.jpg',
    },
    {
      name: 'Side profile',
      prompt:
        'Smartphone from side angle, thin titanium frame, minimalist design, premium product photography, studio setup, white background, professional lighting, 4K',
      filename: 'iphone-angle-2.jpg',
    },
    {
      name: 'Back design',
      prompt:
        'Smartphone back view, camera module, matte finish titanium, product photography, studio lighting, clean white background, high quality, 4K',
      filename: 'iphone-angle-3.jpg',
    },
  ],
}

async function generateAssets() {
  console.log('🚀 Starting asset generation...')
  console.log(`📝 Will generate ${ASSETS_CONFIG.prompts.length} images\n`)

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    console.error(
      '❌ Error: REPLICATE_API_TOKEN not set.\n' +
        '   Set your token: export REPLICATE_API_TOKEN=your_token_here'
    )
    process.exit(1)
  }

  const imagesDir = path.join(process.cwd(), 'public', 'images')
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
    console.log(`✓ Created images directory: ${imagesDir}\n`)
  }

  const results = []

  for (const item of ASSETS_CONFIG.prompts) {
    console.log(`⏳ Generating: ${item.name}...`)
    console.log(`   Prompt: "${item.prompt.substring(0, 50)}..."`)

    const result = await generateImages({
      prompt: item.prompt,
      numOutputs: 1,
      width: 512,
      height: 512,
    })

    if (result.error) {
      console.error(`   ❌ Failed: ${result.error}`)
      results.push({
        name: item.name,
        success: false,
        error: result.error,
      })
    } else if (result.urls.length > 0) {
      const imageUrl = result.urls[0]
      console.log(`   ✓ Generated: ${imageUrl.substring(0, 50)}...`)

      // Download image from Replicate
      try {
        const response = await fetch(imageUrl)
        const buffer = await response.arrayBuffer()
        const filePath = path.join(imagesDir, item.filename)
        fs.writeFileSync(filePath, Buffer.from(buffer))
        console.log(`   ✓ Saved: public/images/${item.filename}\n`)

        results.push({
          name: item.name,
          success: true,
          filename: item.filename,
          url: imageUrl,
        })
      } catch (err) {
        console.error(`   ❌ Download failed: ${err}\n`)
        results.push({
          name: item.name,
          success: false,
          error: 'Download failed',
        })
      }
    }
  }

  // Update assets.json
  const assetsPath = path.join(process.cwd(), 'public', 'assets.json')
  const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'))

  assets.product_images = results
    .filter((r) => r.success)
    .map((r) => ({
      src: `/images/${r.filename}`,
      alt: `iPhone 17 Pro - ${r.name}`,
      name: r.name,
    }))

  fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2))
  console.log('✓ Updated assets.json')

  // Summary
  console.log('\n📊 Generation Summary:')
  console.log(`   Total: ${results.length}`)
  console.log(`   ✓ Success: ${results.filter((r) => r.success).length}`)
  console.log(`   ❌ Failed: ${results.filter((r) => !r.success).length}`)
}

// Run
generateAssets().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
