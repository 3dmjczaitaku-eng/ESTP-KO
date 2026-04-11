# ComfyUI Video Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 施設写真 → Wan2.1 AI動画 → .webm → FacilitySection 統合を Claude Code から一元化する

**Architecture:** TypeScript スクリプト群が Anthropic Vision API (プロンプト生成) と ComfyUI HTTP API (動画生成) を順次呼び出し、FFmpeg で .webm に変換してサイトに統合する

**Tech Stack:** TypeScript + ts-node, @anthropic-ai/sdk, ComfyUI REST API, FFmpeg, Wan2.1-I2V-14B-480P

---

## Task 0: 環境セットアップ (手動)

**Files:** なし（ComfyUI GUI での作業）

**Step 1: ComfyUI-WanVideoWrapper をインストール**
```bash
cd /path/to/ComfyUI/custom_nodes
git clone https://github.com/kijai/ComfyUI-WanVideoWrapper
cd ComfyUI-WanVideoWrapper && pip install -r requirements.txt
```

**Step 2: モデルをダウンロード**
```bash
# Wan2.1-I2V-14B-480P (~17GB) — Hugging Face から
# ComfyUI/models/wan/ に配置
# ComfyUI/models/vae/wan_2.1_vae.safetensors (~1GB)
# ComfyUI/models/text_encoders/umt5-xxl-encoder-bf16.safetensors (~10GB)
```

HuggingFace: `Comfy-Org/Wan_2.1_ComfyUI_repackaged`

**Step 3: ComfyUI GUI でワークフロー動作確認**
- Wan2.1-I2V サンプルワークフローを読み込み
- テスト写真で生成確認
- 成功したら「Save (API Format)」で JSON をエクスポート → `lib/wan21-workflow-template.json` として保存

**Step 4: API 疎通確認**
```bash
curl http://localhost:8188/system_stats
# Expected: {"system":{"os":"...","ram_total":...}}
```

---

## Task 1: TypeScript スクリプト実行環境

**Files:**
- Create: `tsconfig.scripts.json`
- Modify: `package.json` (scripts 追加)

**Step 1: スクリプト用 tsconfig 作成**
```json
// tsconfig.scripts.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "noEmit": false,
    "outDir": ".ts-out"
  },
  "include": ["scripts/**/*", "lib/**/*"]
}
```

**Step 2: package.json に scripts 追加**
```json
"generate:facility-video": "ts-node --project tsconfig.scripts.json scripts/generate-facility-video.ts"
```

**Step 3: 依存関係インストール**
```bash
npm install --save-dev @anthropic-ai/sdk @types/node
```

**Step 4: 動作確認**
```bash
npx ts-node --project tsconfig.scripts.json -e "console.log('ok')"
# Expected: ok
```

**Step 5: Commit**
```bash
git add tsconfig.scripts.json package.json
git commit -m "chore: add scripts tsconfig + ts-node setup"
```

---

## Task 2: ComfyUI API クライアント (TDD)

**Files:**
- Create: `lib/comfyui-client.ts`
- Create: `lib/__tests__/comfyui-client.test.ts`

**Step 1: 失敗するテストを書く**
```typescript
// lib/__tests__/comfyui-client.test.ts
import { ComfyUIClient } from '../comfyui-client'

global.fetch = jest.fn()

describe('ComfyUIClient', () => {
  const client = new ComfyUIClient('http://localhost:8188')

  beforeEach(() => jest.clearAllMocks())

  it('submitWorkflow returns prompt_id', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ prompt_id: 'abc-123' }),
    })
    const id = await client.submitWorkflow({ prompt: {}, client_id: 'test' })
    expect(id).toBe('abc-123')
  })

  it('pollUntilDone resolves when status is complete', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        'abc-123': { status: { completed: true }, outputs: { '9': { videos: [{ filename: 'out.mp4' }] } } },
      }),
    })
    const result = await client.pollUntilDone('abc-123', 100)
    expect(result.filename).toBe('out.mp4')
  })

  it('getDownloadUrl builds correct URL', () => {
    const url = client.getDownloadUrl('out.mp4', 'output')
    expect(url).toBe('http://localhost:8188/view?filename=out.mp4&type=output')
  })
})
```

**Step 2: テスト実行 → FAIL 確認**
```bash
npx jest comfyui-client --no-coverage
# Expected: FAIL — cannot find module '../comfyui-client'
```

**Step 3: 実装**
```typescript
// lib/comfyui-client.ts
export interface WorkflowPayload {
  prompt: Record<string, unknown>
  client_id: string
}

export interface VideoOutput {
  filename: string
  subfolder: string
  type: string
}

export class ComfyUIClient {
  constructor(private baseUrl: string) {}

  async submitWorkflow(payload: WorkflowPayload): Promise<string> {
    const res = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`ComfyUI submit failed: ${res.status}`)
    const data = await res.json() as { prompt_id: string }
    return data.prompt_id
  }

  async pollUntilDone(promptId: string, intervalMs = 5000): Promise<VideoOutput> {
    for (;;) {
      const res = await fetch(`${this.baseUrl}/history/${promptId}`)
      const history = await res.json() as Record<string, unknown>
      const entry = history[promptId] as { status: { completed: boolean }; outputs: Record<string, { videos: VideoOutput[] }> } | undefined
      if (entry?.status?.completed) {
        const videos = Object.values(entry.outputs).flatMap(o => o.videos ?? [])
        if (videos[0]) return videos[0]
      }
      await new Promise(r => setTimeout(r, intervalMs))
    }
  }

  getDownloadUrl(filename: string, type = 'output'): string {
    return `${this.baseUrl}/view?filename=${encodeURIComponent(filename)}&type=${type}`
  }

  async uploadImage(imageBuffer: Buffer, filename: string): Promise<string> {
    const form = new FormData()
    form.append('image', new Blob([imageBuffer]), filename)
    const res = await fetch(`${this.baseUrl}/upload/image`, { method: 'POST', body: form })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const data = await res.json() as { name: string }
    return data.name
  }
}
```

**Step 4: テスト実行 → PASS 確認**
```bash
npx jest comfyui-client --no-coverage
# Expected: PASS (3 tests)
```

**Step 5: Commit**
```bash
git add lib/comfyui-client.ts lib/__tests__/comfyui-client.test.ts
git commit -m "feat: add ComfyUI HTTP API client"
```

---

## Task 3: Wan2.1 ワークフロー JSON テンプレート (TDD)

**Files:**
- Create: `lib/wan21-workflow.ts`
- Create: `lib/wan21-workflow-template.json` (Task 0 でエクスポートしたもの)
- Create: `lib/__tests__/wan21-workflow.test.ts`

**Step 1: 失敗するテストを書く**
```typescript
// lib/__tests__/wan21-workflow.test.ts
import { buildWan21Workflow } from '../wan21-workflow'

describe('buildWan21Workflow', () => {
  const params = {
    imageFilename: 'facility.jpg',
    positivePrompt: 'a creative studio',
    negativePrompt: 'blur, artifacts',
    outputPrefix: 'facility-studio',
    numFrames: 81,
    fps: 24,
  }

  it('returns an object (workflow JSON)', () => {
    const wf = buildWan21Workflow(params)
    expect(typeof wf).toBe('object')
    expect(wf).not.toBeNull()
  })

  it('injects positive prompt into workflow', () => {
    const wf = buildWan21Workflow(params)
    const str = JSON.stringify(wf)
    expect(str).toContain('a creative studio')
  })

  it('injects image filename into workflow', () => {
    const wf = buildWan21Workflow(params)
    const str = JSON.stringify(wf)
    expect(str).toContain('facility.jpg')
  })

  it('injects output prefix into workflow', () => {
    const wf = buildWan21Workflow(params)
    const str = JSON.stringify(wf)
    expect(str).toContain('facility-studio')
  })
})
```

**Step 2: テスト実行 → FAIL 確認**

**Step 3: 実装**

```typescript
// lib/wan21-workflow.ts
// NOTE: Template JSON は Task 0 で ComfyUI GUI からエクスポートした
// wan21-workflow-template.json を使用する。
// 以下は placeholder 実装（実際のノードIDはエクスポートした JSON に合わせる）

export interface Wan21WorkflowParams {
  imageFilename: string
  positivePrompt: string
  negativePrompt: string
  outputPrefix: string
  numFrames?: number
  fps?: number
}

export function buildWan21Workflow(params: Wan21WorkflowParams): Record<string, unknown> {
  // GUI でエクスポートした JSON テンプレートを読み込み、パラメータを差し替える
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const template = JSON.parse(JSON.stringify(require('./wan21-workflow-template.json'))) as Record<string, unknown>

  // ノードIDは実際のテンプレートに合わせて調整する
  // 典型的な構造:
  //   "1": LoadImage → inputs.image = imageFilename
  //   "5": TextEncode(positive) → inputs.text = positivePrompt
  //   "6": TextEncode(negative) → inputs.text = negativePrompt
  //   "9": SaveVideo/VHS_VideoCombine → inputs.filename_prefix = outputPrefix

  const replaceInNode = (nodeId: string, key: string, value: unknown) => {
    const node = template[nodeId] as { inputs: Record<string, unknown> } | undefined
    if (node?.inputs) node.inputs[key] = value
  }

  // これらのノードIDはエクスポートした JSON から確認して修正する
  replaceInNode('1', 'image', params.imageFilename)
  replaceInNode('5', 'text', params.positivePrompt)
  replaceInNode('6', 'text', params.negativePrompt)
  replaceInNode('9', 'filename_prefix', params.outputPrefix)

  return template
}
```

**Step 4: テスト → PASS**
```bash
npx jest wan21-workflow --no-coverage
```

**Step 5: Commit**
```bash
git add lib/wan21-workflow.ts lib/__tests__/wan21-workflow.test.ts
git commit -m "feat: add Wan2.1 workflow template builder"
```

---

## Task 4: Claude Vision プロンプト生成 (TDD)

**Files:**
- Create: `lib/prompt-generator.ts`
- Create: `lib/__tests__/prompt-generator.test.ts`

**Step 1: 失敗するテストを書く**
```typescript
// lib/__tests__/prompt-generator.test.ts
import { generateVideoPrompt } from '../prompt-generator'

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({
          positive: 'a person working at a creative studio, natural lighting',
          negative: 'blur, artifacts, unrealistic motion',
        })}],
      }),
    },
  })),
}))

describe('generateVideoPrompt', () => {
  it('returns positive and negative prompts', async () => {
    const result = await generateVideoPrompt(Buffer.from('fake-image'), 'test.jpg')
    expect(result).toHaveProperty('positive')
    expect(result).toHaveProperty('negative')
    expect(typeof result.positive).toBe('string')
  })

  it('positive prompt contains scene description', async () => {
    const result = await generateVideoPrompt(Buffer.from('fake-image'), 'test.jpg')
    expect(result.positive.length).toBeGreaterThan(10)
  })
})
```

**Step 2: テスト実行 → FAIL**

**Step 3: 実装**
```typescript
// lib/prompt-generator.ts
import Anthropic from '@anthropic-ai/sdk'

export interface VideoPrompts {
  positive: string
  negative: string
}

const FIXED_NEGATIVE =
  'blur, distortion, unrealistic motion, artifacts, low quality, flickering, watermark, text, logo'

const SYSTEM_PROMPT = `You are an expert at writing video generation prompts for Wan2.1 I2V model.
Analyze the provided facility photo and generate prompts for realistic short video generation.
Response must be valid JSON: { "positive": "...", "negative": "..." }
- positive: describe the scene with motion cues (e.g. "subtle hand movements, soft breathing, natural ambient motion")
- negative: always include the standard artifact terms
- Language: English only
- Style: documentary, cinematic, realistic`

export async function generateVideoPrompt(
  imageBuffer: Buffer,
  filename: string
): Promise<VideoPrompts> {
  const client = new Anthropic()
  const base64 = imageBuffer.toString('base64')
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpeg'
  const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg'

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [{
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      }, {
        type: 'text',
        text: 'Generate video prompts for this facility photo. Return JSON only.',
      }],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed = JSON.parse(text) as { positive?: string; negative?: string }

  return {
    positive: parsed.positive ?? 'creative workspace, natural lighting, subtle motion',
    negative: parsed.negative ?? FIXED_NEGATIVE,
  }
}
```

**Step 4: テスト → PASS**
```bash
npx jest prompt-generator --no-coverage
```

**Step 5: Commit**
```bash
git add lib/prompt-generator.ts lib/__tests__/prompt-generator.test.ts
git commit -m "feat: add Claude Vision prompt generator for I2V"
```

---

## Task 5: FFmpeg 動画変換 (TDD)

**Files:**
- Create: `lib/video-converter.ts`
- Create: `lib/__tests__/video-converter.test.ts`

**Step 1: FFmpeg インストール確認**
```bash
which ffmpeg || brew install ffmpeg
ffmpeg -version | head -1
# Expected: ffmpeg version 7.x ...
```

**Step 2: 失敗するテストを書く**
```typescript
// lib/__tests__/video-converter.test.ts
import { convertToWebm, extractPoster } from '../video-converter'
import * as cp from 'child_process'

jest.mock('child_process', () => ({ execFile: jest.fn() }))

describe('video-converter', () => {
  beforeEach(() => {
    (cp.execFile as unknown as jest.Mock).mockImplementation(
      (_cmd: string, _args: string[], cb: (err: Error | null) => void) => cb(null)
    )
  })

  it('convertToWebm calls ffmpeg with VP9 codec', async () => {
    await convertToWebm('input.mp4', 'output.webm')
    expect(cp.execFile).toHaveBeenCalledWith(
      'ffmpeg', expect.arrayContaining(['-codec:v', 'libvpx-vp9']), expect.any(Function)
    )
  })

  it('extractPoster calls ffmpeg with frame 0', async () => {
    await extractPoster('input.mp4', 'poster.jpg')
    expect(cp.execFile).toHaveBeenCalledWith(
      'ffmpeg', expect.arrayContaining(['-frames:v', '1']), expect.any(Function)
    )
  })
})
```

**Step 3: 実装**
```typescript
// lib/video-converter.ts
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export async function convertToWebm(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-i', inputPath,
    '-codec:v', 'libvpx-vp9',
    '-crf', '28',
    '-b:v', '0',
    '-an',          // no audio
    '-y',           // overwrite
    outputPath,
  ])
}

export async function extractPoster(videoPath: string, outputPath: string): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-i', videoPath,
    '-frames:v', '1',
    '-q:v', '2',
    '-y',
    outputPath,
  ])
}
```

**Step 4: テスト → PASS**
```bash
npx jest video-converter --no-coverage
```

**Step 5: Commit**
```bash
git add lib/video-converter.ts lib/__tests__/video-converter.test.ts
git commit -m "feat: add FFmpeg webm converter + poster extractor"
```

---

## Task 6: メイン CLI スクリプト

**Files:**
- Create: `scripts/generate-facility-video.ts`
- Create: `photos/facility/.gitkeep`

**Step 1: photos ディレクトリ作成**
```bash
mkdir -p photos/facility public/videos
touch photos/facility/.gitkeep
```

**Step 2: スクリプト実装**
```typescript
// scripts/generate-facility-video.ts
import fs from 'fs'
import path from 'path'
import { ComfyUIClient } from '../lib/comfyui-client'
import { buildWan21Workflow } from '../lib/wan21-workflow'
import { generateVideoPrompt } from '../lib/prompt-generator'
import { convertToWebm, extractPoster } from '../lib/video-converter'

const COMFYUI_URL = process.env.COMFYUI_URL ?? 'http://localhost:8188'
const CLIENT_ID = `claude-${Date.now()}`

async function processPhoto(
  client: ComfyUIClient,
  photoPath: string,
  outputDir: string
): Promise<void> {
  const filename = path.basename(photoPath)
  const id = path.basename(photoPath, path.extname(photoPath))
  console.log(`\n📸 Processing: ${filename}`)

  // 1. Generate prompts via Claude Vision
  console.log('  → Generating prompts...')
  const imageBuffer = fs.readFileSync(photoPath)
  const prompts = await generateVideoPrompt(imageBuffer, filename)
  console.log(`  ✓ Positive: ${prompts.positive.slice(0, 60)}...`)

  // 2. Upload image to ComfyUI
  console.log('  → Uploading to ComfyUI...')
  const uploadedName = await client.uploadImage(imageBuffer, filename)

  // 3. Build and submit workflow
  console.log('  → Submitting Wan2.1 workflow...')
  const workflow = buildWan21Workflow({
    imageFilename: uploadedName,
    positivePrompt: prompts.positive,
    negativePrompt: prompts.negative,
    outputPrefix: `facility-${id}`,
  })
  const promptId = await client.submitWorkflow({ prompt: workflow, client_id: CLIENT_ID })
  console.log(`  ✓ Job ID: ${promptId}`)

  // 4. Poll until done
  console.log('  → Waiting for generation (this takes 2-5 minutes)...')
  const output = await client.pollUntilDone(promptId)
  console.log(`  ✓ Generated: ${output.filename}`)

  // 5. Download
  const downloadUrl = client.getDownloadUrl(output.filename, output.type)
  const videoRes = await fetch(downloadUrl)
  const tmpMp4 = path.join(outputDir, `${id}-tmp.mp4`)
  fs.writeFileSync(tmpMp4, Buffer.from(await videoRes.arrayBuffer()))

  // 6. Convert to webm + extract poster
  const webmPath = path.join(outputDir, `${id}.webm`)
  const posterPath = path.join(outputDir, `${id}-poster.jpg`)
  console.log('  → Converting to .webm...')
  await convertToWebm(tmpMp4, webmPath)
  await extractPoster(tmpMp4, posterPath)
  fs.unlinkSync(tmpMp4)

  console.log(`  ✅ Done: ${webmPath}`)
}

async function main() {
  const photosDir = process.argv[2] ?? './photos/facility'
  const outputDir = process.argv[3] ?? './public/videos'

  if (!fs.existsSync(photosDir)) {
    console.error(`❌ Photos directory not found: ${photosDir}`)
    process.exit(1)
  }

  fs.mkdirSync(outputDir, { recursive: true })

  const photos = fs.readdirSync(photosDir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .map(f => path.join(photosDir, f))

  if (photos.length === 0) {
    console.error(`❌ No photos found in ${photosDir}`)
    process.exit(1)
  }

  console.log(`🎬 3D&MUSIC JAM — Facility Video Generator`)
  console.log(`📁 Photos: ${photos.length} found`)
  console.log(`🔗 ComfyUI: ${COMFYUI_URL}`)

  const client = new ComfyUIClient(COMFYUI_URL)

  // Verify ComfyUI is running
  try {
    await fetch(`${COMFYUI_URL}/system_stats`)
  } catch {
    console.error(`❌ ComfyUI not reachable at ${COMFYUI_URL}`)
    process.exit(1)
  }

  for (const photo of photos) {
    await processPhoto(client, photo, outputDir)
  }

  console.log('\n🎉 All videos generated!')
  console.log('Next: Update FacilitySection to use <video> tags')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
```

**Step 3: 動作確認（写真1枚でテスト）**
```bash
# テスト用写真を配置してから実行
cp ~/Desktop/facility-test.jpg photos/facility/
npm run generate:facility-video photos/facility public/videos
```

**Step 4: Commit**
```bash
git add scripts/generate-facility-video.ts photos/facility/.gitkeep
git commit -m "feat: add generate-facility-video CLI script"
```

---

## Task 7: FacilitySection 動画統合

**Files:**
- Modify: `components/corporate/FacilitySection.tsx`
- Modify: `components/corporate/__tests__/FacilitySection.test.tsx`

**Step 1: FacilitySection を更新**

`PhotoCard` コンポーネントの `<img>` を `<video>` に置き換える:

```tsx
// 変更前
<img src={photo.src} alt={photo.alt} loading="lazy" className="..." />

// 変更後
<video
  autoPlay
  muted
  loop
  playsInline
  poster={`/videos/${photo.id}-poster.jpg`}
  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
>
  <source src={`/videos/${photo.id}.webm`} type="video/webm" />
</video>
```

**Step 2: Photo データ型を更新**（src フィールドを削除）

```typescript
// 各 photo に id が必要（既に設定済み）
// src の Cloudinary URL を削除し、video パスに統一
```

**Step 3: テスト更新**
```typescript
it('renders video elements instead of img', () => {
  render(<FacilitySection />)
  const videos = document.querySelectorAll('[data-facility-photo] video')
  expect(videos.length).toBeGreaterThan(0)
})
```

**Step 4: テスト → PASS**
```bash
npx jest FacilitySection --no-coverage
```

**Step 5: ビルド確認**
```bash
npx next build 2>&1 | tail -10
```

**Step 6: Commit**
```bash
git add components/corporate/FacilitySection.tsx components/corporate/__tests__/FacilitySection.test.tsx
git commit -m "feat: FacilitySection — Cloudinary img → native video (.webm)"
```

---

## 実行順序まとめ

```
Task 0 → (ComfyUI GUI で手動確認) → Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
```

## E2E 検証コマンド

```bash
# 施設写真を置いて実行
cp ~/写真/施設/*.jpg photos/facility/
npm run generate:facility-video
# → public/videos/*.webm + *-poster.jpg が生成される
npm run dev
# → http://localhost:3000/corporate の FacilitySection で確認
```
