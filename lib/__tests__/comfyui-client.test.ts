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

  it('submitWorkflow throws on HTTP error', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(client.submitWorkflow({ prompt: {}, client_id: 'test' })).rejects.toThrow('500')
  })

  it('pollUntilDone resolves when status is completed', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        'abc-123': {
          status: { completed: true },
          outputs: { '9': { videos: [{ filename: 'out.mp4', subfolder: '', type: 'output' }] } },
        },
      }),
    })
    const result = await client.pollUntilDone('abc-123', 10)
    expect(result.filename).toBe('out.mp4')
  })

  it('getDownloadUrl builds correct URL', () => {
    expect(client.getDownloadUrl('out.mp4', 'output'))
      .toBe('http://localhost:8188/view?filename=out.mp4&type=output')
  })

  it('uploadImage returns uploaded filename', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'facility.jpg' }),
    })
    const result = await client.uploadImage(Buffer.from('fake'), 'facility.jpg')
    expect(result).toBe('facility.jpg')
  })
})
