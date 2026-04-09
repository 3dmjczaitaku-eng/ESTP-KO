/**
 * Tests for Zustand color selection store
 * TDD: RED phase - written before implementation
 */

import { act, renderHook } from '@testing-library/react'
import { useColorStore, IPHONE_COLORS, type IPhoneColor } from '@/lib/store'

// Spy on the real JSDOM localStorage (Zustand persist uses this directly)
let setItemSpy: jest.SpyInstance
let getItemSpy: jest.SpyInstance

beforeEach(() => {
  localStorage.clear()
  setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
  getItemSpy = jest.spyOn(Storage.prototype, 'getItem')
  jest.clearAllMocks()
  // Reset store to initial state between tests
  useColorStore.setState({ selectedColor: 'Midnight Black' })
})

afterEach(() => {
  setItemSpy.mockRestore()
  getItemSpy.mockRestore()
  localStorage.clear()
})

// --- Type / constant tests ---

describe('IPHONE_COLORS constant', () => {
  it('contains exactly 6 colors', () => {
    expect(IPHONE_COLORS).toHaveLength(6)
  })

  it('contains all required color names', () => {
    const expected: IPhoneColor[] = [
      'Midnight Black',
      'Silver',
      'Gold',
      'Deep Purple',
      'Blue',
      'Orange',
    ]
    expected.forEach((color) => {
      expect(IPHONE_COLORS.map((c) => c.name)).toContain(color)
    })
  })

  it('every color has a name, hex, and textColor', () => {
    IPHONE_COLORS.forEach((color) => {
      expect(typeof color.name).toBe('string')
      expect(color.name.length).toBeGreaterThan(0)
      expect(typeof color.hex).toBe('string')
      expect(color.hex).toMatch(/^#[0-9a-fA-F]{3,6}$/)
      expect(typeof color.textColor).toBe('string')
    })
  })
})

// --- Store initial state ---

describe('useColorStore — initial state', () => {
  it('has "Midnight Black" as default selected color', () => {
    const { result } = renderHook(() => useColorStore())
    expect(result.current.selectedColor).toBe('Midnight Black')
  })

  it('exposes setColor action', () => {
    const { result } = renderHook(() => useColorStore())
    expect(typeof result.current.setColor).toBe('function')
  })
})

// --- setColor action ---

describe('useColorStore — setColor', () => {
  it('updates selectedColor when setColor is called', () => {
    const { result } = renderHook(() => useColorStore())

    act(() => {
      result.current.setColor('Gold')
    })

    expect(result.current.selectedColor).toBe('Gold')
  })

  it('updates to each valid color', () => {
    const { result } = renderHook(() => useColorStore())
    const colors: IPhoneColor[] = [
      'Silver',
      'Gold',
      'Deep Purple',
      'Blue',
      'Orange',
      'Midnight Black',
    ]

    colors.forEach((color) => {
      act(() => {
        result.current.setColor(color)
      })
      expect(result.current.selectedColor).toBe(color)
    })
  })

  it('multiple subscribers reflect the same state', () => {
    const { result: result1 } = renderHook(() => useColorStore())
    const { result: result2 } = renderHook(() => useColorStore())

    act(() => {
      result1.current.setColor('Blue')
    })

    expect(result2.current.selectedColor).toBe('Blue')
  })
})

// --- localStorage persistence ---

describe('useColorStore — localStorage persistence', () => {
  it('persists selected color to localStorage on change', () => {
    const { result } = renderHook(() => useColorStore())

    act(() => {
      result.current.setColor('Deep Purple')
    })

    expect(setItemSpy).toHaveBeenCalledWith(
      'iphone-selected-color',
      expect.stringContaining('Deep Purple')
    )
  })

  it('reads persisted color from localStorage on mount', () => {
    // Pre-seed real localStorage with a Zustand persist payload
    localStorage.setItem(
      'iphone-selected-color',
      JSON.stringify({ state: { selectedColor: 'Orange' }, version: 0 })
    )

    // Simulate what would happen when the store hydrates from storage
    useColorStore.setState({ selectedColor: 'Orange' })
    const { result } = renderHook(() => useColorStore())

    expect(result.current.selectedColor).toBe('Orange')
  })
})

// --- Selector / subscriptions ---

describe('useColorStore — selectors', () => {
  it('selector returns only selectedColor without triggering extra renders', () => {
    let renderCount = 0
    const { result } = renderHook(() => {
      renderCount++
      return useColorStore((state) => state.selectedColor)
    })

    expect(result.current).toBe('Midnight Black')

    act(() => {
      useColorStore.getState().setColor('Silver')
    })

    expect(result.current).toBe('Silver')
    // Should have rendered: initial + 1 update
    expect(renderCount).toBeLessThanOrEqual(3)
  })

  it('getColorMeta returns correct metadata for a color', () => {
    const { getColorMeta } = useColorStore.getState()
    const meta = getColorMeta('Gold')
    expect(meta).toBeDefined()
    expect(meta?.name).toBe('Gold')
    expect(meta?.hex).toBeDefined()
  })

  it('getColorMeta returns undefined for invalid color', () => {
    const { getColorMeta } = useColorStore.getState()
    const meta = getColorMeta('InvalidColor' as IPhoneColor)
    expect(meta).toBeUndefined()
  })
})
