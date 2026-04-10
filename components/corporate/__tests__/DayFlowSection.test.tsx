/**
 * DayFlowSection — TDD tests (Phase 3c-2)
 *
 * Spec:
 * - Renders section with aria-label="1日の流れ"
 * - Renders heading "1日の流れ"
 * - Renders timeline items (at least 5)
 * - Each item has a time and description
 * - data-flow-item on each step
 */

import { render, screen } from '@testing-library/react'
import DayFlowSection from '../DayFlowSection'

describe('DayFlowSection', () => {
  it('renders section with aria-label="1日の流れ"', () => {
    render(<DayFlowSection />)
    expect(screen.getByRole('region', { name: /1日の流れ/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<DayFlowSection />)
    expect(screen.getByRole('heading', { level: 2, name: /1日の流れ/i })).toBeInTheDocument()
  })

  it('renders at least 5 timeline steps', () => {
    render(<DayFlowSection />)
    expect(document.querySelectorAll('[data-flow-item]').length).toBeGreaterThanOrEqual(5)
  })

  it('each step has a time label', () => {
    render(<DayFlowSection />)
    const times = document.querySelectorAll('[data-flow-item] [data-flow-time]')
    expect(times.length).toBeGreaterThanOrEqual(5)
  })

  it('each step has a description', () => {
    render(<DayFlowSection />)
    const descs = document.querySelectorAll('[data-flow-item] p')
    expect(descs.length).toBeGreaterThanOrEqual(5)
  })
})
