'use client'

import React from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCharReveal } from '@/hooks/useCharReveal'

// ── Data ──────────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    color: 'var(--color-pop-pink)',
    label: '01',
    title: '表現する',
    body: '3Dアート・音楽・映像。ジャンルを超えた創作活動を通して、自分だけの表現を発見する。',
  },
  {
    color: 'var(--color-accent)',
    label: '02',
    title: 'つながる',
    body: '同じ志を持つ仲間と作品を共有し、互いの創造性を高め合うコミュニティをつくる。',
  },
  {
    color: 'var(--color-pop-yellow)',
    label: '03',
    title: 'はたらく',
    body: '制作スキルを磨き、作品を収益化する道筋へ。就労継続支援B型として就労への橋渡しをする。',
  },
] as const

// ── Main component ─────────────────────────────────────────────────────────────

export default function AboutSection() {
  const sectionRef = useScrollReveal('.reveal')
  const charRef = useCharReveal({ type: 'words', stagger: 0.025 })

  const setRef = (el: HTMLElement | null) => {
    ;(sectionRef as React.MutableRefObject<HTMLElement | null>).current = el
    ;(charRef as React.MutableRefObject<HTMLElement | null>).current = el
  }

  return (
    <section
      ref={setRef}
      aria-label="事業所について"
      role="region"
      id="about"
      className="py-24 px-6 relative z-10 overflow-hidden"
    >
      {/* Floating blob backgrounds */}
      <div className="blob blob-lime absolute -top-20 right-10" aria-hidden="true" />
      <div className="blob blob-purple absolute bottom-0 -left-20" aria-hidden="true" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Eyebrow */}
        <p className="reveal text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-4 text-center">
          About
        </p>

        {/* Main headline */}
        <h2 className="char-reveal font-display text-4xl md:text-6xl font-bold text-center mb-6 leading-tight">
          <span className="text-gradient-lime">クリエイティブを、</span>
          <br />
          <span className="text-[var(--color-text)]">生きる力に。</span>
        </h2>

        {/* Lead copy */}
        <p className="char-reveal text-center text-[var(--color-text-muted)] max-w-2xl mx-auto mb-4 leading-relaxed">
          3D&MUSIC JAM は、障害のある方が「好き」を軸に働き・学ぶ場所です。
          就労継続支援B型として、3Dアートと音楽を中心とした創作活動を支援しています。
        </p>

        {/* Welfare note */}
        <p className="reveal text-center text-xs text-[var(--color-text-muted)] mb-16 max-w-xl mx-auto">
          ※ 就労継続支援B型事業所のため、受給者証をお持ちの方（または取得見込みの方）が対象です。
          ほとんどの方が自己負担<strong className="text-[var(--color-text)]">0円</strong>でご利用いただけます。
        </p>

        {/* Philosophy pillars */}
        <div className="grid md:grid-cols-3 gap-6">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.label}
              data-pillar
              className="reveal card-glow rounded-2xl p-8 bg-[var(--color-surface)] border border-[var(--color-border)] relative overflow-hidden group"
            >
              {/* Accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ background: pillar.color }}
              />

              <p
                className="text-xs font-bold tracking-widest mb-3"
                style={{ color: pillar.color }}
              >
                {pillar.label}
              </p>
              <h3
                className="char-reveal font-display text-2xl font-bold mb-3 text-[var(--color-text)]"
              >
                {pillar.title}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
