/**
 * Prompt Generator Tests
 *
 * Tests for Claude Vision-based prompt generation
 */

import { generatePromptsFromBase64, PromptGeneratorError } from '@/lib/prompt-generator'

jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Office scene with natural lighting' }],
  })
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }))
})

describe('Prompt Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generates prompts from base64 image', async () => {
    const result = await generatePromptsFromBase64('fake-base64', 'image/jpeg')

    expect(result.positivePrompt).toContain('Office')
    expect(result.positivePrompt).toContain('documentary style')
    expect(result.negativePrompt).toContain('blur')
  })

  it('includes required prompt elements', async () => {
    const result = await generatePromptsFromBase64('data', 'image/png')

    expect(result.positivePrompt).toContain('soft natural lighting')
    expect(result.positivePrompt).toContain('creative workspace')
    expect(result.positivePrompt).toContain('cinematic')
  })

  it('has consistent negative prompt', async () => {
    const result1 = await generatePromptsFromBase64('data1', 'image/jpeg')
    const result2 = await generatePromptsFromBase64('data2', 'image/png')

    expect(result1.negativePrompt).toBe(result2.negativePrompt)
    expect(result1.negativePrompt).toContain('artifacts')
  })

  it('PromptGeneratorError has correct structure', () => {
    const error = new PromptGeneratorError('TEST', 'message')

    expect(error.code).toBe('TEST')
    expect(error instanceof Error).toBe(true)
  })
})
