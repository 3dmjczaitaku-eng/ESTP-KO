import { renderHook } from '@testing-library/react'
import { useMediaLoaded, useStaggerAnimation } from '@/lib/hooks'

describe('useMediaLoaded', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useMediaLoaded())
    expect(result.current.isLoaded).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('initializes with provided state', () => {
    const { result } = renderHook(() => useMediaLoaded(true))
    expect(result.current.isLoaded).toBe(true)
  })

  it('has onLoad callback', () => {
    const { result } = renderHook(() => useMediaLoaded())
    expect(typeof result.current.onLoad).toBe('function')
  })

  it('has onError callback', () => {
    const { result } = renderHook(() => useMediaLoaded())
    expect(typeof result.current.onError).toBe('function')
  })
})

describe('useStaggerAnimation', () => {
  it('returns array of delays', () => {
    const { result } = renderHook(() => useStaggerAnimation(3, 0.1))
    expect(Array.isArray(result.current)).toBe(true)
    expect(result.current.length).toBe(3)
  })

  it('calculates correct delays', () => {
    const { result } = renderHook(() => useStaggerAnimation(3, 0.1))
    expect(result.current[0]).toBe(0)
    expect(result.current[1]).toBe(0.1)
    expect(result.current[2]).toBe(0.2)
  })

  it('uses default base delay', () => {
    const { result } = renderHook(() => useStaggerAnimation(2))
    expect(result.current[1]).toBe(0.1)
  })
})
