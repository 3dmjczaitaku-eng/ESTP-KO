'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Animates elements matching `selector` within `containerRef` into view
 * on scroll. Uses GSAP ScrollTrigger with stagger.
 *
 * Respects prefers-reduced-motion — no-ops when user prefers reduced motion.
 */
export function useScrollReveal(
  selector: string = '.reveal',
  options: { stagger?: number; duration?: number; y?: number } = {}
) {
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const container = containerRef.current
    if (!container) return

    const elements = container.querySelectorAll<HTMLElement>(selector)
    if (elements.length === 0) return

    const { stagger = 0.12, duration = 0.6, y = 40 } = options

    const ctx = gsap.context(() => {
      gsap.from(elements, {
        y,
        opacity: 0,
        duration,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }, container)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector])

  return containerRef
}
