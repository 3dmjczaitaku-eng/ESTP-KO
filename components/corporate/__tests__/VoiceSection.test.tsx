/**
 * VoiceSection — TDD tests (Phase 3c-1)
 *
 * Spec:
 * - Renders section with aria-label="利用者の声"
 * - Renders exactly 5 testimonial cards
 * - Each card has quote text, author name, and course tag
 * - data-voice-card attribute on each card
 */

import { render, screen } from '@testing-library/react'
import VoiceSection from '../VoiceSection'

describe('VoiceSection', () => {
  it('renders section with aria-label="利用者の声"', () => {
    render(<VoiceSection />)
    expect(screen.getByRole('region', { name: /利用者の声/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<VoiceSection />)
    expect(screen.getByRole('heading', { level: 2, name: /利用者の声/i })).toBeInTheDocument()
  })

  it('renders exactly 5 voice cards', () => {
    render(<VoiceSection />)
    expect(document.querySelectorAll('[data-voice-card]')).toHaveLength(5)
  })

  it('each card has a blockquote', () => {
    render(<VoiceSection />)
    expect(document.querySelectorAll('[data-voice-card] blockquote')).toHaveLength(5)
  })

  it('each card has an author name', () => {
    render(<VoiceSection />)
    expect(document.querySelectorAll('[data-voice-card] [data-author]')).toHaveLength(5)
  })

  it('each card has a course tag', () => {
    render(<VoiceSection />)
    expect(document.querySelectorAll('[data-voice-card] [data-course-tag]')).toHaveLength(5)
  })
})
