/**
 * StaffSection — TDD tests (Phase 3b-2)
 *
 * Spec:
 * - Renders section with aria-label="スタッフ紹介"
 * - Renders heading "スタッフ紹介"
 * - Renders exactly 8 staff cards
 * - Each card has a name (heading) and role
 * - Each card has data-staff-card attribute
 * - Section has role="region" for landmark navigation
 */

import { render, screen } from '@testing-library/react'
import StaffSection from '../StaffSection'

describe('StaffSection', () => {
  it('renders section with aria-label="スタッフ紹介"', () => {
    render(<StaffSection />)
    expect(screen.getByRole('region', { name: /スタッフ紹介/i })).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<StaffSection />)
    expect(screen.getByRole('heading', { level: 2, name: /スタッフ紹介/i })).toBeInTheDocument()
  })

  it('renders exactly 8 staff cards', () => {
    render(<StaffSection />)
    const cards = document.querySelectorAll('[data-staff-card]')
    expect(cards).toHaveLength(8)
  })

  it('each card has a name heading', () => {
    render(<StaffSection />)
    const names = document.querySelectorAll('[data-staff-card] h3')
    expect(names).toHaveLength(8)
  })

  it('each card has a role/title text', () => {
    render(<StaffSection />)
    const roles = document.querySelectorAll('[data-staff-card] [data-staff-role]')
    expect(roles).toHaveLength(8)
  })

  it('renders staff member names', () => {
    render(<StaffSection />)
    // At minimum the first staff member should be findable by name
    const allHeadings = document.querySelectorAll('[data-staff-card] h3')
    expect(allHeadings[0].textContent).toBeTruthy()
  })

  it('cards with Vimeo ID render an iframe', () => {
    render(<StaffSection />)
    const iframes = document.querySelectorAll('[data-staff-card] iframe')
    expect(iframes.length).toBeGreaterThan(0)
  })
})
