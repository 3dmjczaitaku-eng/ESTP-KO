// ── Data ──────────────────────────────────────────────────────────────────────

interface PricingPoint {
  title: string
  body: string
}

const POINTS: PricingPoint[] = [
  {
    title: '就労継続支援B型の給付金で運営',
    body: '3D&MUSIC JAM は障害福祉サービスの就労継続支援B型事業所です。国・自治体からの給付金で運営されているため、利用者の方は無料でご利用いただけます。',
  },
  {
    title: '受給者証があれば通所できる',
    body: '障害者手帳または医師の診断書があれば、市区町村に申請して「受給者証」を取得できます。受給者証があれば、原則として自己負担なしで通所が可能です。',
  },
  {
    title: '工賃（お給料）もお支払いします',
    body: '通所しながら制作活動に取り組んでいただくと、工賃をお支払いします。作りながら稼げる仕組みです。',
  },
  {
    title: '申請サポートも無料でお手伝い',
    body: '受給者証の取得手続きが初めての方にも、スタッフが丁寧にサポートします。お気軽にご相談ください。',
  },
]

// ── Sub-component ──────────────────────────────────────────────────────────────

function PricingPoint({ point, index }: { point: PricingPoint; index: number }) {
  return (
    <div
      data-pricing-point
      className="flex gap-5 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
    >
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold text-sm flex items-center justify-center">
        {index + 1}
      </span>
      <div>
        <h3 className="font-display text-base font-bold text-[var(--color-text)] mb-2">
          {point.title}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{point.body}</p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PricingSection() {
  return (
    <section
      aria-label="0円の仕組み"
      role="region"
      id="pricing"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
          Free of Charge
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
          0円の仕組み
        </h2>
        <p className="text-[var(--color-text-muted)] max-w-lg mx-auto">
          なぜ無料で通えるのか。その仕組みを正直にお伝えします。
        </p>
      </div>

      {/* Highlight badge */}
      <div className="max-w-3xl mx-auto mb-10 text-center">
        <div className="inline-block px-6 py-3 rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10">
          <p className="text-[var(--color-primary)] font-bold text-lg">
            利用者負担金 <span className="text-3xl font-display">0</span> 円
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            ※所得に応じて上限あり（ほとんどの方が0円）
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {POINTS.map((point, i) => (
          <PricingPoint key={point.title} point={point} index={i} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          まずは見学・体験からお気軽にどうぞ。
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
