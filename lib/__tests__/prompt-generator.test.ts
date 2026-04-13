import { generateVideoPrompt } from '../prompt-generator'

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({
          positive: 'a person working at a creative studio, natural lighting, subtle hand movements',
          negative: 'blur, artifacts, unrealistic motion, watermark',
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
  })

  it('positive prompt is a non-empty string', async () => {
    const result = await generateVideoPrompt(Buffer.from('fake-image'), 'test.jpg')
    expect(typeof result.positive).toBe('string')
    expect(result.positive.length).toBeGreaterThan(10)
  })

  it('negative prompt is a non-empty string', async () => {
    const result = await generateVideoPrompt(Buffer.from('fake-image'), 'test.jpg')
    expect(typeof result.negative).toBe('string')
    expect(result.negative.length).toBeGreaterThan(5)
  })

  it('positive prompt contains motion description from mock', async () => {
    const result = await generateVideoPrompt(Buffer.from('fake-image'), 'test.jpg')
    expect(result.positive).toContain('creative studio')
  })

  it('returns object with exactly positive and negative keys', async () => {
    const result = await generateVideoPrompt(Buffer.from('hello'), 'photo.png')
    expect(Object.keys(result).sort()).toEqual(['negative', 'positive'])
  })
})
