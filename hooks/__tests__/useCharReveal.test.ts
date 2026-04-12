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
})
