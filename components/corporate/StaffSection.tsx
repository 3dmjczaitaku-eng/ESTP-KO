'use client'

import React from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCharReveal } from '@/hooks/useCharReveal'

// ── Data ──────────────────────────────────────────────────────────────────────

interface StaffMember {
  name: string
  role: string
  vimeoId?: string
  courses: string[]
}

// Staff data from 3dmj.net source analysis
const STAFF: StaffMember[] = [
  {
    name: 'KOTARO',
    role: '代表 / 3Dアートディレクター',
    vimeoId: '1174641802',
    courses: ['3Dアート', 'Web制作'],
  },
  {
    name: 'YUKI',
    role: 'イラストレーター / Live2Dモデラー',
    vimeoId: '1174645662',
    courses: ['イラスト', 'Live2D'],
  },
  {
    name: 'HARUKA',
    role: '動画クリエイター',
    vimeoId: '1174641802',
    courses: ['動画制作', 'モーショングラフィックス'],
  },
  {
    name: 'SORA',
    role: '音楽プロデューサー / DTMインストラクター',
    vimeoId: '1174646704',
    courses: ['音楽', 'DTM'],
  },
  {
    name: 'MIKA',
    role: 'Webデザイナー / UI/UXエンジニア',
    courses: ['Web制作', 'UI/UX'],
  },
  {
    name: 'RIKU',
    role: 'AIスペシャリスト',
    courses: ['AI活用', 'プロンプト設計'],
  },
  {
    name: 'AOI',
    role: 'イラストレーター',
    vimeoId: '1174645662',
    courses: ['イラスト', 'キャラクターデザイン'],
  },
  {
    name: 'NANA',
    role: 'サウンドデザイナー',
    vimeoId: '1174646704',
    courses: ['音楽', 'サウンドデザイン'],
  },
]

// ── Sub-component ──────────────────────────────────────────────────────────────

function StaffCard({ member }: { member: StaffMember }) {
  return (
    <div
      data-staff-card
      className="card-glow relative rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] group hover:border-[var(--color-primary)]/50 transition-colors duration-300"
    >
      {/* Media */}
      <div className="relative w-full aspect-square">
        {member.vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${member.vimeoId}?autoplay=1&loop=1&muted=1&background=1`}
            className="absolute inset-0 w-full h-full object-cover"
            allow="autoplay; fullscreen"
            title={`${member.name}の紹介映像`}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/10">
            <span className="font-display text-4xl font-bold text-[var(--color-primary)]/40">
              {member.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-base font-bold text-white leading-tight">
            {member.name}
          </h3>
          <p
            data-staff-role
            className="text-xs text-white/70 mt-0.5 leading-snug"
          >
            {member.role}
          </p>
        </div>
      </div>

      {/* Course tags */}
      <div className="px-4 py-3 flex flex-wrap gap-1.5">
        {member.courses.map((course) => (
          <span
            key={course}
            className="px-2 py-0.5 rounded-md text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
          >
            {course}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function StaffSection() {
  const sectionRef = useScrollReveal('.reveal')
  const charRef = useCharReveal({ type: 'words', stagger: 0.025 })

  const setRef = (el: HTMLElement | null) => {
    ;(sectionRef as React.MutableRefObject<HTMLElement | null>).current = el
    ;(charRef as React.MutableRefObject<HTMLElement | null>).current = el
  }

  return (
    <section
      ref={setRef}
      aria-label="スタッフ紹介"
      role="region"
      id="staff"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <p className="reveal text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
          Our Team
        </p>
        <h2 className="char-reveal font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
          スタッフ紹介
        </h2>
        <p className="char-reveal text-[var(--color-text-muted)] max-w-lg mx-auto">
          各分野のプロが、あなたの「作りたい」を全力でサポートします。
        </p>
      </div>

      {/* Staff grid */}
      <div className="reveal max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {STAFF.map((member) => (
          <StaffCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  )
}
