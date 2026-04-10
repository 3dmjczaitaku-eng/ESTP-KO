// Phase 1 placeholder — replaced by HeroScene in Phase 2

export default function CorporatePage() {
  return (
    <section
      className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center"
      aria-label="ヒーローセクション"
    >
      <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-gradient-purple">
        3D&MUSIC JAM
      </h1>
      <p className="text-lg text-[var(--color-text-muted)] max-w-xl">
        クリエイティブな就労継続支援B型事業所。
        3Dアートと音楽で、あなたの表現をカタチにする場所。
      </p>
      <a
        href="#works"
        className="mt-4 px-8 py-3 rounded-full border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-300 font-medium"
      >
        作品を見る
      </a>
    </section>
  )
}
