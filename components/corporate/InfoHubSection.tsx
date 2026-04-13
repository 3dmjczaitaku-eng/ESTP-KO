'use client'

import React from 'react'
import { useState } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCharReveal } from '@/hooks/useCharReveal'

// ── Hub card data ──────────────────────────────────────────────────────────────

interface HubCard {
  id: string
  icon: string
  label: string
  color: string
  summary: string
  content: React.ReactNode
}

const VOICE_ITEMS = [
  { name: 'Kさん (30代・3DCG)', text: '最初は不安でしたが、自分のペースで通えるのが助かっています。作品がSNSで反応をもらえた時の喜びは格別です。', tag: '3DCGコース' },
  { name: 'Tさん (20代・音楽)', text: 'DAWを一から教えてもらい、半年で自分の曲を完成させました。スタッフさんの個別サポートが手厚いです。', tag: '音楽コース' },
  { name: 'Mさん (40代・映像)', text: '週2日から始めて今は週4日。毎日来るのが楽しいです。', tag: '映像コース' },
]

const DAY_STEPS = [
  { time: '10:00', label: '開所・朝のミーティング', note: '体調確認・今日の活動を共有' },
  { time: '10:30', label: '創作活動（午前）', note: '各コースの制作作業' },
  { time: '12:00', label: '昼食・休憩', note: '自由時間' },
  { time: '13:00', label: '創作活動（午後）', note: '制作続き or 個別サポート' },
  { time: '14:30', label: '振り返り・シェアタイム', note: '作業の進捗を仲間と共有' },
  { time: '15:30', label: 'フリー制作', note: '自由に取り組む時間' },
  { time: '16:00', label: '閉所', note: 'お疲れ様でした！' },
]

const PRICING_ITEMS = [
  { label: '月額利用料', value: '原則 0円', note: '受給者証の自己負担上限額は収入に応じて決定（多くの方が0円）' },
  { label: '自己負担上限', value: '最大 9,300円/月', note: '市区町村民税課税世帯の場合' },
  { label: '食費', value: '実費', note: '近隣のコンビニ・弁当持参も可' },
  { label: '交通費', value: '交通費支給あり', note: '条件あり。詳しくはお問い合わせを' },
]

const FAQ_ITEMS = [
  { q: '障害者手帳がなくても利用できますか？', a: '医師の診断書があれば受給者証を取得して利用できます。まずはご相談ください。' },
  { q: '週何日から通えますか？', a: '週1日から。体調に合わせて日数を増やしていけます。' },
  { q: '創作経験がなくても大丈夫ですか？', a: '未経験からスタートした方がほとんどです。基本操作から丁寧に教えます。' },
  { q: '見学・体験はできますか？', a: 'はい、随時受け付けています。お問い合わせフォームからご連絡ください。' },
]

const CARDS: HubCard[] = [
  {
    id: 'voice',
    icon: '💬',
    label: '利用者の声',
    color: 'var(--color-pop-cyan)',
    summary: '実際に通う方々のリアルな体験談',
    content: (
      <div className="flex flex-col gap-4 pt-4">
        {VOICE_ITEMS.map((v) => (
          <blockquote
            key={v.name}
            data-voice-item
            className="border-l-2 pl-4"
            style={{ borderColor: 'var(--color-pop-cyan)' }}
          >
            <p className="text-sm text-[var(--color-text-muted)] italic leading-relaxed mb-1">"{v.text}"</p>
            <footer className="text-xs text-[var(--color-text-muted)]">
              — {v.name}&nbsp;
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--color-pop-cyan)' }}
                data-course-tag
              >
                {v.tag}
              </span>
            </footer>
          </blockquote>
        ))}
      </div>
    ),
  },
  {
    id: 'dayflow',
    icon: '⏰',
    label: '1日の流れ',
    color: 'var(--color-pop-green)',
    summary: '10:00〜16:00 創作に集中できる1日',
    content: (
      <ol className="flex flex-col gap-3 pt-4">
        {DAY_STEPS.map((step, i) => (
          <li
            key={step.time}
            data-day-step
            className="flex gap-3 items-start text-sm"
          >
            <span
              className="flex-shrink-0 w-14 font-mono font-bold text-xs pt-0.5"
              style={{ color: 'var(--color-pop-green)' }}
            >
              {step.time}
            </span>
            <span className="flex flex-col">
              <span className="font-medium text-[var(--color-text)]">{step.label}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{step.note}</span>
            </span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: 'pricing',
    icon: '¥',
    label: '料金・受給者証',
    color: 'var(--color-pop-yellow)',
    summary: 'ほとんどの方が自己負担0円',
    content: (
      <div className="flex flex-col gap-3 pt-4">
        {PRICING_ITEMS.map((p) => (
          <div
            key={p.label}
            data-pricing-point
            className="rounded-xl p-4 bg-[var(--color-bg)] border border-[var(--color-border)]"
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs text-[var(--color-text-muted)]">{p.label}</span>
              <span
                className="font-bold text-sm"
                style={{ color: 'var(--color-pop-yellow)' }}
              >
                {p.value}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{p.note}</p>
          </div>
        ))}
        <a
          href="#contact"
          className="mt-2 inline-block text-center py-2.5 rounded-full text-sm font-medium text-[var(--color-bg)]"
          style={{ background: 'var(--color-pop-yellow)' }}
        >
          無料相談する →
        </a>
      </div>
    ),
  },
  {
    id: 'faq',
    icon: '?',
    label: 'よくある質問',
    color: 'var(--color-pop-pink)',
    summary: 'まずはここを読んでみてください',
    content: (
      <div className="flex flex-col gap-3 pt-4">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            data-faq-item
            className="group rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none text-sm font-medium text-[var(--color-text)]">
              <span>
                <span style={{ color: 'var(--color-pop-pink)' }} className="font-bold mr-2">Q.</span>
                {item.q}
              </span>
              <span className="flex-shrink-0 transition-transform duration-200 group-open:rotate-45 text-[var(--color-text-muted)]">+</span>
            </summary>
            <div className="px-4 pb-3 border-t border-[var(--color-border)]">
              <p data-faq-answer className="text-sm text-[var(--color-text-muted)] pt-3 leading-relaxed">
                <span style={{ color: 'var(--color-pop-pink)' }} className="font-bold mr-2">A.</span>
                {item.a}
              </p>
            </div>
          </details>
        ))}
      </div>
    ),
  },
]

// ── Hub card component ─────────────────────────────────────────────────────────

function HubCard({ card }: { card: HubCard }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      data-hub-card
      data-hub-card-id={card.id}
      className="card-glow rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden flex flex-col"
    >
      {/* Card header — always visible */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-start gap-4 p-6 text-left w-full hover:bg-[var(--color-bg)]/30 transition-colors duration-200"
      >
        {/* Icon circle */}
        <span
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ background: `color-mix(in srgb, ${card.color} 20%, transparent)`, color: card.color }}
          aria-hidden="true"
        >
          {card.icon}
        </span>

        <span className="flex flex-col gap-1 flex-1">
          <span
            className="font-display text-xl font-bold"
            style={{ color: card.color }}
          >
            {card.label}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">{card.summary}</span>
        </span>

        {/* Chevron */}
        <span
          className={`flex-shrink-0 mt-1 text-[var(--color-text-muted)] transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
          aria-hidden="true"
        >
          +
        </span>
      </button>

      {/* Expandable content */}
      {open && (
        <div
          data-hub-card-content
          className="px-6 pb-6 border-t border-[var(--color-border)] overflow-y-auto max-h-80"
        >
          {card.content}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function InfoHubSection() {
  const sectionRef = useScrollReveal('.reveal')
  const charRef = useCharReveal({ type: 'words', stagger: 0.025 })

  const setRef = (el: HTMLElement | null) => {
    ;(sectionRef as React.MutableRefObject<HTMLElement | null>).current = el
    ;(charRef as React.MutableRefObject<HTMLElement | null>).current = el
  }

  return (
    <section
      ref={setRef}
      aria-label="利用情報ハブ"
      role="region"
      id="info"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="reveal text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
            Info Hub
          </p>
          <h2 className="char-reveal font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
            もっと知る
          </h2>
          <p className="char-reveal text-[var(--color-text-muted)] max-w-lg mx-auto">
            気になるカードをタップして詳細をチェックしてください。
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="reveal grid md:grid-cols-2 gap-4">
          {CARDS.map((card) => (
            <HubCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
