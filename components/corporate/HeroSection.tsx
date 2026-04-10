'use client'

import dynamic from 'next/dynamic'

// SSR 回避: Three.js は window/canvas に依存するためサーバー側では動かせない
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false })

export default function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
      aria-label="ヒーローセクション"
    >
      {/* Three.js パーティクル背景 (decorative) */}
      <HeroScene />

      {/* テキストオーバーレイ — z-index で前面に配置 */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <p className="text-sm font-medium tracking-widest uppercase text-[var(--color-accent)] opacity-80">
          Creative Workshop
        </p>

        <h1 className="font-display text-6xl md:text-8xl font-bold leading-none text-gradient-purple">
          3D&MUSIC JAM
        </h1>

        <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-lg leading-relaxed">
          クリエイティブな就労継続支援B型事業所。
          <br />
          3Dアートと音楽で、あなたの表現をカタチにする場所。
        </p>

        <div className="flex gap-4 mt-2">
          <a
            href="#works"
            className="px-8 py-3 rounded-full bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            作品を見る
          </a>
          <a
            href="#about"
            className="px-8 py-3 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            事業所について
          </a>
        </div>

        {/* スクロール誘導 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-xs tracking-widest uppercase text-[var(--color-text-muted)]">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-[var(--color-primary)] to-transparent" />
        </div>
      </div>
    </section>
  )
}
