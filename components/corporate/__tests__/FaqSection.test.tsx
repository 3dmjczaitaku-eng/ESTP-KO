/**
 * FaqSection — TDD tests (Phase 3c-4)
 *
 * Spec:
 * - Renders section with aria-label="よくある質問"
 * - Renders heading "よくある質問"
 * - Renders exactly 10 FAQ items
 * - Each item has a question (summary/button) and answer (text)
 * - Uses <details>/<summary> for native accordion (no JS dependency)
 * - data-faq-item on each item
 */

import { render, screen } from '@testing-library/react'
import FaqSection from '../FaqSection'

describe('FaqSection', () => {
  it('renders section with aria-label="よくある質問"', () => {
    render(<FaqSection />)
    expect(screen.getByRole('region', { name: /よくある質問/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<FaqSection />)
    expect(screen.getByRole('heading', { level: 2, name: /よくある質問/i })).toBeInTheDocument()
  })

  it('renders exactly 10 FAQ items', () => {
    render(<FaqSection />)
    expect(document.querySelectorAll('[data-faq-item]')).toHaveLength(10)
  })

  it('each FAQ uses <details> for native accordion', () => {
    render(<FaqSection />)
    expect(document.querySelectorAll('[data-faq-item] details')).toHaveLength(10)
  })

  it('each FAQ has a <summary> question', () => {
    render(<FaqSection />)
    expect(document.querySelectorAll('[data-faq-item] summary')).toHaveLength(10)
  })

  it('each FAQ has an answer paragraph', () => {
    render(<FaqSection />)
    expect(document.querySelectorAll('[data-faq-item] [data-faq-answer]')).toHaveLength(10)
  })
})
