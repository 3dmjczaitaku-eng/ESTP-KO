import { render, screen } from '@testing-library/react'
import TechSpecs from '@/components/TechSpecs'

describe('TechSpecs', () => {
  it('renders section', () => {
    const { container } = render(<TechSpecs />)
    expect(container.querySelector('section')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<TechSpecs />)
    expect(screen.getByText(/Technical Specifications/i)).toBeInTheDocument()
  })

  it('renders spec cards', () => {
    const { container } = render(<TechSpecs />)
    const cards = container.querySelectorAll('[data-testid="spec-card"]')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('renders spec labels and values', () => {
    render(<TechSpecs />)
    expect(screen.getByText(/Display/i)).toBeInTheDocument()
    expect(screen.getByText(/Processor/i)).toBeInTheDocument()
  })

  it('has full-height section', () => {
    const { container } = render(<TechSpecs />)
    const section = container.querySelector('section')
    expect(section).toHaveClass('min-h-screen')
  })
})
