'use client'

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

// ── Sub-component ──────────────────────────────────────────────────────────────

function CourseCardItem({ course }: { course: CourseCard }) {
  return (
    <div
      data-service-card
      className="relative flex flex-col rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] group hover:border-[var(--color-primary)]/50 transition-colors duration-300"
    >
      {/* Media */}
      <div className="relative w-full aspect-video flex-shrink-0">
        {course.vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${course.vimeoId}?autoplay=1&loop=1&muted=1&background=1`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen"
            title={course.title}
            loading="lazy"
          />
        ) : (
          <div
            data-placeholder
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg)]"
          >
            <span className="text-[var(--color-text-muted)] text-xs tracking-widest uppercase">
              Coming Soon
            </span>
          </div>
        )}

        {/* Tag chip */}
        <span
          data-tag
          className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 text-[var(--color-accent)] border border-[var(--color-accent)]/30 backdrop-blur-sm"
        >
          {course.tag}
        </span>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="font-display text-lg font-bold text-[var(--color-text)]">
          {course.title}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed flex-1">
          {course.description}
        </p>

        {/* Skill tags */}
        <div className="flex flex-wrap gap-2 pt-1">
          {course.skills.map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded-md text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ServicesSection() {
  return (
    <section
      aria-label="コース紹介"
      role="region"
      id="services"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
          Our Courses
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
          コース紹介
        </h2>
        <p className="text-[var(--color-text-muted)] max-w-lg mx-auto">
          未経験から始められる5つのクリエイティブコース。
          あなたの「好き」を仕事に繋げます。
        </p>
      </div>

      {/* Course grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURSES.map((course) => (
          <CourseCardItem key={course.title} course={course} />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-14 text-center">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          どのコースも無料体験できます。まずはお気軽にどうぞ。
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
