/**
 * FacilitySection — TDD tests (Phase 3d)
 *
 * Spec:
 * - Renders section with aria-label="施設案内"
 * - Renders h2 heading "施設案内"
 * - Renders exactly 5 photo cards (data-facility-photo)
 * - Each photo card has a video element (native .webm)
 * - Renders the photo grid container (data-facility-grid)
 * - Has id="facility" for anchor navigation
 */

import { render, screen } from '@testing-library/react'
import FacilitySection from '../FacilitySection'

describe('FacilitySection', () => {
  it('renders section with aria-label="施設案内"', () => {
    render(<FacilitySection />)
    expect(screen.getByRole('region', { name: /施設案内/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<FacilitySection />)
    expect(screen.getByRole('heading', { level: 2, name: /施設案内/i })).toBeInTheDocument()
  })

  it('renders exactly 5 photo cards', () => {
    render(<FacilitySection />)
    expect(document.querySelectorAll('[data-facility-photo]')).toHaveLength(5)
  })

  it('each photo card contains a video element for native webm playback', () => {
    render(<FacilitySection />)
    const videos = document.querySelectorAll('[data-facility-photo] video')
    expect(videos).toHaveLength(5)
  })

  it('video elements have poster and webm source', () => {
    render(<FacilitySection />)
    const videos = document.querySelectorAll('[data-facility-photo] video')
    videos.forEach((video) => {
      expect(video.getAttribute('poster')).toMatch(/\.jpg$/)
      const source = video.querySelector('source')
      expect(source?.getAttribute('src')).toMatch(/\.webm$/)
      expect(source?.getAttribute('type')).toBe('video/webm')
    })
  })

  it('renders the photo grid container', () => {
    render(<FacilitySection />)
    expect(document.querySelector('[data-facility-grid]')).toBeInTheDocument()
  })

  it('has id="facility" for anchor navigation', () => {
    render(<FacilitySection />)
    expect(document.getElementById('facility')).toBeInTheDocument()
  })
})
