'use client'

/**
 * FacilitySection Component
 * Displays facility/office photos as auto-playing videos
 * Replaces Cloudinary image placeholders with native WebM video
 */

import { ReactNode } from 'react'

interface Photo {
  id: string
  alt: string
  name: string
}

interface FacilitySectionProps {
  photos?: Photo[]
  title?: string
}

export function FacilitySection({
  photos = [
    { id: 'facility-001', alt: 'Conference room', name: 'Conference Room' },
    { id: 'facility-002', alt: 'Open workspace', name: 'Open Workspace' },
    { id: 'facility-003', alt: 'Collaboration area', name: 'Collaboration Area' },
  ],
  title = 'Our Facilities',
}: FacilitySectionProps): ReactNode {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold mb-12 text-center text-gray-900">{title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {photos.map((photo) => (
            <div key={photo.id} className="relative overflow-hidden rounded-lg shadow-lg group">
              {/* Video element with native WebM playback */}
              <video
                autoPlay
                muted
                loop
                playsInline
                poster={`/videos/${photo.id}-poster.jpg`}
                className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105"
                aria-label={photo.alt}
              >
                <source src={`/videos/${photo.id}.webm`} type="video/webm" />
                {/* Fallback for browsers without WebM support */}
                <img
                  src={`/videos/${photo.id}-poster.jpg`}
                  alt={photo.alt}
                  className="w-full h-80 object-cover"
                />
              </video>

              {/* Photo name overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-lg font-semibold">{photo.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FacilitySection
