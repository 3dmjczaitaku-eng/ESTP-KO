/**
 * Asset Configuration System
 * Provides centralized management of all media assets (images, videos, etc.)
 * Allows runtime switching between local, CDN, and AI-generated assets
 */

export interface Asset {
  src: string;
  fallback?: string;
  alt: string;
  name?: string;
}

export interface AssetCollection {
  hero_video: Asset;
  product_images: Asset[];
  tech_specs_icons?: Asset[];
  [key: string]: Asset | Asset[] | undefined;
}

/**
 * Load asset manifest from public/assets.json
 * Falls back to in-memory defaults if file unavailable
 */
async function loadAssetManifest(): Promise<AssetCollection> {
  try {
    const res = await fetch('/assets.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load assets.json');
    return res.json();
  } catch (err) {
    console.warn('Could not load assets.json, using defaults:', err);
    return DEFAULT_ASSETS;
  }
}

/**
 * Default asset collection (used as fallback)
 * All paths point to local placeholders
 */
const DEFAULT_ASSETS: AssetCollection = {
  hero_video: {
    src: '/videos/iphone-hero.mp4',
    fallback: '/images/iphone-hero-fallback.jpg',
    alt: 'iPhone 17 Pro hero animation',
    name: 'Hero Video',
  },
  product_images: [
    {
      src: '/images/iphone-angle-1.jpg',
      alt: 'iPhone 17 Pro - Front angle',
      name: 'Front angle',
    },
    {
      src: '/images/iphone-angle-2.jpg',
      alt: 'iPhone 17 Pro - Side profile',
      name: 'Side profile',
    },
    {
      src: '/images/iphone-angle-3.jpg',
      alt: 'iPhone 17 Pro - Back design',
      name: 'Back design',
    },
  ],
};

/**
 * Global cache for asset manifest (lazy loaded)
 */
let assetCache: AssetCollection | null = null;

/**
 * Get asset from manifest by key
 * Supports dot notation for nested access (e.g., 'hero_video.src')
 */
export async function getAsset(
  key: string,
  defaultValue?: string
): Promise<string> {
  if (!assetCache) {
    assetCache = await loadAssetManifest();
  }

  const keys = key.split('.');
  let value: any = assetCache;

  for (const k of keys) {
    value = value?.[k];
  }

  return value ?? defaultValue ?? '';
}

/**
 * Get all assets or filtered by type
 */
export async function getAllAssets(): Promise<AssetCollection> {
  if (!assetCache) {
    assetCache = await loadAssetManifest();
  }
  return assetCache;
}

/**
 * Clear asset cache (useful for testing or forcing refresh)
 */
export function clearAssetCache(): void {
  assetCache = null;
}
