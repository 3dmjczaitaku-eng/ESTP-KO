# Phase 4 Visual Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** yaoya.io風ダイナミクス強化 + FacilitySection Hero+非対称グリッド + split-type文字スタッガーアニメーションを全セクションに実装する

**Architecture:** split-type (OSS) + GSAP ScrollTrigger で文字/単語単位スタッガー。FacilitySection はshimmerプレースホルダー付きの3列CSS Grid。globals.cssにblob/glow/shimmerユーティリティを追加。

**Tech Stack:** Next.js 16, React 19, TypeScript strict, GSAP 3, split-type, Tailwind CSS 4

---

## Task 0: split-type インストール

**Files:**
- Modify: `package.json`

**Step 1: インストール**
```bash
npm install split-type
```

**Step 2: 型定義確認**
```bash
npx tsc --noEmit 2>&1 | head -5
# Expected: no errors (split-type includes types)
```

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: install split-type for character stagger animation"
```

---

## Task 1: globals.css — blob / shimmer / glow / accent-line

**Files:**
- Modify: `app/globals.css`

**Step 1: 末尾に以下を追加**

```css
/* ─── Phase 4a: Dynamic UI Utilities ──────────────────────────────────────── */

/* Floating blob animations */
@keyframes blobFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(60px, -40px) scale(1.1); }
  66%       { transform: translate(-30px, 30px) scale(0.95); }
}
@keyframes blobFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(-50px, 60px) scale(1.08); }
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.blob-purple {
  width: 500px; height: 500px;
  background: var(--color-primary);
  opacity: 0.18;
  animation: blobFloat1 12s ease-in-out infinite;
}
.blob-lime {
  width: 350px; height: 350px;
  background: var(--color-accent);
  opacity: 0.12;
  animation: blobFloat2 16s ease-in-out infinite;
}

/* Card glow hover */
.card-glow {
  transition: transform 0.3s var(--ease-out-expo),
              box-shadow 0.3s ease;
}
.card-glow:hover {
  transform: scale(1.03) translateY(-4px);
  box-shadow: 0 0 32px rgba(123, 47, 255, 0.45),
              0 12px 40px rgba(0, 0, 0, 0.4);
}

/* Section accent line */
.accent-line {
  height: 2px;
  width: 48px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 0.6s var(--ease-out-expo);
  border-radius: 1px;
}
.accent-line.is-revealed {
  transform: scaleX(1);
}

/* Shimmer placeholder for facility cards */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.shimmer {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    rgba(123, 47, 255, 0.12) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2.2s infinite linear;
}

/* char-reveal: SplitType で分割された要素の初期状態 */
.char-reveal [data-word],
.char-reveal [data-char] {
  display: inline-block;
  will-change: transform, opacity;
}
```

**Step 2: ビルド確認**
```bash
npx next build 2>&1 | tail -6
# Expected: ✓ Compiled successfully
```

**Step 3: Commit**
```bash
git add app/globals.css
git commit -m "feat: add blob/shimmer/glow/accent-line CSS utilities (Phase 4a)"
```

---

## Task 2: useCharReveal フック (TDD)

**Files:**
- Create: `hooks/useCharReveal.ts`
- Create: `hooks/__tests__/useCharReveal.test.ts`

**Step 1: テストを書く**

```typescript
// hooks/__tests__/useCharReveal.test.ts
import { renderHook } from '@testing-library/react'
import { useCharReveal } from '../useCharReveal'

jest.mock('split-type', () => {
  return jest.fn().mockImplementation(() => ({
    words: [document.createElement('span')],
    chars: [document.createElement('span')],
    revert: jest.fn(),
  }))
})

jest.mock('gsap', () => ({
  registerPlugin: jest.fn(),
  context: jest.fn((cb) => { cb(); return { revert: jest.fn() } }),
  from: jest.fn(),
}))

jest.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))

describe('useCharReveal', () => {
  it('returns a containerRef', () => {
    const { result } = renderHook(() => useCharReveal())
    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('current')
  })

  it('does not throw when container has no .char-reveal elements', () => {
    const div = document.createElement('div')
    const { result } = renderHook(() => useCharReveal())
    ;(result.current as React.MutableRefObject<HTMLElement>).current = div
    expect(() => renderHook(() => useCharReveal())).not.toThrow()
  })
})
```

**Step 2: テスト実行 → FAIL確認**
```bash
npx jest useCharReveal --no-coverage 2>&1 | tail -8
# Expected: FAIL - cannot find module '../useCharReveal'
```

**Step 3: 実装**

```typescript
// hooks/useCharReveal.ts
'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface UseCharRevealOptions {
  type?: 'chars' | 'words'
  stagger?: number
  duration?: number
  y?: number
  start?: string
}

export function useCharReveal(options: UseCharRevealOptions = {}) {
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const container = containerRef.current
    if (!container) return

    const targets = container.querySelectorAll<HTMLElement>('.char-reveal')
    if (!targets.length) return

    const {
      type = 'words',
      stagger = 0.03,
      duration = 0.6,
      y = 60,
      start = 'top 80%',
    } = options

    let SplitType: typeof import('split-type').default
    const splits: InstanceType<typeof import('split-type').default>[] = []

    const init = async () => {
      const mod = await import('split-type')
      SplitType = mod.default

      const ctx = gsap.context(() => {
        targets.forEach(el => {
          const split = new SplitType(el, { types: type })
          splits.push(split)
          const units = type === 'chars' ? split.chars : split.words
          if (!units?.length) return

          gsap.from(units, {
            y,
            opacity: 0,
            duration,
            stagger,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: 'play none none none',
            },
          })
        })
      }, container)

      return ctx
    }

    let ctx: Awaited<ReturnType<typeof init>> | undefined
    init().then(c => { ctx = c })

    return () => {
      splits.forEach(s => s.revert())
      ctx?.revert()
    }
  }, [])

  return containerRef
}
```

**Step 4: テスト → PASS**
```bash
npx jest useCharReveal --no-coverage 2>&1 | tail -8
# Expected: PASS
```

**Step 5: 全スイート確認**
```bash
npx jest --no-coverage 2>&1 | tail -6
```

**Step 6: Commit**
```bash
git add hooks/useCharReveal.ts hooks/__tests__/useCharReveal.test.ts
git commit -m "feat: add useCharReveal hook (split-type + GSAP stagger, TDD)"
```

---

## Task 3: FacilitySection — Hero + Asymmetric Grid (TDD)

**Files:**
- Modify: `components/corporate/FacilitySection.tsx`
- Modify: `components/corporate/__tests__/FacilitySection.test.tsx`

**Step 1: テスト更新**

```typescript
// components/corporate/__tests__/FacilitySection.test.tsx
// 既存テストに追加:

it('renders hero card as first facility photo (full-width)', () => {
  render(<FacilitySection />)
  const cards = document.querySelectorAll('[data-facility-photo]')
  expect(cards[0]).toHaveAttribute('data-hero', 'true')
})

it('shows shimmer placeholder when no video/image source', () => {
  render(<FacilitySection />)
  const shimmers = document.querySelectorAll('.shimmer')
  expect(shimmers.length).toBeGreaterThan(0)
})

it('renders 5 facility cards total', () => {
  render(<FacilitySection />)
  expect(document.querySelectorAll('[data-facility-photo]')).toHaveLength(5)
})
```

**Step 2: テスト → FAIL**
```bash
npx jest FacilitySection --no-coverage 2>&1 | tail -8
```

**Step 3: FacilitySection.tsx を全面書き換え**

```tsx
// components/corporate/FacilitySection.tsx
'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCharReveal } from '@/hooks/useCharReveal'

interface Photo {
  id: string
  alt: string
  caption: string
  videoSrc?: string
  imageSrc?: string
  poster?: string
}

const PHOTOS: Photo[] = [
  { id: 'facility-1', alt: 'スタジオ全景', caption: 'メインスタジオ' },
  { id: 'facility-2', alt: '3DCG制作ブース', caption: '3DCGブース' },
  { id: 'facility-3', alt: '音楽制作スタジオ', caption: '音楽スタジオ' },
  { id: 'facility-4', alt: 'ラウンジスペース', caption: 'ラウンジ' },
  { id: 'facility-5', alt: '展示スペース', caption: '展示ギャラリー' },
]

function PhotoCard({ photo, isHero = false }: { photo: Photo; isHero?: boolean }) {
  return (
    <div
      data-facility-photo
      data-hero={isHero ? 'true' : undefined}
      className="relative overflow-hidden rounded-2xl bg-[var(--color-surface)] group"
    >
      {/* Shimmer placeholder */}
      <div className="absolute inset-0 shimmer" />

      {/* Video (once .webm generated) */}
      {photo.videoSrc && (
        <video
          autoPlay muted loop playsInline
          poster={photo.poster}
          aria-label={photo.alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        >
          <source src={photo.videoSrc} type="video/webm" />
        </video>
      )}

      {/* Static image fallback */}
      {!photo.videoSrc && photo.imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.imageSrc}
          alt={photo.alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Caption overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex items-end p-6">
        <p className="text-white font-semibold text-sm tracking-wide">{photo.caption}</p>
      </div>
    </div>
  )
}

export default function FacilitySection() {
  const sectionRef = useScrollReveal('.reveal')
  const charRef = useCharReveal({ type: 'words', stagger: 0.025 })
  const ref = sectionRef as React.RefObject<HTMLElement>

  return (
    <section
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLElement | null>).current = el
        ;(charRef as React.MutableRefObject<HTMLElement | null>).current = el
      }}
      aria-label="施設案内"
      role="region"
      id="facility"
      className="py-24 px-6 relative z-10 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="reveal text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
            Facility
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div className="accent-line is-revealed" />
          </div>
          <h2 className="char-reveal font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
            施設案内
          </h2>
          <p className="char-reveal text-[var(--color-text-muted)] max-w-xl">
            千葉市内の広々としたスタジオで、3DCG・音楽・映像制作に集中できる環境を整えています。
          </p>
        </div>

        {/* Hero + Asymmetric Grid */}
        <div
          data-facility-grid
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          style={{ gridTemplateRows: 'auto' }}
        >
          {/* Hero — full width */}
          <div className="md:col-span-3 h-[420px] md:h-[480px]">
            <PhotoCard photo={PHOTOS[0]} isHero />
          </div>

          {/* Row 2: 1col + 2col */}
          <div className="h-[240px]">
            <PhotoCard photo={PHOTOS[1]} />
          </div>
          <div className="md:col-span-2 h-[240px]">
            <PhotoCard photo={PHOTOS[2]} />
          </div>

          {/* Row 3: 2col + 1col */}
          <div className="md:col-span-2 h-[240px]">
            <PhotoCard photo={PHOTOS[3]} />
          </div>
          <div className="h-[240px]">
            <PhotoCard photo={PHOTOS[4]} />
          </div>
        </div>
      </div>
    </section>
  )
}
```

**Step 4: テスト → PASS**
```bash
npx jest FacilitySection --no-coverage 2>&1 | tail -10
```

**Step 5: Commit**
```bash
git add components/corporate/FacilitySection.tsx components/corporate/__tests__/FacilitySection.test.tsx
git commit -m "feat: FacilitySection — Hero+Asymmetric Grid with shimmer placeholder"
```

---

## Task 4: HeroSection + AboutSection — blob背景 + char-reveal

**Files:**
- Modify: `components/corporate/HeroSection.tsx`
- Modify: `components/corporate/AboutSection.tsx`

**Step 1: HeroSection — blob追加 + char-reveal**

`useCharReveal` を import し、見出しに `.char-reveal` を付与。
blob divを section 内に追加:

```tsx
// HeroSection.tsx 内の section 直下に追加
<div className="blob blob-purple absolute -top-32 -left-32" aria-hidden />
<div className="blob blob-lime absolute bottom-0 right-0" aria-hidden />
```

見出し・サブテキストに `.char-reveal` クラスを追加:
```tsx
<h1 className="char-reveal font-display ...">3D&MUSIC JAM</h1>
<p className="char-reveal text-[var(--color-text-muted)] ...">...</p>
```

**Step 2: AboutSection — blob追加 + char-reveal**

各ピラータイトルと説明文に `.char-reveal`:
```tsx
<h3 className="char-reveal ...">表現する</h3>
<p className="char-reveal ...">...</p>
```

blob を section に追加:
```tsx
<div className="blob blob-purple absolute top-1/4 -right-48" aria-hidden />
```

**Step 3: テスト確認**
```bash
npx jest HeroSection AboutSection --no-coverage 2>&1 | tail -8
```

**Step 4: ビルド + プレビュー確認**
```bash
npx next build 2>&1 | tail -6
```

**Step 5: Commit**
```bash
git add components/corporate/HeroSection.tsx components/corporate/AboutSection.tsx
git commit -m "feat: add blob bg + char-reveal to HeroSection and AboutSection"
```

---

## Task 5: ServicesSection + StaffSection — card-glow + char-reveal

**Files:**
- Modify: `components/corporate/ServicesSection.tsx`
- Modify: `components/corporate/StaffSection.tsx`

**Step 1: ServicesSection**

各コース行 (`data-service-card`) に `.card-glow` クラスを追加。
セクション見出しに `.char-reveal`:
```tsx
<h2 className="char-reveal font-display ...">コース一覧</h2>
<p className="char-reveal ...">各コースの説明...</p>
```

**Step 2: StaffSection**

スタッフカード要素に `.card-glow` を追加。
見出し・説明文に `.char-reveal`:
```tsx
<h2 className="char-reveal ...">スタッフ紹介</h2>
```

**Step 3: テスト確認**
```bash
npx jest ServicesSection StaffSection --no-coverage 2>&1 | tail -8
```

**Step 4: Commit**
```bash
git add components/corporate/ServicesSection.tsx components/corporate/StaffSection.tsx
git commit -m "feat: card-glow hover + char-reveal for ServicesSection and StaffSection"
```

---

## Task 6: InfoHubSection + ContactSection — card-glow + char-reveal

**Files:**
- Modify: `components/corporate/InfoHubSection.tsx`
- Modify: `components/corporate/ContactSection.tsx`

**Step 1: InfoHubSection**

`HubCard` コンポーネントのルート div に `.card-glow` 追加。
セクション見出し・説明に `.char-reveal`:
```tsx
<h2 className="char-reveal ...">よくある質問</h2>
```

**Step 2: ContactSection**

見出し・本文に `.char-reveal`:
```tsx
<h2 className="char-reveal ...">お問い合わせ</h2>
<p className="char-reveal ...">...</p>
```

**Step 3: 全テスト確認**
```bash
npx jest --no-coverage 2>&1 | tail -6
# Expected: 全スイート PASS
```

**Step 4: ビルド確認**
```bash
npx next build 2>&1 | tail -8
# Expected: ✓ Compiled successfully
```

**Step 5: Commit**
```bash
git add components/corporate/InfoHubSection.tsx components/corporate/ContactSection.tsx
git commit -m "feat: card-glow + char-reveal for InfoHubSection and ContactSection"
```

---

## Task 7: プレビュー最終確認

**Step 1: dev サーバー起動**
```bash
npm run dev
# http://localhost:3000/corporate
```

**Step 2: スクリーンショット確認項目**
- [ ] HeroSection: 紫・ライムblobが背景で漂っている
- [ ] スクロールで各セクション見出しが単語単位でスタッガーアニメーション
- [ ] FacilitySection: Hero全幅 + 2行非対称グリッド + shimmer表示
- [ ] ServicesSection / StaffSection: ホバーでグロー効果
- [ ] `prefers-reduced-motion` モードでアニメーション無効を確認

**Step 3: 最終 Commit**
```bash
git add .
git commit -m "feat: Phase 4 complete — yaoya dynamics + facility grid + char-reveal animations"
```
