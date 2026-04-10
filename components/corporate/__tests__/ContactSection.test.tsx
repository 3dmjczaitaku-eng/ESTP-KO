/**
 * ContactSection — TDD tests (Phase 3c-5)
 *
 * Spec:
 * - Renders section with aria-label="お問い合わせ"
 * - Renders heading "お問い合わせ"
 * - Renders a form with name, email, message fields
 * - Submit button is present
 * - Each input has an associated label (accessibility)
 * - Form has role="form" or is a <form> element
 */

import { render, screen } from '@testing-library/react'
import ContactSection from '../ContactSection'

describe('ContactSection', () => {
  it('renders section with aria-label="お問い合わせ"', () => {
    render(<ContactSection />)
    expect(screen.getByRole('region', { name: /お問い合わせ/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<ContactSection />)
    expect(screen.getByRole('heading', { level: 2, name: /お問い合わせ/i })).toBeInTheDocument()
  })

  it('renders a form element', () => {
    render(<ContactSection />)
    expect(document.querySelector('form')).toBeInTheDocument()
  })

  it('has a name input with label', () => {
    render(<ContactSection />)
    expect(screen.getByLabelText(/お名前/i)).toBeInTheDocument()
  })

  it('has an email input with label', () => {
    render(<ContactSection />)
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
  })

  it('has a message textarea with label', () => {
    render(<ContactSection />)
    expect(screen.getByLabelText(/お問い合わせ内容/i)).toBeInTheDocument()
  })

  it('has a submit button', () => {
    render(<ContactSection />)
    expect(screen.getByRole('button', { name: /送信/i })).toBeInTheDocument()
  })

  it('email input has type="email"', () => {
    render(<ContactSection />)
    expect(screen.getByLabelText(/メールアドレス/i)).toHaveAttribute('type', 'email')
  })
})
