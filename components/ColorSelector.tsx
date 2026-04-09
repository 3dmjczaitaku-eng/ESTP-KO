'use client'

import { useColorStore, IPHONE_COLORS, type IPhoneColor } from '@/lib/store'

export default function ColorSelector() {
  const selectedColor = useColorStore((state) => state.selectedColor)
  const setColor = useColorStore((state) => state.setColor)

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    color: IPhoneColor
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setColor(color)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
        Color
      </p>

      <p className="text-base font-semibold text-gray-900">{selectedColor}</p>

      <div
        role="group"
        aria-label="Select iPhone color"
        className="flex flex-wrap justify-center gap-3"
      >
        {IPHONE_COLORS.map((color) => {
          const isSelected = selectedColor === color.name

          return (
            <button
              key={color.name}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${color.name}${isSelected ? ', selected' : ''}`}
              tabIndex={0}
              onClick={() => setColor(color.name)}
              onKeyDown={(e) => handleKeyDown(e, color.name)}
              className={[
                'relative w-10 h-10 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-800',
                isSelected
                  ? 'ring-2 ring-offset-2 ring-gray-800 scale-110'
                  : 'hover:scale-105',
              ].join(' ')}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {isSelected && (
                <span
                  aria-hidden="true"
                  className={[
                    'absolute inset-0 flex items-center justify-center text-xs font-bold',
                    color.textColor === 'white' ? 'text-white' : 'text-black',
                  ].join(' ')}
                >
                  {/* checkmark */}
                  <svg
                    viewBox="0 0 12 12"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
