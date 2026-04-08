import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

jest.mock('@/components/Navigation', () => {
  return function Navigation() {
    return <nav data-testid="navigation">Navigation</nav>
  }
})

jest.mock('@/components/Hero', () => {
  return function Hero() {
    return <section data-testid="hero">Hero</section>
  }
})

jest.mock('@/components/ProductGallery', () => {
  return function ProductGallery() {
    return <section data-testid="gallery">Gallery</section>
  }
})

jest.mock('@/components/TechSpecs', () => {
  return function TechSpecs() {
    return <section data-testid="specs">Specs</section>
  }
})

describe('Home Page', () => {
  it('renders main components', () => {
    render(<Home />)
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('gallery')).toBeInTheDocument()
    expect(screen.getByTestId('specs')).toBeInTheDocument()
  })

  it('renders footer', () => {
    render(<Home />)
    expect(
      screen.getByText(/Claude Code Adoption Demo/i)
    ).toBeInTheDocument()
  })

  it('has correct page structure', () => {
    const { container } = render(<Home />)
    const main = container.querySelector('main')
    const footer = container.querySelector('footer')
    expect(main).toBeInTheDocument()
    expect(footer).toBeInTheDocument()
  })
})
