// ── Data ──────────────────────────────────────────────────────────────────────

interface FlowStep {
  time: string
  title: string
  description: string
  accent?: boolean
}

const STEPS: FlowStep[] = [
  {
    time: '10:00',
    title: '開所・朝のミーティング',
    description: 'その日の作業内容を確認。スタッフと相談しながら目標を決めます。',
  },
  {
    time: '10:30',
    title: '創作活動',
    description: '各自が選んだコースで制作に集中。スタッフが随時サポートします。',
    accent: true,
  },
  {
    time: '12:00',
    title: '昼休憩',
    description: 'お昼ご飯の時間。利用者同士で話したり、休んだりして過ごします。',
  },
  {
    time: '13:00',
    title: '午後の創作活動',
    description: '引き続き制作。スキルアップ動画の視聴や、外部講師によるレクチャーもあります。',
    accent: true,
  },
  {
    time: '15:00',
    title: 'おやつ・フリータイム',
    description: '一息ついてリフレッシュ。軽い交流タイムでもあります。',
  },
  {
    time: '15:30',
    title: '作業まとめ・振り返り',
    description: '今日の成果を記録。スタッフとともに次回の目標を設定します。',
  },
  {
    time: '16:00',
    title: '閉所',
    description: 'お疲れ様でした。無理のないペースで毎日続けることが大切です。',
  },
]

// ── Sub-component ──────────────────────────────────────────────────────────────

function FlowItem({ step, index }: { step: FlowStep; index: number }) {
  const isEven = index % 2 === 0

  return (
    <li
      data-flow-item
      className={[
        'relative flex gap-6 md:gap-10',
        isEven ? 'md:flex-row' : 'md:flex-row-reverse',
      ].join(' ')}
    >
      {/* Time badge */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          className={[
            'w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2',
            step.accent
              ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]',
          ].join(' ')}
        >
          <span data-flow-time className="text-center leading-tight">
            {step.time}
          </span>
        </div>
        {/* Connector line */}
        <div className="w-px flex-1 bg-[var(--color-border)] mt-2" />
      </div>

      {/* Content */}
      <div className="pb-10 flex-1">
        <h3 className="font-display text-base font-bold text-[var(--color-text)] mb-1">
          {step.title}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          {step.description}
        </p>
      </div>
    </li>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DayFlowSection() {
  return (
    <section
      aria-label="1日の流れ"
      role="region"
      id="dayflow"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      <div className="max-w-2xl mx-auto mb-12 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
          Daily Schedule
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
          1日の流れ
        </h2>
        <p className="text-[var(--color-text-muted)]">
          無理のないペースで、自分らしく過ごせます。
        </p>
      </div>

      <ol className="max-w-lg mx-auto">
        {STEPS.map((step, i) => (
          <FlowItem key={step.time} step={step} index={i} />
        ))}
      </ol>
    </section>
  )
}
