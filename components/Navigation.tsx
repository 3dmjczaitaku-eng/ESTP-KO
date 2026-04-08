'use client'

import { useScrollEffect } from '@/lib/hooks'
import { useRef } from 'react'

const NAV_LINKS = [
  { label: 'Design', href: '#design' },
  { label: 'Features', href: '#features' },
  { label: 'Tech Specs', href: '#tech-specs' },
]

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null)
  const scrollProgress = useScrollEffect(navRef)

  // Smooth border fade over first 30% of scroll
  const borderOpacity = Math.max(0, Math.min(scrollProgress * 3, 1))

  return (
    <nav
      ref={navRef}
      className="sticky top-0 h-14 bg-white/95 backdrop-blur z-50 transition-all duration-300"
      style={{
        borderBottom: `1px solid rgba(229, 231, 235, ${borderOpacity})`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Brand */}
        <h1 className="text-lg font-semibold text-black">iPhone 17 Pro</h1>

        {/* Links */}
        <div className="hidden md:flex gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors">
          Buy
        </button>
      </div>
    </nav>
  )
}
