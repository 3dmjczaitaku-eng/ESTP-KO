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

  let parsed: { positive?: string; negative?: string }
  try {
    parsed = JSON.parse(text) as { positive?: string; negative?: string }
  } catch {
    parsed = {}
  }

  return {
    positive: parsed.positive ?? 'creative workspace, natural lighting, subtle motion',
    negative: parsed.negative ?? FIXED_NEGATIVE,
  }
}
