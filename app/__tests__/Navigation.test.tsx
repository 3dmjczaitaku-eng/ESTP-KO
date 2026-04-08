import { render, screen } from '@testing-library/react'
import Navigation from '@/components/Navigation'

describe('Navigation', () => {
  it('renders brand text', () => {
    render(<Navigation />)
    expect(screen.getByText('iPhone 17 Pro')).toBeInTheDocument()
  })

  it('has sticky positioning', () => {
    const { container } = render(<Navigation />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('sticky', 'top-0')
  })

  it('renders navigation links', () => {
    render(<Navigation />)
    expect(screen.getByText(/Design/i)).toBeInTheDocument()
    expect(screen.getByText(/Features/i)).toBeInTheDocument()
    expect(screen.getByText(/Tech Specs/i)).toBeInTheDocument()
  })

  it('has proper z-index for overlay', () => {
    const { container } = render(<Navigation />)
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('z-50')
  })
})
