// ── Data ──────────────────────────────────────────────────────────────────────

interface Testimonial {
  quote: string
  author: string
  detail: string
  course: string
}

const VOICES: Testimonial[] = [
  {
    quote: '絵を描くのが好きだったけど、ここに来てから作品として形にできるようになりました。スタッフさんが優しく教えてくれるので安心して通えています。',
    author: 'A.K さん',
    detail: '20代・通所歴1年',
    course: 'イラスト・Live2D',
  },
  {
    quote: 'DTMは初めてでしたが、AI音楽生成ツールと組み合わせることで、すぐに自分の曲を作れるようになりました。毎日楽しくて仕方ないです。',
    author: 'T.M さん',
    detail: '30代・通所歴8ヶ月',
    course: '音楽・DTM',
  },
  {
    quote: '動画編集を学んで、YouTube に自分の作品を投稿できるようになりました。「いいね」をもらえると本当に嬉しいです。',
    author: 'R.S さん',
    detail: '20代・通所歴10ヶ月',
    course: '動画制作',
  },
  {
    quote: 'Webサイトを作れるようになって、家族のお店のホームページをプレゼントできました。「すごい」と言ってもらえた時が一番の喜びでした。',
    author: 'Y.H さん',
    detail: '30代・通所歴1年2ヶ月',
    course: 'Web制作',
  },
  {
    quote: 'AIで画像を生成してポートフォリオを作りました。こんなに自分表現できると思っていなかったので、自信が持てるようになりました。',
    author: 'M.N さん',
    detail: '20代・通所歴6ヶ月',
    course: 'AI活用',
  },
]

// ── Sub-component ──────────────────────────────────────────────────────────────

function VoiceCard({ item }: { item: Testimonial }) {
  return (
    <div
      data-voice-card
      className="flex flex-col gap-4 rounded-2xl p-6 bg-[var(--color-surface)] border border-[var(--color-border)]"
    >
      {/* Opening quote mark */}
      <span className="font-display text-5xl text-[var(--color-primary)]/40 leading-none select-none">
        &ldquo;
      </span>

      <blockquote className="text-sm text-[var(--color-text-muted)] leading-relaxed flex-1 -mt-4">
        {item.quote}
      </blockquote>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
        <div>
          <p data-author className="text-sm font-semibold text-[var(--color-text)]">
            {item.author}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">{item.detail}</p>
        </div>
        <span
          data-course-tag
          className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 whitespace-nowrap"
        >
          {item.course}
        </span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VoiceSection() {
  return (
    <section
      aria-label="利用者の声"
      role="region"
      id="voices"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
          Voices
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
          利用者の声
        </h2>
        <p className="text-[var(--color-text-muted)] max-w-lg mx-auto">
          実際に通ってくださっている方々の声をご紹介します。
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VOICES.map((item) => (
          <VoiceCard key={item.author} item={item} />
        ))}
      </div>
    </section>
  )
}
