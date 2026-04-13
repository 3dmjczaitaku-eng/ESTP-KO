/**
 * ParticleBackground — TDD tests (Phase 3b-0)
 *
 * Spec:
 * - Renders with data-particle-background attribute (testable selector)
 * - aria-hidden="true" — decorative element, screen readers skip it
 * - Has "fixed" class — position: fixed for full-page background
 * - Has "pointer-events-none" — non-interactive, clicks pass through
 * - Renders a <canvas> element (Three.js via HeroScene)
 */

import { render } from '@testing-library/react'
import ParticleBackground from '../ParticleBackground'

describe('ParticleBackground', () => {
  it('renders with data-particle-background attribute', () => {
    render(<ParticleBackground />)
    expect(document.querySelector('[data-particle-background]')).toBeInTheDocument()
  })

  it('is aria-hidden (decorative — screen readers skip it)', () => {
    render(<ParticleBackground />)
    const el = document.querySelector('[data-particle-background]')
    expect(el).toHaveAttribute('aria-hidden', 'true')
  })

  it('has fixed positioning class', () => {
    render(<ParticleBackground />)
    const el = document.querySelector('[data-particle-background]')
    expect(el).toHaveClass('fixed')
  })

  it('has pointer-events-none (non-interactive)', () => {
    render(<ParticleBackground />)
    const el = document.querySelector('[data-particle-background]')
    expect(el).toHaveClass('pointer-events-none')
  })

  it('has z-0 class (renders behind page content)', () => {
    render(<ParticleBackground />)
    const el = document.querySelector('[data-particle-background]')
    expect(el).toHaveClass('z-0')
  })

  it('renders a canvas element from HeroScene', () => {
    render(<ParticleBackground />)
    expect(document.querySelector('canvas')).toBeInTheDocument()
  })
})
