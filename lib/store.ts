/**
 * Zustand store for iPhone color selection
 * Persists selection to localStorage via the persist middleware
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---- Types ----

export type IPhoneColor =
  | 'Midnight Black'
  | 'Silver'
  | 'Gold'
  | 'Deep Purple'
  | 'Blue'
  | 'Orange'

export interface ColorMeta {
  name: IPhoneColor
  hex: string
  textColor: 'white' | 'black'
  /** URL-friendly slug used in image paths */
  slug: string
}

export interface ColorState {
  selectedColor: IPhoneColor
  setColor: (color: IPhoneColor) => void
  getColorMeta: (color: IPhoneColor) => ColorMeta | undefined
}

// ---- Color definitions ----

export const IPHONE_COLORS: ColorMeta[] = [
  { name: 'Midnight Black', hex: '#1a1a1a', textColor: 'white', slug: 'midnight-black' },
  { name: 'Silver',         hex: '#e8e8ed', textColor: 'black', slug: 'silver' },
  { name: 'Gold',           hex: '#f5e6c8', textColor: 'black', slug: 'gold' },
  { name: 'Deep Purple',    hex: '#4b3b6b', textColor: 'white', slug: 'deep-purple' },
  { name: 'Blue',           hex: '#2d5a8e', textColor: 'white', slug: 'blue' },
  { name: 'Orange',         hex: '#e8622a', textColor: 'white', slug: 'orange' },
]

// ---- Store ----

export const useColorStore = create<ColorState>()(
  persist(
    (set, get) => ({
      selectedColor: 'Midnight Black',

      setColor: (color: IPhoneColor) => set({ selectedColor: color }),

      getColorMeta: (color: IPhoneColor) =>
        IPHONE_COLORS.find((c) => c.name === color),
    }),
    {
      name: 'iphone-selected-color',
    }
  )
)
