# Asset Generation Guide

Generate iPhone product images using Replicate API (Stable Diffusion).

## Prerequisites

1. **Replicate Account**: Sign up at https://replicate.com
2. **API Token**: Get from https://replicate.com/account/api-tokens
3. **Credits**: Free tier includes ~30 image generations

## Setup

```bash
# Set API token
export REPLICATE_API_TOKEN=your_token_here

# Generate images
npm run generate:assets
```

## What Gets Generated

- `public/images/iphone-angle-1.jpg` — Front angle
- `public/images/iphone-angle-2.jpg` — Side profile
- `public/images/iphone-angle-3.jpg` — Back design

`public/assets.json` is automatically updated with new image paths.

## Customizing Prompts

Edit `scripts/generate-assets.ts` → `ASSETS_CONFIG.prompts` array:

```typescript
{
  name: 'Custom View',
  prompt: 'Your detailed image description',
  filename: 'iphone-custom.jpg',
}
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `REPLICATE_API_TOKEN not set` | Run `export REPLICATE_API_TOKEN=...` |
| `Quota exceeded` | Wait 24h for quota reset or upgrade account |
| `Download failed` | Network issue; retry script |
| `Timeout` | Generation took >5min; try simpler prompt |

## Using Stock Images (Alternative)

If you don't want to use Replicate:

1. Download images from Unsplash, Pexels
2. Save to `public/images/`
3. Manually update `public/assets.json`

Example:
```json
{
  "src": "/images/iphone-angle-1.jpg",
  "alt": "iPhone 17 Pro - Front angle",
  "name": "Front angle"
}
```

## Next Steps

Once images are generated, site will display them on scroll. Test locally:

```bash
npm run dev
# Visit http://localhost:3000
```
