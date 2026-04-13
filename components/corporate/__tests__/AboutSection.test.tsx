/**
 * AboutSection — TDD tests (Phase 3d)
 *
 * Spec:
 * - Renders section with aria-label="事業所について"
 * - Renders h2 heading with "クリエイティブを、生きる力に。" content
 * - Renders exactly 3 philosophy pillars (data-pillar)
 * - Each pillar has an h3 heading
 * - Renders welfare note text
 */

import { render, screen } from '@testing-library/react'
import AboutSection from '../AboutSection'

describe('AboutSection', () => {
  it('renders section with aria-label="事業所について"', () => {
    render(<AboutSection />)
    expect(screen.getByRole('region', { name: /事業所について/i })).toBeInTheDocument()
  })

  it('renders an h2 heading', () => {
    render(<AboutSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('renders "クリエイティブを" in the heading', () => {
    render(<AboutSection />)
    expect(screen.getByText(/クリエイティブを/)).toBeInTheDocument()
  })

  it('renders exactly 3 philosophy pillars', () => {
    render(<AboutSection />)
    expect(document.querySelectorAll('[data-pillar]')).toHaveLength(3)
  })

  it('each pillar has an h3 heading', () => {
    render(<AboutSection />)
    const h3s = document.querySelectorAll('[data-pillar] h3')
    expect(h3s).toHaveLength(3)
  })

  it('renders pillar titles: 表現する, つながる, はたらく', () => {
    render(<AboutSection />)
    expect(screen.getByText('表現する')).toBeInTheDocument()
    expect(screen.getByText('つながる')).toBeInTheDocument()
    expect(screen.getByText('はたらく')).toBeInTheDocument()
  })

  it('renders the welfare note mentioning 0円', () => {
    render(<AboutSection />)
    expect(screen.getByText(/0円/)).toBeInTheDocument()
  })

  it('has an id="about" for anchor navigation', () => {
    render(<AboutSection />)
    expect(document.getElementById('about')).toBeInTheDocument()
  })
})
