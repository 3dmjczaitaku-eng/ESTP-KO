'use client'

import { motion } from 'framer-motion'
import { useIntersectionObserver, useStaggerAnimation } from '@/lib/hooks'

const SPECS = [
  { label: 'Display', value: '6.9" Dynamic Island' },
  { label: 'Processor', value: 'A19 Pro Bionic' },
  { label: 'Camera', value: '48MP Main + 12MP Ultra Wide' },
  { label: 'Battery', value: 'Up to 33 hours video' },
  { label: 'Storage', value: '256GB, 512GB, 1TB' },
  { label: 'Water Resistance', value: 'IP69 rated' },
]

export default function TechSpecs() {
  const { ref, isVisible } = useIntersectionObserver()
  const delays = useStaggerAnimation(SPECS.length, 0.08)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
    },
  }

  return (
    <section
      ref={ref}
      className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 px-4"
    >
      {/* Header */}
      <motion.div
        className="max-w-4xl mx-auto text-center mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Technical Specifications
        </h2>
        <p className="text-lg text-gray-600">
          Engineered for perfection
        </p>
      </motion.div>

      {/* Specs Grid */}
      <motion.div
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
      >
        {SPECS.map((spec, idx) => (
          <motion.div
            key={spec.label}
            variants={itemVariants}
            data-testid="spec-card"
            className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {spec.label}
            </h3>
            <p className="text-2xl font-light text-gray-900">
              {spec.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Feature Highlight */}
      <motion.div
        className="max-w-4xl mx-auto mt-20 p-8 bg-blue-50 rounded-lg border border-blue-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isVisible ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Titanium Design
        </h3>
        <p className="text-gray-700">
          Aerospace-grade titanium frame with ceramic shield. Durable. Light.
          Incredibly strong.
        </p>
      </motion.div>
    </section>
  )
}
