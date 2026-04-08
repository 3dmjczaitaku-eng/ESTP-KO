import { render, screen } from '@testing-library/react'
import ProductGallery from '@/components/ProductGallery'

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('ProductGallery', () => {
  it('renders section element', () => {
    const { container } = render(<ProductGallery />)
    const section = container.querySelector('section')
    expect(section).toBeTruthy()
  })

  it('renders loading message initially', () => {
    render(<ProductGallery />)
    expect(screen.getByText(/Loading gallery/i)).toBeInTheDocument()
  })
})
