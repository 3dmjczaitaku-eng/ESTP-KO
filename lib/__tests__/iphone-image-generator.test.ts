/**
 * TDD: iphone-image-generator
 *
 * RED phase — all tests are written before implementation exists.
 * These tests cover:
 *   - Type definitions and interfaces
 *   - Prompt generation logic (color x angle)
 *   - Filename derivation from color/angle
 *   - assets.json payload builder
 *   - Error handling for invalid inputs
 *   - Edge cases: empty inputs, special characters, unknown colors/angles
 */

import {
  buildPrompt,
  buildFilename,
  buildAssetsJson,
  extractColorFromUrl,
  IPHONE_COLORS,
  IPHONE_ANGLES,
  type IPhoneColor,
  type IPhoneAngle,
  type ColorImageSet,
  type GeneratedAssetsJson,
} from '@/lib/iphone-image-generator'

// ---------------------------------------------------------------------------
// buildPrompt
// ---------------------------------------------------------------------------

describe('buildPrompt', () => {
  it('includes the color name in the prompt', () => {
    const prompt = buildPrompt('Midnight Black', 'Front')
    expect(prompt.toLowerCase()).toContain('midnight black')
  })

  it('includes the angle keyword in the prompt', () => {
    const prompt = buildPrompt('Silver', 'Side')
    expect(prompt.toLowerCase()).toContain('side')
  })

  it('returns a non-empty string for all color/angle combinations', () => {
    for (const color of IPHONE_COLORS) {
      for (const angle of IPHONE_ANGLES) {
        const prompt = buildPrompt(color, angle)
        expect(typeof prompt).toBe('string')
        expect(prompt.length).toBeGreaterThan(10)
      }
    }
  })

  it('prompt contains quality keywords for product photography', () => {
    const prompt = buildPrompt('Gold', 'Back')
    const lower = prompt.toLowerCase()
    // Should mention studio-quality cues
    expect(
      lower.includes('product') ||
        lower.includes('studio') ||
        lower.includes('photography')
    ).toBe(true)
  })

  it('includes iPhone model reference', () => {
    const prompt = buildPrompt('Blue', 'Front')
    expect(prompt.toLowerCase()).toContain('iphone')
  })

  it('handles Deep Purple (space in name)', () => {
    const prompt = buildPrompt('Deep Purple', 'Front')
    expect(prompt.toLowerCase()).toContain('deep purple')
  })

  it('handles all defined angles individually', () => {
    expect(buildPrompt('Silver', 'Front')).toBeTruthy()
    expect(buildPrompt('Silver', 'Side')).toBeTruthy()
    expect(buildPrompt('Silver', 'Back')).toBeTruthy()
    expect(buildPrompt('Silver', 'Angle')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// buildFilename
// ---------------------------------------------------------------------------

describe('buildFilename', () => {
  it('produces a .jpg filename', () => {
    const name = buildFilename('Silver', 'Front')
    expect(name.endsWith('.jpg')).toBe(true)
  })

  it('uses lowercase and hyphens (no spaces)', () => {
    const name = buildFilename('Midnight Black', 'Front')
    expect(name).not.toContain(' ')
    expect(name).toMatch(/^[a-z0-9-]+\.jpg$/)
  })

  it('is unique per color+angle pair', () => {
    const names = new Set<string>()
    for (const color of IPHONE_COLORS) {
      for (const angle of IPHONE_ANGLES) {
        names.add(buildFilename(color, angle))
      }
    }
    // All combinations must produce distinct filenames
    expect(names.size).toBe(IPHONE_COLORS.length * IPHONE_ANGLES.length)
  })

  it('includes color slug in filename', () => {
    const name = buildFilename('Gold', 'Back')
    expect(name).toContain('gold')
  })

  it('includes angle slug in filename', () => {
    const name = buildFilename('Blue', 'Side')
    expect(name).toContain('side')
  })

  it('handles Deep Purple without spaces', () => {
    const name = buildFilename('Deep Purple', 'Front')
    expect(name).not.toContain(' ')
    expect(name).toMatch(/deep.purple/i)
  })
})

// ---------------------------------------------------------------------------
// extractColorFromUrl
// ---------------------------------------------------------------------------

describe('extractColorFromUrl', () => {
  it('extracts name from Replicate CDN URL', () => {
    const url =
      'https://replicate.delivery/pbxt/abc123/iphone-midnight-black-front.jpg'
    const name = extractColorFromUrl(url)
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(0)
  })

  it('returns the last path segment without extension', () => {
    const url = 'https://example.com/outputs/iphone-gold-back.jpg'
    const name = extractColorFromUrl(url)
    expect(name).toBe('iphone-gold-back')
  })

  it('handles URL without extension', () => {
    const url = 'https://example.com/outputs/iphone-blue-side'
    const name = extractColorFromUrl(url)
    expect(name).toBe('iphone-blue-side')
  })

  it('handles URL with query string', () => {
    const url = 'https://example.com/outputs/iphone-silver-front.jpg?token=abc'
    const name = extractColorFromUrl(url)
    expect(name).toBe('iphone-silver-front')
  })

  it('returns empty string for invalid URL', () => {
    const name = extractColorFromUrl('')
    expect(name).toBe('')
  })
})

// ---------------------------------------------------------------------------
// buildAssetsJson
// ---------------------------------------------------------------------------

describe('buildAssetsJson', () => {
  const mockColorSets: ColorImageSet[] = [
    {
      color: 'Silver',
      images: [
        { angle: 'Front', filename: 'iphone-silver-front.jpg', url: 'https://cdn.example.com/1.jpg' },
        { angle: 'Side', filename: 'iphone-silver-side.jpg', url: 'https://cdn.example.com/2.jpg' },
      ],
    },
    {
      color: 'Gold',
      images: [
        { angle: 'Front', filename: 'iphone-gold-front.jpg', url: 'https://cdn.example.com/3.jpg' },
      ],
    },
  ]

  it('returns object with hero_video preserved from existing assets', () => {
    const existing = {
      hero_video: {
        src: '/videos/hero.mp4',
        fallback: '/images/fallback.jpg',
        alt: 'hero',
        name: 'Hero Video',
      },
      product_images: [],
    }
    const result = buildAssetsJson(mockColorSets, existing)
    expect(result.hero_video).toEqual(existing.hero_video)
  })

  it('produces product_images array with correct structure', () => {
    const result = buildAssetsJson(mockColorSets, null)
    expect(Array.isArray(result.product_images)).toBe(true)
    expect(result.product_images.length).toBeGreaterThan(0)

    const first = result.product_images[0]
    expect(first).toHaveProperty('src')
    expect(first).toHaveProperty('alt')
    expect(first).toHaveProperty('name')
    expect(first.src).toMatch(/^\/images\//)
  })

  it('alt text contains color and angle', () => {
    const result = buildAssetsJson(mockColorSets, null)
    const silverFront = result.product_images.find(
      (img) => img.src.includes('silver') && img.src.includes('front')
    )
    expect(silverFront).toBeDefined()
    expect(silverFront!.alt.toLowerCase()).toContain('silver')
  })

  it('groups by color in color_sets when present', () => {
    const result = buildAssetsJson(mockColorSets, null)
    expect(result).toHaveProperty('color_sets')
    expect(Array.isArray(result.color_sets)).toBe(true)
    expect(result.color_sets!.length).toBe(2)
  })

  it('each color_set entry has color and images array', () => {
    const result = buildAssetsJson(mockColorSets, null)
    for (const set of result.color_sets!) {
      expect(set).toHaveProperty('color')
      expect(Array.isArray(set.images)).toBe(true)
    }
  })

  it('handles empty colorSets gracefully', () => {
    const result = buildAssetsJson([], null)
    expect(result.product_images).toEqual([])
    expect(result.color_sets).toEqual([])
  })

  it('uses default hero_video when existing is null', () => {
    const result = buildAssetsJson([], null)
    expect(result.hero_video).toBeDefined()
    expect(result.hero_video.src).toMatch(/\.mp4$|\.jpg$/)
  })
})

// ---------------------------------------------------------------------------
// IPHONE_COLORS and IPHONE_ANGLES constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('IPHONE_COLORS contains 6 colors', () => {
    expect(IPHONE_COLORS.length).toBe(6)
  })

  it('IPHONE_COLORS contains the expected colors', () => {
    const expected: IPhoneColor[] = [
      'Midnight Black',
      'Silver',
      'Gold',
      'Deep Purple',
      'Blue',
      'Orange',
    ]
    for (const color of expected) {
      expect(IPHONE_COLORS).toContain(color)
    }
  })

  it('IPHONE_ANGLES contains at least 3 angles', () => {
    expect(IPHONE_ANGLES.length).toBeGreaterThanOrEqual(3)
  })

  it('IPHONE_ANGLES contains Front, Side, Back', () => {
    expect(IPHONE_ANGLES).toContain('Front')
    expect(IPHONE_ANGLES).toContain('Side')
    expect(IPHONE_ANGLES).toContain('Back')
  })
})
