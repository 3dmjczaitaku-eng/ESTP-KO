/**
 * FacilitySection Component Tests
 */

import { render, screen } from '@testing-library/react'
import { FacilitySection } from '../FacilitySection'

describe('FacilitySection', () => {
  it('renders with default title', () => {
    render(<FacilitySection />)

    expect(screen.getByText('Our Facilities')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(<FacilitySection title="Office Spaces" />)

    expect(screen.getByText('Office Spaces')).toBeInTheDocument()
  })

  it('renders video elements for each photo', () => {
    const photos = [
      { id: 'test-001', alt: 'Test 1', name: 'Test Photo 1' },
      { id: 'test-002', alt: 'Test 2', name: 'Test Photo 2' },
    ]

    render(<FacilitySection photos={photos} />)

    // Check for video elements
    const videos = document.querySelectorAll('video')
    expect(videos).toHaveLength(2)

    // Check for WebM sources
    videos.forEach((video) => {
      const source = video.querySelector('source[type="video/webm"]')
      expect(source).toBeInTheDocument()
    })
  })

  it('uses correct poster image paths', () => {
    const photos = [{ id: 'facility-001', alt: 'Test', name: 'Test' }]

    render(<FacilitySection photos={photos} />)

    const video = document.querySelector('video')
    expect(video?.getAttribute('poster')).toBe('/videos/facility-001-poster.jpg')
  })

  it('uses correct WebM video paths', () => {
    const photos = [{ id: 'facility-001', alt: 'Test', name: 'Test' }]

    render(<FacilitySection photos={photos} />)

    const source = document.querySelector('source[type="video/webm"]')
    expect(source?.getAttribute('src')).toBe('/videos/facility-001.webm')
  })

  it('renders photo names in overlay', () => {
    const photos = [
      { id: 'test-001', alt: 'Alt 1', name: 'Conference Room' },
      { id: 'test-002', alt: 'Alt 2', name: 'Open Space' },
    ]

    render(<FacilitySection photos={photos} />)

    expect(screen.getByText('Conference Room')).toBeInTheDocument()
    expect(screen.getByText('Open Space')).toBeInTheDocument()
  })
})
