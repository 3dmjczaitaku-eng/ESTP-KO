'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface UseCharRevealOptions {
  type?: 'chars' | 'words'
  stagger?: number
  duration?: number
  y?: number
  start?: string
}

export function useCharReveal(options: UseCharRevealOptions = {}) {
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const container = containerRef.current
    if (!container) return

    const targets = container.querySelectorAll<HTMLElement>('.char-reveal')
    if (!targets.length) return

    const {
      type = 'words',
      stagger = 0.03,
      duration = 0.6,
      y = 60,
      start = 'top 80%',
    } = options

    type SplitInstance = InstanceType<typeof import('split-type').default>
    const splits: SplitInstance[] = []
    let ctx: ReturnType<typeof gsap.context> | undefined

    let cancelled = false
    const initWithCancel = async () => {
      const { default: SplitType } = await import('split-type')
      if (cancelled) return

      ctx = gsap.context(() => {
        targets.forEach(el => {
          const split = new SplitType(el, { types: type })
          splits.push(split)
          const units = type === 'chars' ? split.chars : split.words
          if (!units?.length) return

          gsap.from(units, {
            y,
            opacity: 0,
            duration,
            stagger,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: 'play none none none',
            },
          })
        })
      }, container)
    }

    initWithCancel()

    return () => {
      cancelled = true
      splits.forEach(s => s.revert())
      ctx?.revert()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — options are read on mount only; re-running would re-split already-animated text

  return containerRef
}
