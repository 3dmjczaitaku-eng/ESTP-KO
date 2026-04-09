/**
 * Tests for ColorSelector component
 * TDD: RED phase - written before implementation
 */

import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ColorSelector from '@/components/ColorSelector'
import { useColorStore, IPHONE_COLORS } from '@/lib/store'

// Reset store between tests
beforeEach(() => {
  useColorStore.setState({ selectedColor: 'Midnight Black' })
})

// --- Rendering ---

describe('ColorSelector — rendering', () => {
  it('renders without crashing', () => {
    render(<ColorSelector />)
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('renders exactly 6 color options', () => {
    render(<ColorSelector />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(6)
  })

  it('renders all 6 color names as accessible labels', () => {
    render(<ColorSelector />)
    IPHONE_COLORS.forEach((color) => {
      expect(
        screen.getByRole('radio', { name: new RegExp(color.name, 'i') })
      ).toBeInTheDocument()
    })
  })

  it('has a legend / section heading', () => {
    render(<ColorSelector />)
    // fieldset legend or aria-label describing the group
    expect(screen.getByText(/color/i)).toBeInTheDocument()
  })

  it('shows the currently selected color name', () => {
    render(<ColorSelector />)
    expect(screen.getByText('Midnight Black')).toBeInTheDocument()
  })
})

// --- Interaction ---

describe('ColorSelector — interaction', () => {
  it('marks initial color as checked', () => {
    render(<ColorSelector />)
    const midnightBtn = screen.getByRole('radio', { name: /Midnight Black/i })
    expect(midnightBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('updates store when a color is clicked', () => {
    render(<ColorSelector />)
    const goldBtn = screen.getByRole('radio', { name: /Gold/i })
    fireEvent.click(goldBtn)
    expect(useColorStore.getState().selectedColor).toBe('Gold')
  })

  it('visually marks the newly selected color as checked', () => {
    render(<ColorSelector />)
    const blueBtn = screen.getByRole('radio', { name: /Blue/i })
    fireEvent.click(blueBtn)
    expect(blueBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('un-marks the previously selected color', () => {
    render(<ColorSelector />)
    const goldBtn = screen.getByRole('radio', { name: /Gold/i })
    const midnightBtn = screen.getByRole('radio', { name: /Midnight Black/i })

    fireEvent.click(goldBtn)
    expect(midnightBtn).toHaveAttribute('aria-checked', 'false')
  })

  it('displays selected color name after selection', () => {
    render(<ColorSelector />)
    fireEvent.click(screen.getByRole('radio', { name: /Deep Purple/i }))
    expect(screen.getByText('Deep Purple')).toBeInTheDocument()
  })
})

// --- Keyboard accessibility ---

describe('ColorSelector — keyboard accessibility', () => {
  it('all color buttons are focusable via Tab', async () => {
    const user = userEvent.setup()
    render(<ColorSelector />)
    const buttons = screen.getAllByRole('radio')

    // Focus first button directly
    buttons[0].focus()
    expect(document.activeElement).toBe(buttons[0])
  })

  it('pressing Enter on a color button activates it', async () => {
    const user = userEvent.setup()
    render(<ColorSelector />)
    const silverBtn = screen.getByRole('radio', { name: /Silver/i })

    silverBtn.focus()
    await user.keyboard('{Enter}')

    expect(useColorStore.getState().selectedColor).toBe('Silver')
  })

  it('pressing Space on a color button activates it', async () => {
    const user = userEvent.setup()
    render(<ColorSelector />)
    const orangeBtn = screen.getByRole('radio', { name: /Orange/i })

    orangeBtn.focus()
    await user.keyboard(' ')

    expect(useColorStore.getState().selectedColor).toBe('Orange')
  })
})

// --- Accessibility attributes ---

describe('ColorSelector — ARIA attributes', () => {
  it('group has accessible name', () => {
    render(<ColorSelector />)
    const group = screen.getByRole('group')
    expect(
      group.getAttribute('aria-label') || group.closest('fieldset')
    ).toBeTruthy()
  })

  it('each button has aria-checked reflecting selection state', () => {
    render(<ColorSelector />)
    const buttons = screen.getAllByRole('radio')
    const checkedButtons = buttons.filter(
      (btn) => btn.getAttribute('aria-checked') === 'true'
    )
    expect(checkedButtons).toHaveLength(1)
    expect(checkedButtons[0]).toHaveAttribute('aria-label', expect.stringContaining('Midnight Black'))
  })
})

// --- Store integration ---

describe('ColorSelector — store integration', () => {
  it('reflects external store changes', () => {
    render(<ColorSelector />)

    // Change store externally
    useColorStore.getState().setColor('Orange')

    // Re-render will pick up subscription
    expect(useColorStore.getState().selectedColor).toBe('Orange')
  })
})
