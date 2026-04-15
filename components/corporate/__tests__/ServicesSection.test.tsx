/**
 * ServicesSection — TDD tests (Phase 3d: numbered list + cursor-follow video)
 *
 * Spec:
 * - Renders section with aria-label="コース紹介"
 * - Renders h2 heading "コース紹介"
 * - Renders exactly 5 course rows (data-service-card)
 * - Each row has an h3 title, description, and data-tag span
 * - Default state: no iframes in document
 * - Hovering a row with vimeoId: iframe appears in document (cursor-follow)
 * - Mouse leave: iframe removed from document
 * - CTA link points to #contact
 */

import { render, screen, fireEvent } from '@testing-library/react'
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

  it('renders exactly 5 course rows', () => {
    render(<ServicesSection />)
    expect(document.querySelectorAll('[data-service-card]')).toHaveLength(5)
  })

  it('each row has an h3 heading', () => {
    render(<ServicesSection />)
    expect(document.querySelectorAll('[data-service-card] h3')).toHaveLength(5)
  })

  it('each row has a description paragraph', () => {
    render(<ServicesSection />)
    expect(document.querySelectorAll('[data-service-card] p')).toHaveLength(5)
  })

  it('each row has a data-tag element', () => {
    render(<ServicesSection />)
    expect(document.querySelectorAll('[data-service-card] [data-tag]')).toHaveLength(5)
  })

  it('no iframes visible by default', () => {
    render(<ServicesSection />)
    expect(document.querySelectorAll('iframe')).toHaveLength(0)
  })

  it('hovering a row with vimeoId mounts the floating iframe', () => {
    render(<ServicesSection />)
    const firstRow = document.querySelector('[data-service-card]')!
    fireEvent.mouseEnter(firstRow)
    const iframe = document.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe?.src).toContain('vimeo.com')
  })

  it('mouse leave removes the floating iframe', () => {
    render(<ServicesSection />)
    const firstRow = document.querySelector('[data-service-card]')!
    fireEvent.mouseEnter(firstRow)
    fireEvent.mouseLeave(firstRow)
    expect(document.querySelector('iframe')).not.toBeInTheDocument()
  })

  it('hovering last 2 rows (no vimeoId) does not mount iframe', () => {
    render(<ServicesSection />)
    const rows = document.querySelectorAll('[data-service-card]')
    // rows[3] = Web制作, rows[4] = AI活用 — no vimeoId
    fireEvent.mouseEnter(rows[3])
    expect(document.querySelector('iframe')).not.toBeInTheDocument()
  })

  it('CTA link points to #contact', () => {
    render(<ServicesSection />)
    expect(screen.getByRole('link', { name: /見学・体験を申し込む/i })).toHaveAttribute('href', '#contact')
  })

  it.each([
    'イラスト・Live2D',
    '動画制作',
    '音楽・DTM',
    'Web制作',
    'AI活用',
  ])('renders "%s" course title', (title) => {
    render(<ServicesSection />)
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
  })
})
