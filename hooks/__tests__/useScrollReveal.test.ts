/**
 * useScrollReveal — unit tests
 *
 * Spec:
 * - Returns a ref object
 * - Does not throw when container has no matching elements
 * - Respects prefers-reduced-motion (no GSAP calls when reduced motion)
 */

import { renderHook } from '@testing-library/react'
import { useScrollReveal } from '../useScrollReveal'

// GSAP is mocked via __mocks__/gsap.ts (moduleNameMapper in jest.config)
import gsap from 'gsap'

describe('useScrollReveal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.matchMedia = jest.fn().mockReturnValue({ matches: false })
  })

  it('returns a ref object', () => {
    const { result } = renderHook(() => useScrollReveal())
    expect(result.current).toHaveProperty('current')
  })

  it('does not throw when containerRef is null', () => {
    expect(() => {
      renderHook(() => useScrollReveal())
    }).not.toThrow()
  })

  it('skips GSAP when prefers-reduced-motion is set', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true })
    renderHook(() => useScrollReveal())
    expect(gsap.from).not.toHaveBeenCalled()
  })

  it('accepts custom selector and options', () => {
    expect(() => {
      renderHook(() => useScrollReveal('.custom', { stagger: 0.2, duration: 0.8, y: 60 }))
    }).not.toThrow()
  })
})
