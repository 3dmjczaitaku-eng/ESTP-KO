/**
 * InfoHubSection — TDD tests (Phase 3d)
 *
 * Spec:
 * - Renders section with aria-label="利用情報ハブ"
 * - Renders h2 heading "もっと知る"
 * - Renders exactly 4 hub cards (data-hub-card)
 * - Each card has a toggle button with aria-expanded
 * - Cards are initially collapsed (no data-hub-card-content visible)
 * - Clicking a card button expands it (data-hub-card-content appears)
 * - Has id="info" for anchor navigation
 */

import { render, screen, fireEvent } from '@testing-library/react'
import InfoHubSection from '../InfoHubSection'

describe('InfoHubSection', () => {
  it('renders section with aria-label="利用情報ハブ"', () => {
    render(<InfoHubSection />)
    expect(screen.getByRole('region', { name: /利用情報ハブ/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<InfoHubSection />)
    expect(screen.getByRole('heading', { level: 2, name: /もっと知る/i })).toBeInTheDocument()
  })

  it('renders exactly 4 hub cards', () => {
    render(<InfoHubSection />)
    expect(document.querySelectorAll('[data-hub-card]')).toHaveLength(4)
  })

  it('each card has a toggle button with aria-expanded="false" initially', () => {
    render(<InfoHubSection />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('no card content visible initially', () => {
    render(<InfoHubSection />)
    expect(document.querySelectorAll('[data-hub-card-content]')).toHaveLength(0)
  })

  it('clicking a card expands it and shows content', () => {
    render(<InfoHubSection />)
    const firstButton = screen.getAllByRole('button')[0]
    fireEvent.click(firstButton)
    expect(firstButton).toHaveAttribute('aria-expanded', 'true')
    expect(document.querySelectorAll('[data-hub-card-content]')).toHaveLength(1)
  })

  it('clicking expanded card collapses it', () => {
    render(<InfoHubSection />)
    const firstButton = screen.getAllByRole('button')[0]
    fireEvent.click(firstButton)
    fireEvent.click(firstButton)
    expect(firstButton).toHaveAttribute('aria-expanded', 'false')
    expect(document.querySelectorAll('[data-hub-card-content]')).toHaveLength(0)
  })

  it('has card for voice (利用者の声)', () => {
    render(<InfoHubSection />)
    expect(document.querySelector('[data-hub-card-id="voice"]')).toBeInTheDocument()
  })

  it('has card for dayflow (1日の流れ)', () => {
    render(<InfoHubSection />)
    expect(document.querySelector('[data-hub-card-id="dayflow"]')).toBeInTheDocument()
  })

  it('has card for pricing (料金)', () => {
    render(<InfoHubSection />)
    expect(document.querySelector('[data-hub-card-id="pricing"]')).toBeInTheDocument()
  })

  it('has card for faq', () => {
    render(<InfoHubSection />)
    expect(document.querySelector('[data-hub-card-id="faq"]')).toBeInTheDocument()
  })

  it('has id="info" for anchor navigation', () => {
    render(<InfoHubSection />)
    expect(document.getElementById('info')).toBeInTheDocument()
  })
})
