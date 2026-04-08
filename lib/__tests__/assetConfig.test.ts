import { getAsset, getAllAssets, clearAssetCache } from '@/lib/assetConfig'

describe('assetConfig', () => {
  beforeEach(() => {
    clearAssetCache()
  })

  describe('getAsset', () => {
    it('returns asset string value', async () => {
      const result = await getAsset('hero_video.src')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns empty string for missing key', async () => {
      const result = await getAsset('nonexistent.key')
      expect(result).toBe('')
    })

    it('uses default value when asset missing', async () => {
      const result = await getAsset('nonexistent.key', '/fallback.jpg')
      expect(result).toBe('/fallback.jpg')
    })
  })

  describe('getAllAssets', () => {
    it('returns asset collection', async () => {
      const assets = await getAllAssets()
      expect(assets).toHaveProperty('hero_video')
      expect(assets).toHaveProperty('product_images')
    })

    it('caches results on second call', async () => {
      const first = await getAllAssets()
      const second = await getAllAssets()
      expect(first).toBe(second) // Same reference (cached)
    })
  })

  describe('clearAssetCache', () => {
    it('clears cached assets', async () => {
      const first = await getAllAssets()
      clearAssetCache()
      const second = await getAllAssets()
      expect(first).not.toBe(second) // Different references (not cached)
    })
  })
})
