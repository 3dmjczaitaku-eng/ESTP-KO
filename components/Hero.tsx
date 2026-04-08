'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useIntersectionObserver } from '@/lib/hooks'
import { useState, useEffect } from 'react'

export default function Hero() {
  const { ref, isVisible } = useIntersectionObserver()
  const [heroImage, setHeroImage] = useState('/images/iphone-hero-fallback.jpg')

  useEffect(() => {
    // Load hero image from assets.json
    fetch('/assets.json')
      .then((res) => res.json())
      .then((assets) => {
        setHeroImage(assets.hero_video?.fallback || heroImage)
      })
      .catch(() => {
        // Use fallback if fetch fails
        setHeroImage(heroImage)
      })
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, type: 'spring', stiffness: 50 }
    },
  }

  return (
    <section
      ref={ref}
      className="relative h-screen bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <Image
        src={heroImage}
        alt="iPhone 17 Pro hero background"
        fill
        className="object-cover opacity-30"
        priority
        unoptimized
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

      {/* Content */}
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className="relative z-10 text-center max-w-2xl px-4"
      >
        <motion.h2
          variants={itemVariants}
          className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
        >
          iPhone 17 Pro
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-gray-300 mb-8 font-light"
        >
          A studio is taking shape
        </motion.p>

        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          Learn more
        </motion.button>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <svg
          className="w-6 h-6 text-white/50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </motion.div>
    </section>
  )
}
