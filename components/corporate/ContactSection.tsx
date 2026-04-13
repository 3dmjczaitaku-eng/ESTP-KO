'use client'

import { useState } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

// ── Form field sub-component ───────────────────────────────────────────────────

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
        {label}
        {required && <span className="text-[var(--color-primary)] ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors duration-200 text-sm'

// ── Main component ─────────────────────────────────────────────────────────────

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false)
  const sectionRef = useScrollReveal('.reveal')
  const ref = sectionRef as React.RefObject<HTMLElement>

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Static export: form submission handled via external service (e.g. Formspree)
    // For now, show success state
    setSubmitted(true)
  }

  return (
    <section
      ref={ref}
      aria-label="お問い合わせ"
      role="region"
      id="contact"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      <div className="max-w-2xl mx-auto mb-12 text-center">
        <p className="reveal text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
          Contact
        </p>
        <h2 className="reveal font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
          お問い合わせ
        </h2>
        <p className="reveal text-[var(--color-text-muted)] max-w-lg mx-auto">
          見学・体験のご予約、その他ご質問はこちらからどうぞ。
          お気軽にご連絡ください。
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        {submitted ? (
          <div className="text-center py-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <p className="font-display text-2xl font-bold text-[var(--color-primary)] mb-2">
              送信完了しました
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              2〜3営業日以内にご返信いたします。
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
            noValidate
          >
            <Field id="contact-name" label="お名前" required>
              <input
                id="contact-name"
                type="text"
                name="name"
                placeholder="山田 太郎"
                required
                className={inputClass}
              />
            </Field>

            <Field id="contact-email" label="メールアドレス" required>
              <input
                id="contact-email"
                type="email"
                name="email"
                placeholder="example@email.com"
                required
                className={inputClass}
              />
            </Field>

            <Field id="contact-subject" label="お問い合わせ種別">
              <select id="contact-subject" name="subject" className={inputClass}>
                <option value="">選択してください</option>
                <option value="visit">見学・体験希望</option>
                <option value="course">コースについて</option>
                <option value="pricing">費用・受給者証について</option>
                <option value="other">その他</option>
              </select>
            </Field>

            <Field id="contact-message" label="お問い合わせ内容" required>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                placeholder="ご質問やご要望をご記入ください。"
                required
                className={`${inputClass} resize-y`}
              />
            </Field>

            <button
              type="submit"
              className="mt-2 w-full py-3 rounded-full bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              送信する
            </button>
          </form>
        )}

        {/* Address info */}
        <div className="mt-10 text-center text-sm text-[var(--color-text-muted)] space-y-1">
          <p>千葉県千葉市 ／ TEL: お問い合わせフォームよりご確認ください</p>
          <p>営業時間: 月〜金 10:00〜16:00（祝日除く）</p>
        </div>
      </div>
    </section>
  )
}
