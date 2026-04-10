'use client'

import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

const NAV_LINKS = [
  { label: 'Works',   href: '#works'   },
  { label: 'About',   href: '#about'   },
  { label: 'Music',   href: '#music'   },
  { label: 'Contact', href: '#contact' },
]

export default function CorporateNav() {
  const navRef      = useRef<HTMLElement>(null)
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── GSAP entrance animation (fade-in from top) ────────────────────────────
  // prefers-reduced-motion: GSAP respects it via CSS media query fallback;
  // our globals.css sets transition-duration: 0.01ms for reduced-motion users.
  useGSAP(() => {
    if (!navRef.current) return
    gsap.from(navRef.current, {
      y: -20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    })
  }, { scope: navRef })

  return (
    <nav
      ref={navRef}
      aria-label="メインナビゲーション"
      data-scrolled={scrolled || undefined}
      className={[
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all',
        scrolled
          ? 'bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]'
          : 'bg-transparent',
      ].join(' ')}
    >
      {/* Logo */}
      <a
        href="#"
        className="font-display text-xl font-bold tracking-tight text-gradient-purple"
        aria-label="3D&MUSIC JAM トップへ"
      >
        3D&MUSIC JAM
      </a>

      {/* Desktop links */}
      <ul className="hidden md:flex gap-8 list-none" role="list">
        {NAV_LINKS.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors duration-200"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="メニュー"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        className="flex md:hidden flex-col gap-1.5 p-2"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="block w-6 h-0.5 bg-[var(--color-text)] transition-all" />
        <span className="block w-6 h-0.5 bg-[var(--color-text)] transition-all" />
        <span className="block w-6 h-0.5 bg-[var(--color-text)] transition-all" />
      </button>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="absolute top-full left-0 right-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] py-4 px-6 md:hidden"
        >
          <ul className="flex flex-col gap-4 list-none" role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
