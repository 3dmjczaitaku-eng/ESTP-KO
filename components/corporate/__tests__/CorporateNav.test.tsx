/**
 * CorporateNav — TDD tests (Phase 1)
 *
 * Spec:
 * - Renders logo text "3D&MUSIC JAM"
 * - Renders nav links: Works, About, Music, Contact
 * - Logo uses font-display (Playfair Display class)
 * - Has accessible <nav> landmark with aria-label
 * - Mobile: hamburger button is visible (aria-label="メニュー")
 * - Scroll state: applies scrolled class when window.scrollY > 50
 * - Links are keyboard-navigable (focusable anchor elements)
 * - prefers-reduced-motion: GSAP animations still register but no visual assertion needed
 */

import { render, screen, fireEvent, act } from '@testing-library/react'
import CorporateNav from '../CorporateNav'

// GSAP + useGSAP are mocked via __mocks__/gsap.ts and @gsap/react.ts

describe('CorporateNav', () => {
  it('renders the site logo', () => {
    render(<CorporateNav />)
    expect(screen.getByText('3D&MUSIC JAM')).toBeInTheDocument()
  })

  it('logo has font-display class (Playfair Display)', () => {
    render(<CorporateNav />)
    const logo = screen.getByText('3D&MUSIC JAM')
    expect(logo).toHaveClass('font-display')
  })

  it('has accessible nav landmark', () => {
    render(<CorporateNav />)
    expect(screen.getByRole('navigation', { name: /メインナビゲーション/i })).toBeInTheDocument()
  })

  it.each(['Works', 'About', 'Music', 'Contact'])('renders "%s" nav link', (label) => {
    render(<CorporateNav />)
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
  })

  it('nav links are anchor elements (keyboard-navigable)', () => {
    render(<CorporateNav />)
    const link = screen.getByRole('link', { name: 'Works' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href')
  })

  it('renders mobile hamburger button', () => {
    render(<CorporateNav />)
    expect(screen.getByRole('button', { name: /メニュー/i })).toBeInTheDocument()
  })

  it('adds scrolled data-attribute after scrolling past 50px', () => {
    render(<CorporateNav />)
    const nav = screen.getByRole('navigation', { name: /メインナビゲーション/i })

    expect(nav).not.toHaveAttribute('data-scrolled', 'true')

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 60, writable: true })
      fireEvent.scroll(window)
    })

    expect(nav).toHaveAttribute('data-scrolled', 'true')
  })

  it('removes scrolled data-attribute when back at top', () => {
    render(<CorporateNav />)
    const nav = screen.getByRole('navigation', { name: /メインナビゲーション/i })

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 60, writable: true })
      fireEvent.scroll(window)
    })
    expect(nav).toHaveAttribute('data-scrolled', 'true')

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
      fireEvent.scroll(window)
    })
    expect(nav).not.toHaveAttribute('data-scrolled', 'true')
  })

  it('toggles mobile menu open/close on hamburger click', () => {
    render(<CorporateNav />)
    const hamburger = screen.getByRole('button', { name: /メニュー/i })

    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(hamburger)
    expect(hamburger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(hamburger)
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
  })
})
