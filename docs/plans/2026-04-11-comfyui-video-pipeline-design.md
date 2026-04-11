# ComfyUI Video Pipeline — Design Document

**Date:** 2026-04-11  
**Status:** Approved  

---

## Goal

Claude Code から単一コマンドで、事業所の実写写真 → Wan2.1 AI動画生成 → .webm 変換 →
サイト統合までを一元化するパイプラインを構築する。

---

## Context

### 現状
- 企業サイト (`app/corporate/`) に FacilitySection があるが、Cloudinary プレースホルダー画像を表示中
- ServicesSection / StaffSection は Vimeo iframe で動画を再生
- 外部依存（Vimeo/Cloudinary）を減らし、.webm ネイティブ再生に移行したい

### 環境
| 項目 | 内容 |
|------|------|
| マシン | Mac Studio M2 Ultra 64GB |
| ComfyUI | localhost:8188（インストール済み） |
| 動画モデル | 未インストール（本プランで選定・導入） |
| 動画ホスティング | Vimeo → `public/videos/*.webm` に移行 |

---

## モデル選定: Wan2.1-I2V-14B-480P

| 項目 | 内容 |
|------|------|
| 開発元 | Alibaba (2025) |
| タスク | Image-to-Video (I2V) |
| モデルサイズ | ~17GB (fp16) |
| 出力 | 81フレーム @ 480p = 約3.4秒 @ 24fps |
| M2 Ultra 適性 | Unified Memory 64GB に余裕で収まる |
| MPS サポート | ComfyUI-WanVideoWrapper 対応済み |
| 選定理由 | 実写風・自然な動き（呼吸・手の動き）に最適、現時点最高品質の OSS I2V |

### 必要なモデルファイル

```
ComfyUI/models/
├── wan/
│   └── wan2.1-i2v-14b-480p.safetensors     (~17GB)
├── vae/
│   └── wan_2.1_vae.safetensors              (~1GB)
└── text_encoders/
    └── umt5-xxl-encoder-bf16.safetensors    (~10GB)
```

---

## パイプライン全体像

```
写真ディレクトリ (photos/facility/*.jpg)
        ↓
[Step 1] Claude Vision API (Anthropic SDK)
         写真解析 → 英語プロンプト + ネガティブプロンプト生成
        ↓
[Step 2] ComfyUI ワークフロー JSON 生成
         Wan2.1-I2V テンプレートに パラメータを注入
        ↓
[Step 3] 画像アップロード + ワークフロー投入
         POST localhost:8188/upload/image
         POST localhost:8188/prompt → prompt_id
        ↓
[Step 4] 完了ポーリング
         GET localhost:8188/history/{prompt_id}
         完了まで 5秒間隔でチェック
        ↓
[Step 5] 動画ダウンロード
         GET localhost:8188/view?filename=...&type=output
        ↓
[Step 6] FFmpeg 変換 (execFile で安全に実行)
         .mp4 → .webm (VP9, CRF28)
         → poster.jpg 抽出 (frame 0)
        ↓
[Step 7] 出力
         public/videos/facility-{id}.webm
         public/videos/facility-{id}-poster.jpg
```

---

## ファイル構成

```
scripts/
├── generate-facility-video.ts    (メインCLI)

lib/
├── comfyui-client.ts             (ComfyUI HTTP API クライアント)
├── wan21-workflow.ts             (Wan2.1-I2V ワークフロー JSON テンプレート)
├── prompt-generator.ts           (Claude Vision → プロンプト生成)
├── video-converter.ts            (FFmpeg .mp4 → .webm 変換)
├── __tests__/
│   ├── comfyui-client.test.ts
│   ├── wan21-workflow.test.ts
│   ├── prompt-generator.test.ts
│   └── video-converter.test.ts
└── (既存) replicate.ts / assetConfig.ts / ...

photos/
└── facility/                     (入力写真を置くディレクトリ)

public/
└── videos/                       (生成済み .webm 出力先)

components/corporate/
└── FacilitySection.tsx           (img → video タグへ更新)
```

---

## CLI インターフェース

```bash
# 基本実行
npx ts-node --project tsconfig.scripts.json \
  scripts/generate-facility-video.ts \
  --photos ./photos/facility \
  --output ./public/videos \
  --resolution 480p

# Claude Code からの自然言語指示例:
# "施設写真から動画を生成してください"
# → Claude が上記コマンドを Bash で実行
```

---

## FacilitySection 統合仕様

### 変更前 (Cloudinary img)
```tsx
<img src="https://res.cloudinary.com/..." alt={photo.alt} />
```

### 変更後 (ネイティブ video)
```tsx
<video
  autoPlay muted loop playsInline
  poster={`/videos/${photo.id}-poster.jpg`}
  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
>
  <source src={`/videos/${photo.id}.webm`} type="video/webm" />
</video>
```

---

## プロンプト設計方針

Claude Vision が写真を解析して生成するプロンプトの方向性:

### Positive Prompt テンプレート
```
{scene_description}, creative workspace, soft natural lighting,
subtle realistic motion, people working, documentary style,
cinematic, high quality, smooth movement
```

### Negative Prompt (固定)
```
blur, distortion, unrealistic motion, artifacts, low quality,
flickering, abrupt cuts, watermark, text, logo
```

---

## テスト戦略

- `comfyui-client.ts`: `fetch` をモック化、API レスポンスをスタブ
- `wan21-workflow.ts`: ワークフロー JSON の構造バリデーション
- `prompt-generator.ts`: Anthropic SDK をモック化
- `video-converter.ts`: `child_process.execFile` をモック化（インジェクション防止）
- E2E は ComfyUI 実稼働環境でのみ実行（CI 除外）

---

## マイルストーン

| フェーズ | 内容 | 目安 |
|---------|------|------|
| P0 | Wan2.1 モデルインストール + GUI 動作確認 | ダウンロード待ち 1-2h |
| P1 | ComfyUI API クライアント実装 + テスト | 1h |
| P2 | Wan2.1 ワークフロー JSON テンプレート | 30min |
| P3 | Claude Vision プロンプト生成 | 1h |
| P4 | FFmpeg 変換スクリプト | 30min |
| P5 | フルパイプライン E2E 実行 | 30min |
| P6 | FacilitySection 動画統合 | 1h |
