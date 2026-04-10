/**
 * PricingSection — TDD tests (Phase 3c-3)
 *
 * Spec:
 * - Renders section with aria-label="0円の仕組み"
 * - Renders heading "0円の仕組み"
 * - Renders explanation points (at least 3)
 * - Renders CTA link to #contact
 * - data-pricing-point on each explanation item
 */

import { render, screen } from '@testing-library/react'
import PricingSection from '../PricingSection'

describe('PricingSection', () => {
  it('renders section with aria-label="0円の仕組み"', () => {
    render(<PricingSection />)
    expect(screen.getByRole('region', { name: /0円の仕組み/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<PricingSection />)
    expect(screen.getByRole('heading', { level: 2, name: /0円/i })).toBeInTheDocument()
  })

  it('renders at least 3 pricing explanation points', () => {
    render(<PricingSection />)
    expect(document.querySelectorAll('[data-pricing-point]').length).toBeGreaterThanOrEqual(3)
  })

  it('renders CTA link pointing to #contact', () => {
    render(<PricingSection />)
    const cta = screen.getByRole('link', { name: /見学・体験を申し込む/i })
    expect(cta).toHaveAttribute('href', '#contact')
  })

  it('displays the "無料" / "0円" keyword prominently', () => {
    render(<PricingSection />)
    // Heading should contain 0円
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/0円/)
  })
})
