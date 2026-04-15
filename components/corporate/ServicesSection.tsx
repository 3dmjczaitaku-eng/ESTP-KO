'use client'

import { useState, useCallback } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

// ── Data ──────────────────────────────────────────────────────────────────────

interface CourseCard {
  title: string
  description: string
  vimeoId?: string
  tag: string
  skills: string[]
}

const COURSES: CourseCard[] = [
  {
    title: 'イラスト・Live2D',
    description:
      'プロのイラストレーターが指導。キャラクターデザインから背景イラスト、Vtuber 向け Live2D モデル制作まで。',
    vimeoId: '1174645662',
    tag: 'Illustration',
    skills: ['キャラクターデザイン', 'Live2D', '背景イラスト'],
  },
  {
    title: '動画制作',
    description:
      'Premiere Pro / After Effects を使った本格的な動画編集・モーショングラフィックス。MV やプロモーション映像の制作も。',
    vimeoId: '1174641802',
    tag: 'Video',
    skills: ['映像編集', 'After Effects', 'モーショングラフィックス'],
  },
  {
    title: '音楽・DTM',
    description:
      'Cubase × Suno AI で作曲からミキシングまで。BGM・SE 制作やゲーム・映像コンテンツ向けサウンドデザインを習得。',
    vimeoId: '1174646704',
    tag: 'Music',
    skills: ['DTM', 'Cubase', 'AI音楽生成'],
  },
  {
    title: 'Web制作',
    description:
      'WordPress・Canva を使ったデザインからコーディングまで。レスポンシブ対応・ユーザー体験を重視したサイト構築。',
    tag: 'Web Design',
    skills: ['WordPress', 'HTML/CSS', 'UI/UX'],
  },
  {
    title: 'AI活用',
    description:
      '最新 AI ツールを活用した画像・コンテンツ生成技術。効果的なプロンプト設計と AI 活用戦略を習得。',
    tag: 'AI Image',
    skills: ['画像生成AI', 'プロンプト設計', 'AI活用戦略'],
  },
]

// ── Row component ──────────────────────────────────────────────────────────────

interface CourseRowProps {
  course: CourseCard
  index: number
}

function CourseRow({ course, index }: CourseRowProps) {
  const [hovered, setHovered] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY })
  }, [])

  return (
    <>
      <div
        data-service-card
        className="group relative flex items-start md:items-center gap-6 py-8 border-b border-[var(--color-border)] cursor-default transition-colors duration-200 hover:bg-[var(--color-surface)]/30 px-2 -mx-2 rounded-lg"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Index number */}
        <span className="flex-shrink-0 font-mono text-xs text-[var(--color-text-muted)]/50 w-7 pt-1 md:pt-0">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors duration-300 leading-tight">
            {course.title}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed line-clamp-2">
            {course.description}
          </p>
        </div>

        {/* Skill tags — desktop only */}
        <div className="hidden lg:flex flex-wrap gap-1.5 max-w-[220px] justify-end flex-shrink-0">
          {course.skills.map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded text-[11px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Tag label + arrow */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <span
            data-tag
            className="hidden sm:block text-xs font-mono tracking-wider text-[var(--color-accent)]"
          >
            {course.tag}
          </span>
          <span className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 text-sm">
            ↗
          </span>
        </div>
      </div>

      {/* Floating Vimeo preview — follows cursor */}
      {hovered && course.vimeoId && (
        <div
          className="fixed z-50 w-72 aspect-video rounded-xl overflow-hidden shadow-2xl pointer-events-none animate-[fadeIn_0.25s_ease]"
          style={{
            left: pos.x + 24,
            top: pos.y - 90,
            boxShadow: '0 0 40px rgba(123, 47, 255, 0.4)',
          }}
          aria-hidden="true"
        >
          <iframe
            src={`https://player.vimeo.com/video/${course.vimeoId}?autoplay=1&loop=1&muted=1&background=1`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            title={course.title}
          />
        </div>
      )}
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ServicesSection() {
  const sectionRef = useScrollReveal('.reveal')
  const ref = sectionRef as React.RefObject<HTMLElement>

  return (
    <section
      ref={ref}
      aria-label="コース紹介"
      role="region"
      id="services"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="reveal text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
            Our Courses
          </p>
          <div className="reveal flex items-end justify-between gap-4 flex-wrap">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient-purple">
              コース紹介
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xs text-right hidden md:block">
              未経験から始められる<br />5つのクリエイティブコース
            </p>
          </div>
        </div>

        {/* Top divider */}
        <div className="reveal border-t border-[var(--color-border)]" />

        {/* Course list */}
        <div className="reveal">
          {COURSES.map((course, i) => (
            <CourseRow key={course.title} course={course} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="reveal mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            どのコースも無料体験できます。まずはお気軽にどうぞ。
          </p>
          <a
            href="#contact"
            className="flex-shrink-0 inline-block px-8 py-3 rounded-full bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            見学・体験を申し込む
          </a>
        </div>
      </div>
    </section>
  )
}
