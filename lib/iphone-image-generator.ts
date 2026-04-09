/**
 * iPhone Image Generator — Pure Logic Layer
 *
 * Contains all pure functions for:
 *   - Prompt construction per color/angle
 *   - Filename derivation
 *   - URL metadata extraction
 *   - assets.json payload building
 *
 * No I/O — all side effects live in scripts/generate-iphone-images.ts
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IPhoneColor =
  | 'Midnight Black'
  | 'Silver'
  | 'Gold'
  | 'Deep Purple'
  | 'Blue'
  | 'Orange'

export type IPhoneAngle = 'Front' | 'Side' | 'Back' | 'Angle'

export interface ColorImageEntry {
  angle: IPhoneAngle
  filename: string
  url: string
}

export interface ColorImageSet {
  color: IPhoneColor
  images: ColorImageEntry[]
}

export interface AssetEntry {
  src: string
  alt: string
  name: string
  fallback?: string
}

export interface GeneratedAssetsJson {
  hero_video: AssetEntry
  product_images: AssetEntry[]
  color_sets?: Array<{
    color: IPhoneColor
    images: Array<{ angle: IPhoneAngle; src: string; alt: string }>
  }>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const IPHONE_COLORS: IPhoneColor[] = [
  'Midnight Black',
  'Silver',
  'Gold',
  'Deep Purple',
  'Blue',
  'Orange',
]

export const IPHONE_ANGLES: IPhoneAngle[] = ['Front', 'Side', 'Back', 'Angle']

const DEFAULT_HERO_VIDEO: AssetEntry = {
  src: '/videos/iphone-hero.mp4',
  fallback: '/images/iphone-hero-fallback.jpg',
  alt: 'iPhone 17 Pro hero animation',
  name: 'Hero Video',
}

// ---------------------------------------------------------------------------
// Angle descriptions for prompt construction
// ---------------------------------------------------------------------------

const ANGLE_DESCRIPTIONS: Record<IPhoneAngle, string> = {
  Front: 'front view, screen visible, face-on perspective',
  Side: 'side profile, thin titanium frame, side-on perspective',
  Back: 'back view, camera module, matte finish, rear perspective',
  Angle: 'three-quarter angle view, front and side visible, dynamic perspective',
}

// ---------------------------------------------------------------------------
// buildPrompt
// ---------------------------------------------------------------------------

/**
 * Builds a Stable Diffusion prompt for a specific iPhone color and angle.
 * Prompt is optimized for product photography quality.
 */
export function buildPrompt(color: IPhoneColor, angle: IPhoneAngle): string {
  const angleDesc = ANGLE_DESCRIPTIONS[angle]
  return (
    `iPhone 17 Pro in ${color.toLowerCase()} colorway, ` +
    `${angleDesc}, ` +
    `premium product photography, studio lighting, white background, ` +
    `highly detailed, sharp focus, 4K resolution, professional product shot, ` +
    `no text, no people`
  )
}

// ---------------------------------------------------------------------------
// buildFilename
// ---------------------------------------------------------------------------

/**
 * Derives a deterministic, URL-safe filename from a color and angle pair.
 * Example: ('Deep Purple', 'Front') => 'iphone-deep-purple-front.jpg'
 */
export function buildFilename(color: IPhoneColor, angle: IPhoneAngle): string {
  const colorSlug = color.toLowerCase().replace(/\s+/g, '-')
  const angleSlug = angle.toLowerCase()
  return `iphone-${colorSlug}-${angleSlug}.jpg`
}

// ---------------------------------------------------------------------------
// extractColorFromUrl
// ---------------------------------------------------------------------------

/**
 * Extracts the base filename (without extension) from a URL.
 * Handles query strings and fragment identifiers.
 *
 * Example:
 *   'https://cdn.example.com/outputs/iphone-gold-back.jpg?token=x'
 *   => 'iphone-gold-back'
 */
export function extractColorFromUrl(url: string): string {
  if (!url) return ''

  try {
    // Strip query string and fragment
    const cleanUrl = url.split('?')[0].split('#')[0]
    const lastSegment = cleanUrl.split('/').pop() ?? ''
    const withoutExt = lastSegment.replace(/\.[^.]+$/, '')
    return withoutExt
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// buildAssetsJson
// ---------------------------------------------------------------------------

/**
 * Constructs the full assets.json payload from a list of ColorImageSets.
 * Preserves the hero_video from existing assets if provided.
 */
export function buildAssetsJson(
  colorSets: ColorImageSet[],
  existing: GeneratedAssetsJson | null
): GeneratedAssetsJson {
  const heroVideo = existing?.hero_video ?? DEFAULT_HERO_VIDEO

  const productImages: AssetEntry[] = colorSets.flatMap((set) =>
    set.images.map((img) => ({
      src: `/images/${img.filename}`,
      alt: `iPhone 17 Pro ${set.color} - ${img.angle}`,
      name: `${set.color} - ${img.angle}`,
    }))
  )

  const builtColorSets = colorSets.map((set) => ({
    color: set.color,
    images: set.images.map((img) => ({
      angle: img.angle,
      src: `/images/${img.filename}`,
      alt: `iPhone 17 Pro ${set.color} - ${img.angle}`,
    })),
  }))

  return {
    hero_video: heroVideo,
    product_images: productImages,
    color_sets: builtColorSets,
  }
}
