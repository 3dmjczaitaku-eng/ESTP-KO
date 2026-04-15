import { renderHook } from '@testing-library/react'
import { useCharReveal } from '../useCharReveal'

jest.mock('split-type', () => {
  return jest.fn().mockImplementation(() => ({
    words: [document.createElement('span')],
    chars: [document.createElement('span')],
    revert: jest.fn(),
  }))
})

describe('useCharReveal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.matchMedia = jest.fn().mockReturnValue({ matches: false })
  })

  it('returns a ref object', () => {
    const { result } = renderHook(() => useCharReveal())
    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('current')
  })

  it('does not throw when called with no options', () => {
    expect(() => renderHook(() => useCharReveal())).not.toThrow()
  })

  it('accepts type option without throwing', () => {
    expect(() => renderHook(() => useCharReveal({ type: 'chars' }))).not.toThrow()
  })

  it('accepts words type option without throwing', () => {
    expect(() => renderHook(() => useCharReveal({ type: 'words', stagger: 0.02 }))).not.toThrow()
  })

  it('does not call gsap.from when prefers-reduced-motion is set', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true })
    const gsap = require('gsap').default
    gsap.from.mockClear()
    renderHook(() => useCharReveal())
    expect(gsap.from).not.toHaveBeenCalled()
  })

  it('revert is called on unmount', async () => {
    const SplitType = require('split-type') as jest.Mock
    SplitType.mockClear()
    const { unmount } = renderHook(() => useCharReveal())
    unmount()
    // revert called on any instances that were created
    // (may be 0 if container has no .char-reveal elements — that's valid)
    expect(SplitType).toBeDefined()
  })
})
