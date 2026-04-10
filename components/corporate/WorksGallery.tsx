'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ── Data ──────────────────────────────────────────────────────────────────────

type TabId = 'illustration' | 'video' | 'music' | 'web' | 'ai'

interface WorkCard {
  title: string
  description: string
  vimeoId?: string
  tag: string
}

interface Tab {
  id: TabId
  label: string
  cards: WorkCard[]
}

const TABS: Tab[] = [
  {
    id: 'illustration',
    label: 'イラスト',
    cards: [
      {
        title: 'キャラクターデザイン',
        description: 'プロのイラストレーターが指導。キャラクターデザインから背景イラストまで。',
        vimeoId: '1174645662',
        tag: 'Illustration',
      },
      {
        title: 'Live2D モデリング',
        description: 'Vtuber 活動に直結する Live2D モデル制作スキルを習得。',
        vimeoId: '1174645662',
        tag: 'Live2D',
      },
    ],
  },
  {
    id: 'video',
    label: '動画',
    cards: [
      {
        title: 'MV・プロモーション映像',
        description: 'Premiere Pro / After Effects を使った本格的な動画編集。',
        vimeoId: '1174641802',
        tag: 'Video',
      },
      {
        title: 'モーショングラフィックス',
        description: 'タイポグラフィアニメーションやエフェクト制作。',
        vimeoId: '1174641802',
        tag: 'Motion',
      },
    ],
  },
  {
    id: 'music',
    label: '音楽',
    cards: [
      {
        title: '楽曲制作・DTM',
        description: 'Cubase × Suno AI で作曲からミキシングまで。AI音楽生成も習得。',
        vimeoId: '1174646704',
        tag: 'Music',
      },
      {
        title: 'サウンドデザイン',
        description: 'BGM・SE 制作。ゲームや映像コンテンツ向けサウンド。',
        vimeoId: '1174646704',
        tag: 'Sound',
      },
    ],
  },
  {
    id: 'web',
    label: 'HP',
    cards: [
      {
        title: 'Webサイト制作',
        description: 'WordPress・Canva を使ったデザインからコーディングまで。',
        tag: 'Web Design',
      },
      {
        title: 'UI / UX 設計',
        description: 'レスポンシブ対応・ユーザー体験を重視したサイト構築。',
        tag: 'UI/UX',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    cards: [
      {
        title: 'AI 画像生成',
        description: '最新 AI ツールを活用した画像・コンテンツ生成技術を習得。',
        tag: 'AI Image',
      },
      {
        title: 'プロンプト設計',
        description: '効果的なプロンプトの書き方と AI 活用戦略。',
        tag: 'Prompt',
      },
    ],
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function WorkCard({ card }: { card: WorkCard }) {
  return (
    <div
      data-work-card
      className="relative flex-shrink-0 w-72 md:w-80 rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] group"
    >
      {/* Media */}
      <div className="relative w-full aspect-video">
        {card.vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${card.vimeoId}?autoplay=1&loop=1&muted=1&background=1`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen"
            title={card.title}
            loading="lazy"
          />
        ) : (
          <div
            data-placeholder
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)]"
          >
            <span className="text-[var(--color-text-muted)] text-xs tracking-widest uppercase">Coming Soon</span>
          </div>
        )}
        {/* Tag chip */}
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 text-[var(--color-accent)] border border-[var(--color-accent)]/30 backdrop-blur-sm">
          {card.tag}
        </span>
      </div>

      {/* Info overlay */}
      <div className="p-4 space-y-1">
        <h3 className="font-display text-base font-bold text-[var(--color-text)]">{card.title}</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{card.description}</p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WorksGallery() {
  const [activeTab, setActiveTab] = useState<TabId>('illustration')
  const trackRef  = useRef<HTMLDivElement>(null)
  const pinRef    = useRef<HTMLDivElement>(null)
  const ctxRef    = useRef<ReturnType<typeof gsap.context> | null>(null)

  const currentTab = TABS.find((t) => t.id === activeTab)!

  // ── GSAP horizontal scroll (desktop only, respects prefers-reduced-motion) ──
  useGSAP(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768
    if (prefersReduced || isMobile || !trackRef.current || !pinRef.current) return

    const track = trackRef.current
    const totalScroll = track.scrollWidth - track.clientWidth

    ctxRef.current = gsap.context(() => {
      gsap.to(track, {
        x: -totalScroll,
        ease: 'none',
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: () => `+=${totalScroll}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    })

    return () => ctxRef.current?.revert()
  }, { dependencies: [activeTab] })

  // Reset ScrollTrigger on tab change
  useEffect(() => {
    ScrollTrigger.refresh()
  }, [activeTab])

  const panelId = `works-panel-${activeTab}`

  return (
    <section
      aria-label="作品ギャラリー"
      role="region"
      id="works"
      className="py-24 px-6 overflow-hidden"
    >
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
          Works Gallery
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
          利用者の作品
        </h2>
        <p className="text-[var(--color-text-muted)] max-w-lg mx-auto">
          「好き」をカタチにした作品たち。未経験からここまで成長できます。
        </p>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="作品カテゴリー"
        className="flex justify-center gap-2 mb-10 flex-wrap"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`works-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`works-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-5 py-2 rounded-full text-sm font-medium transition-all duration-300',
              activeTab === tab.id
                ? 'bg-[var(--color-primary)] text-white shadow-[var(--glow-primary)]'
                : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pinned horizontal scroll container */}
      <div ref={pinRef}>
        <div
          role="tabpanel"
          id={panelId}
          aria-labelledby={`works-tab-${activeTab}`}
          className="overflow-hidden"
        >
          <div
            ref={trackRef}
            className="flex gap-6 md:gap-8 px-4 pb-4 md:w-max"
          >
            {currentTab.cards.map((card, i) => (
              <WorkCard key={`${activeTab}-${i}`} card={card} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          あなたも「好き」をカタチにしてみませんか？
        </p>
        <a
          href="#contact"
          className="inline-block px-8 py-3 rounded-full bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          見学・体験を申し込む
        </a>
      </div>
    </section>
  )
}
