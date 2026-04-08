import { render, screen } from '@testing-library/react'
import Hero from '@/components/Hero'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('Hero', () => {
  it('renders heading', () => {
    render(<Hero />)
    expect(screen.getByText(/iPhone 17 Pro/i)).toBeInTheDocument()
  })

  it('renders subheading', () => {
    render(<Hero />)
    expect(screen.getByText(/studio is taking shape/i)).toBeInTheDocument()
  })

  it('renders CTA button', () => {
    render(<Hero />)
    const button = screen.getByRole('button', { name: /learn more/i })
    expect(button).toBeInTheDocument()
  })

  it('renders full-height section', () => {
    const { container } = render(<Hero />)
    const section = container.querySelector('section')
    expect(section).toHaveClass('h-screen')
  })

  it('has fallback image', () => {
    const { container } = render(<Hero />)
    const img = container.querySelector('img')
    expect(img?.getAttribute('alt')).toContain('iPhone')
  })
})
