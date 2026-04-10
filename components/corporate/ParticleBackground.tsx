'use client'

import dynamic from 'next/dynamic'

// SSR avoidance: Three.js depends on window/canvas (no server-side support)
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false })

/**
 * ParticleBackground — full-page fixed Three.js particle canvas
 *
 * Rendered inside corporate/layout.tsx so particles persist across all
 * sections. Content sections render at z-10 or higher; particles stay at z-0.
 * Decorative — pointer events pass through to interactive content below.
 */
export default function ParticleBackground() {
  return (
    <div
      data-particle-background
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    >
      <HeroScene />
    </div>
  )
}
