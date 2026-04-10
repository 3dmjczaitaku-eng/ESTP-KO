/**
 * ServicesSection — TDD tests (Phase 3b-1)
 *
 * Spec:
 * - Renders section with aria-label="コース紹介"
 * - Renders heading "コース紹介"
 * - Renders exactly 5 course cards
 * - Each card has a title, description, and tag chip
 * - Cards with Vimeo IDs render an <iframe>; others render a placeholder
 * - CTA link points to #contact
 * - Accessibility: section role="region"
 */

import { render, screen } from '@testing-library/react'
import ServicesSection from '../ServicesSection'

describe('ServicesSection', () => {
  it('renders section with aria-label="コース紹介"', () => {
    render(<ServicesSection />)
    expect(screen.getByRole('region', { name: /コース紹介/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<ServicesSection />)
    expect(screen.getByRole('heading', { level: 2, name: /コース紹介/i })).toBeInTheDocument()
  })

  it('renders exactly 5 course cards', () => {
    render(<ServicesSection />)
    const cards = document.querySelectorAll('[data-service-card]')
    expect(cards).toHaveLength(5)
  })

  it('each card has a heading', () => {
    render(<ServicesSection />)
    const headings = document.querySelectorAll('[data-service-card] h3')
    expect(headings).toHaveLength(5)
  })

  it('each card has a description', () => {
    render(<ServicesSection />)
    const descs = document.querySelectorAll('[data-service-card] p')
    expect(descs).toHaveLength(5)
  })

  it('each card has a tag chip', () => {
    render(<ServicesSection />)
    const tags = document.querySelectorAll('[data-service-card] [data-tag]')
    expect(tags).toHaveLength(5)
  })

  it('cards with Vimeo ID render an iframe', () => {
    render(<ServicesSection />)
    // At least one card should have a Vimeo iframe (illustration/video/music courses)
    const iframes = document.querySelectorAll('[data-service-card] iframe')
    expect(iframes.length).toBeGreaterThan(0)
  })

  it('cards without Vimeo ID render a Coming Soon placeholder', () => {
    render(<ServicesSection />)
    const placeholders = document.querySelectorAll('[data-service-card] [data-placeholder]')
    expect(placeholders.length).toBeGreaterThan(0)
  })

  it('CTA link points to #contact', () => {
    render(<ServicesSection />)
    const cta = screen.getByRole('link', { name: /見学・体験を申し込む/i })
    expect(cta).toHaveAttribute('href', '#contact')
  })

  it.each([
    'イラスト・Live2D',
    '動画制作',
    '音楽・DTM',
    'Web制作',
    'AI活用',
  ])('renders "%s" course', (title) => {
    render(<ServicesSection />)
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
  })
})
