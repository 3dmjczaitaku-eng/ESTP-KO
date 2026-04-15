/**
 * WorksGallery — TDD tests (Phase 3a)
 *
 * Spec:
 * - Renders section with aria-label="作品ギャラリー"
 * - Renders 5 tab buttons: イラスト / 動画 / 音楽 / HP / AI
 * - Default active tab is "イラスト" (aria-selected="true")
 * - Clicking a tab makes it active and hides others
 * - Each tab panel contains at least 1 work card
 * - Work cards with Vimeo IDs render an <iframe> (or placeholder for missing IDs)
 * - Cards show title and description text
 * - Accessibility: tab role="tab", panel role="tabpanel", aria-controls linkage
 * - GSAP ScrollTrigger is registered (via gsap.registerPlugin mock)
 */

import { render, screen, fireEvent } from '@testing-library/react'
import WorksGallery from '../WorksGallery'

// GSAP is mocked via __mocks__/gsap.ts — ScrollTrigger calls are no-ops

describe('WorksGallery', () => {
  it('renders section with correct aria-label', () => {
    render(<WorksGallery />)
    expect(screen.getByRole('region', { name: /作品ギャラリー/i })).toBeInTheDocument()
  })

  it('renders 5 tab buttons', () => {
    render(<WorksGallery />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5)
  })

  it.each(['イラスト', '動画', '音楽', 'HP', 'AI'])('renders "%s" tab', (label) => {
    render(<WorksGallery />)
    expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
  })

  it('イラスト tab is selected by default', () => {
    render(<WorksGallery />)
    expect(screen.getByRole('tab', { name: 'イラスト' })).toHaveAttribute('aria-selected', 'true')
  })

  it('other tabs are not selected by default', () => {
    render(<WorksGallery />)
    ;['動画', '音楽', 'HP', 'AI'].forEach((label) => {
      expect(screen.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'false')
    })
  })

  it('clicking 動画 tab makes it active', () => {
    render(<WorksGallery />)
    fireEvent.click(screen.getByRole('tab', { name: '動画' }))
    expect(screen.getByRole('tab', { name: '動画' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'イラスト' })).toHaveAttribute('aria-selected', 'false')
  })

  it('renders at least one tabpanel', () => {
    render(<WorksGallery />)
    expect(screen.getAllByRole('tabpanel').length).toBeGreaterThanOrEqual(1)
  })

  it('active tabpanel contains work cards', () => {
    render(<WorksGallery />)
    const panel = screen.getAllByRole('tabpanel')[0]
    // Each card has a heading for the work title
    const cards = panel.querySelectorAll('[data-work-card]')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('work cards with Vimeo ID render an iframe', () => {
    render(<WorksGallery />)
    // イラスト tab (default) has Vimeo ID 1174645662
    const panel = screen.getAllByRole('tabpanel')[0]
    expect(panel.querySelector('iframe')).toBeInTheDocument()
  })

  it('work cards without Vimeo ID render a placeholder', () => {
    render(<WorksGallery />)
    // Switch to HP tab (no Vimeo ID)
    fireEvent.click(screen.getByRole('tab', { name: 'HP' }))
    const panel = screen.getAllByRole('tabpanel')[0]
    expect(panel.querySelector('[data-placeholder]')).toBeInTheDocument()
  })

  it('tab has aria-controls pointing to its panel', () => {
    render(<WorksGallery />)
    const tab = screen.getByRole('tab', { name: 'イラスト' })
    const controlledId = tab.getAttribute('aria-controls')
    expect(controlledId).toBeTruthy()
    expect(document.getElementById(controlledId!)).toBeInTheDocument()
  })
})
