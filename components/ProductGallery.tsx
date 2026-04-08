'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIntersectionObserver } from '@/lib/hooks'

interface GalleryImage {
  src: string
  alt: string
  name: string
}

export default function ProductGallery() {
  const { ref, isVisible } = useIntersectionObserver()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Load images from assets.json
    fetch('/assets.json')
      .then((res) => res.json())
      .then((assets) => {
        setImages(assets.product_images || [])
      })
      .catch(() => {
        setImages([])
      })
  }, [])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (images.length === 0) {
    return (
      <section className="h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading gallery...</p>
      </section>
    )
  }

  const current = images[currentIndex]

  return (
    <section
      ref={ref}
      className="relative h-screen bg-white flex items-center justify-center overflow-hidden"
    >
      {/* Main Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, type: 'tween' }}
          className="relative w-full h-full flex items-center justify-center"
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            className="object-contain"
            unoptimized
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Image Name */}
      <motion.div
        className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-2xl font-light text-gray-800">{current.name}</h3>
      </motion.div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Previous slide"
        className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg
          className="w-6 h-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={handleNext}
        aria-label="Next slide"
        className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg
          className="w-6 h-6 text-gray-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex
                ? 'bg-gray-800 w-8'
                : 'bg-gray-400 hover:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
