'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

// ── Photo data ─────────────────────────────────────────────────────────────────
// Replace src values with actual Cloudinary URLs when photos are ready.

interface Photo {
  id: string
  alt: string
  span?: 'large' | 'tall' | 'wide' | 'normal'
  caption?: string
}

const PHOTOS: Photo[] = [
  {
    id: 'facility-1',
    alt: 'スタジオ全景 — 広々とした創作スペース',
    span: 'large',
    caption: 'メインスタジオ',
  },
  {
    id: 'facility-2',
    alt: '3DCG制作ブース',
    span: 'tall',
    caption: '3DCGブース',
  },
  {
    id: 'facility-3',
    alt: '音楽制作スタジオ',
    span: 'wide',
    caption: '音楽スタジオ',
  },
  {
    id: 'facility-4',
    alt: 'リラックスできるラウンジスペース',
    span: 'normal',
    caption: 'ラウンジ',
  },
  {
    id: 'facility-5',
    alt: '展示スペース — 作品を飾る白い壁',
    span: 'normal',
    caption: '展示ギャラリー',
  },
]

const spanClass: Record<NonNullable<Photo['span']>, string> = {
  large:  'col-span-2 row-span-2',
  tall:   'col-span-1 row-span-2',
  wide:   'col-span-2 row-span-1',
  normal: 'col-span-1 row-span-1',
}

// ── Photo card ─────────────────────────────────────────────────────────────────

function PhotoCard({ photo }: { photo: Photo }) {
  const cls = spanClass[photo.span ?? 'normal']
  return (
    <div
      data-facility-photo
      className={`${cls} relative overflow-hidden rounded-2xl bg-[var(--color-surface)] group`}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={`/videos/${photo.id}-poster.jpg`}
        aria-label={photo.alt}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      >
        <source src={`/videos/${photo.id}.webm`} type="video/webm" />
      </video>
      {/* Overlay with caption */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        {photo.caption && (
          <p className="text-sm font-medium text-[var(--color-text)]">{photo.caption}</p>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FacilitySection() {
  const sectionRef = useScrollReveal('.reveal')
  const ref = sectionRef as React.RefObject<HTMLElement>

  return (
    <section
      ref={ref}
      aria-label="施設案内"
      role="region"
      id="facility"
      className="py-24 px-6 relative z-10"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="reveal text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
            Facility
          </p>
          <h2 className="reveal font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
            施設案内
          </h2>
          <p className="reveal text-[var(--color-text-muted)] max-w-lg mx-auto">
            千葉市内の広々としたスタジオで、3DCG・音楽・映像制作に集中できる環境を整えています。
          </p>
        </div>

        {/* Asymmetric photo grid — 4 columns, auto rows 200px */}
        <div
          data-facility-grid
          className="reveal grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-3"
        >
          {PHOTOS.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      </div>
    </section>
  )
}
