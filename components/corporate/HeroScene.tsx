'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Particle count: reduced on mobile to maintain 60fps
const PARTICLE_COUNT_DESKTOP = 3000
const PARTICLE_COUNT_MOBILE  = 500

function buildParticleSystem(count: number) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i++) {
    positions[i] = THREE.MathUtils.randFloatSpread(400)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0x7c3aed,      // --color-primary
    size: 1.2,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.75,
  })

  return new THREE.Points(geometry, material)
}

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768
    const count = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP

    // ── Three.js setup ────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000)
    camera.position.z = 200

    const particles = buildParticleSystem(count)
    scene.add(particles)

    // ── Animation loop ─────────────────────────────────────────────────────
    let frameId: number
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      particles.rotation.y += 0.0003
      particles.rotation.x += 0.0001
      renderer.render(scene, camera)
    }

    if (!prefersReduced) animate()

    // ── Resize handler ─────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full"
      // Canvas is decorative — screen readers should skip it
      aria-hidden="true"
    >
      {/* renderer.domElement (canvas) is appended here by Three.js */}
    </div>
  )
}
