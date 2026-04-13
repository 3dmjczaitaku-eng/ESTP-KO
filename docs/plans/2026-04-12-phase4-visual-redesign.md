# Phase 4 — Visual Redesign Design Document

**Date:** 2026-04-12
**Branch:** claude/eager-varahamihira
**Status:** Approved

---

## Overview

三段階のビジュアル強化を実施する。

1. **Phase 4a** — yaoya.io 参照のダイナミックUI強化（グローバル）
2. **Phase 4b** — FacilitySection を Full-width Hero + Asymmetric Grid にリデザイン（静止画プレースホルダー対応）
3. **Phase 4c** — `split-type` + GSAP による文字・単語単位スタッガーアニメーション（全セクション）

---

## Reference Sites

| サイト | 参照目的 |
|--------|---------|
| https://yaoya.io | ポップカラー構成、ダイナミックUI、カードホバー、フローティングBlobアニメーション |
| https://ichigaya.musabi.ac.jp | 施設写真グリッドレイアウト、大判ヒーロー画像 + 非対称グリッド |
| https://hoshimachi-suisei.jp | スクロール連動テキストスライド＋フェードイン |

---

## Phase 4a — yaoya.io ダイナミクス強化

### 目標
既存カラーシステム（`#7B2FFF` / `#84FF00`）を維持しつつ、動的UI要素を追加。

### 実装仕様

#### A1. フローティング Blob 背景

```css
/* globals.css に追加 */
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
  opacity: 0.18;
  pointer-events: none;
  z-index: 0;
}
.blob-1 {
  width: 500px; height: 500px;
  background: var(--color-primary);
  animation: blobFloat1 12s ease-in-out infinite;
}
.blob-2 {
  width: 400px; height: 400px;
  background: var(--color-accent);
  animation: blobFloat2 15s ease-in-out infinite;
}
```

**追加場所:** HeroSection, AboutSection のセクション背景レイヤー

#### A2. カード hover glow

```css
.card-glow {
  transition: transform 0.3s var(--ease-out-expo),
              box-shadow 0.3s ease;
}
.card-glow:hover {
  transform: scale(1.03) translateY(-4px);
  box-shadow: 0 0 32px rgba(123, 47, 255, 0.45),
              0 12px 40px rgba(0, 0, 0, 0.4);
}
```

**適用:** ServicesSection カード, StaffSection カード, InfoHubSection カード

#### A3. セクション accent ライン

```css
.section-accent-line {
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 0.6s var(--ease-out-expo);
}
.section-accent-line.revealed {
  transform: scaleX(1);
}
```

**追加場所:** 各セクション `<h2>` 直下

#### A4. conic-gradient カラーシフトボーダー（オプション装飾）

HeroSection のCTAボタン周囲に回転ボーダー。

```css
@keyframes borderSpin {
  from { --angle: 0deg; }
  to   { --angle: 360deg; }
}
```

CSS Houdini `@property` が必要なため、Safari 対応に `background-clip` フォールバックを用意。

---

## Phase 4b — FacilitySection リデザイン

### グリッドレイアウト

```
Row 1: [──── HERO (full-width, 480px height) ────]
Row 2: [1col, 240px] [2col (wide), 240px        ]
Row 3: [2col (wide), 240px        ] [1col, 240px]
```

**CSS Grid 仕様:**

```css
.facility-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 480px 240px 240px;
  gap: 12px;
}

/* Hero */
.facility-card:nth-child(1) { grid-column: 1 / -1; }
/* Row 2 */
.facility-card:nth-child(2) { grid-column: 1 / 2; }
.facility-card:nth-child(3) { grid-column: 2 / 4; }
/* Row 3 */
.facility-card:nth-child(4) { grid-column: 1 / 3; }
.facility-card:nth-child(5) { grid-column: 3 / 4; }
```

### プレースホルダー戦略（Option A）

静止画プレースホルダー → 後から `.webm` 差し替え可能な構造。

```tsx
// PhotoCard コンポーネント
function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <div data-facility-photo className="relative overflow-hidden rounded-2xl group">
      {/* Shimmer placeholder (常に表示) */}
      <div className="absolute inset-0 bg-shimmer animate-shimmer" />
      {/* 実画像/動画 (src あり時に表示) */}
      {photo.videoSrc ? (
        <video autoPlay muted loop playsInline poster={photo.poster} className="...">
          <source src={photo.videoSrc} type="video/webm" />
        </video>
      ) : photo.imageSrc ? (
        <img src={photo.imageSrc} alt={photo.alt} className="..." />
      ) : null}
      {/* Caption overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex items-end p-6">
        <p className="text-white font-medium">{photo.caption}</p>
      </div>
    </div>
  )
}
```

**shimmer アニメーション:**
```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.animate-shimmer {
  background: linear-gradient(90deg,
    var(--color-surface) 25%,
    rgba(123,47,255,0.15) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}
```

### レスポンシブ対応

- **モバイル (< 640px):** 全カード 1列縦積み
- **タブレット (640–1024px):** Hero + 2列グリッド
- **デスクトップ (≥ 1024px):** 上記 3列レイアウト

---

## Phase 4c — SplitType + GSAP 文字スタッガー

### ライブラリ選定

| 候補 | 理由 |
|------|------|
| `split-type` (OSS) | GSAP SplitText の OSS 代替、`chars`/`words`/`lines` 対応、MIT ライセンス |
| GSAP SplitText | Club GreenSock（有料）— 採用しない |

### 新フック: `useCharReveal.ts`

```typescript
// hooks/useCharReveal.ts
'use client'
import { useEffect, useRef } from 'react'
import SplitType from 'split-type'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface UseCharRevealOptions {
  type?: 'chars' | 'words'   // 分割単位
  stagger?: number           // 遅延 (秒/単位)
  duration?: number
  y?: number
  start?: string             // ScrollTrigger start
}

export function useCharReveal(options: UseCharRevealOptions = {}) {
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const container = containerRef.current
    if (!container) return

    const { type = 'words', stagger = 0.03, duration = 0.6, y = 60, start = 'top 80%' } = options
    const targets = container.querySelectorAll<HTMLElement>('.char-reveal')
    if (!targets.length) return

    const splits: SplitType[] = []
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

    return () => {
      splits.forEach(s => s.revert())
      ctx.revert()
    }
  }, [])

  return containerRef
}
```

### 適用方針

| 要素 | `type` | `stagger` | 備考 |
|------|--------|-----------|------|
| `<h2>` セクション見出し | `chars` | 0.03s | 文字単位、派手め |
| `<p>` 説明文 | `words` | 0.02s | 単語単位、読みやすさ優先 |
| AboutSection 3ピラータイトル | `chars` | 0.04s | 個別 ScrollTrigger |

### CSS 初期化（FOUC 防止）

```css
/* SplitType が処理するまで非表示にしない */
.char-reveal {
  visibility: visible;
}
```

---

## ファイル変更一覧

| ファイル | 変更内容 |
|---------|---------|
| `app/globals.css` | blob アニメ, shimmer, accent-line, glow ユーティリティ追加 |
| `hooks/useCharReveal.ts` | 新規作成 |
| `components/corporate/FacilitySection.tsx` | Hero+Asymmetric Grid, shimmer placeholder |
| `components/corporate/AboutSection.tsx` | blob 背景, char-reveal |
| `components/corporate/ServicesSection.tsx` | card-glow, char-reveal |
| `components/corporate/StaffSection.tsx` | card-glow, char-reveal |
| `components/corporate/InfoHubSection.tsx` | card-glow, char-reveal |
| `components/corporate/HeroSection.tsx` | blob 背景, accent ライン |
| `components/corporate/ContactSection.tsx` | char-reveal |

## テスト方針

- `useCharReveal` の単体テスト（SplitType mock）
- FacilitySection の shimmer 表示テスト
- 各セクションの `char-reveal` クラス存在確認テスト
- ビルド確認 (`npx next build`)

---

## 成功基準

- [ ] 全セクションの見出し・説明文がスクロールで文字/単語単位スタッガーアニメーション
- [ ] FacilitySection: Hero + 5枚非対称グリッド表示（shimmer プレースホルダー）
- [ ] hover 時 glow エフェクト（ServicesSection, StaffSection, InfoHubSection）
- [ ] フローティング blob が HeroSection, AboutSection 背景で漂う
- [ ] `prefers-reduced-motion: reduce` 時はアニメーション無効
- [ ] 全テスト PASS + ビルドクリーン
