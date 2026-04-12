import { convertToWebm, extractPoster } from '../video-converter'
import * as cp from 'child_process'

jest.mock('child_process', () => ({
  execFile: jest.fn(),
}))

describe('video-converter', () => {
  beforeEach(() => {
    (cp.execFile as unknown as jest.Mock).mockImplementation(
      (_cmd: string, _args: string[], cb: (err: Error | null) => void) => cb(null)
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('convertToWebm', () => {
    it('calls ffmpeg executable', async () => {
      await convertToWebm('input.mp4', 'output.webm')
      expect(cp.execFile).toHaveBeenCalledWith(
        'ffmpeg',
        expect.any(Array),
        expect.any(Function)
      )
    })

    it('uses VP9 codec', async () => {
      await convertToWebm('input.mp4', 'output.webm')
      const args = (cp.execFile as unknown as jest.Mock).mock.calls[0][1] as string[]
      expect(args).toContain('-codec:v')
      expect(args).toContain('libvpx-vp9')
    })

    it('includes input and output paths', async () => {
      await convertToWebm('input.mp4', 'output.webm')
      const args = (cp.execFile as unknown as jest.Mock).mock.calls[0][1] as string[]
      expect(args).toContain('input.mp4')
      expect(args).toContain('output.webm')
    })

    it('disables audio track', async () => {
      await convertToWebm('input.mp4', 'output.webm')
      const args = (cp.execFile as unknown as jest.Mock).mock.calls[0][1] as string[]
      expect(args).toContain('-an')
    })

    it('rejects on ffmpeg error', async () => {
      (cp.execFile as unknown as jest.Mock).mockImplementation(
        (_cmd: string, _args: string[], cb: (err: Error | null) => void) =>
          cb(new Error('ffmpeg not found'))
      )
      await expect(convertToWebm('in.mp4', 'out.webm')).rejects.toThrow('ffmpeg not found')
    })
  })

  describe('extractPoster', () => {
    it('calls ffmpeg executable', async () => {
      await extractPoster('input.mp4', 'poster.jpg')
      expect(cp.execFile).toHaveBeenCalledWith(
        'ffmpeg',
        expect.any(Array),
        expect.any(Function)
      )
    })

    it('extracts single frame', async () => {
      await extractPoster('input.mp4', 'poster.jpg')
      const args = (cp.execFile as unknown as jest.Mock).mock.calls[0][1] as string[]
      expect(args).toContain('-frames:v')
      expect(args).toContain('1')
    })

    it('includes input and output paths', async () => {
      await extractPoster('input.mp4', 'poster.jpg')
      const args = (cp.execFile as unknown as jest.Mock).mock.calls[0][1] as string[]
      expect(args).toContain('input.mp4')
      expect(args).toContain('poster.jpg')
    })

    it('rejects on ffmpeg error', async () => {
      (cp.execFile as unknown as jest.Mock).mockImplementation(
        (_cmd: string, _args: string[], cb: (err: Error | null) => void) =>
          cb(new Error('codec error'))
      )
      await expect(extractPoster('in.mp4', 'poster.jpg')).rejects.toThrow('codec error')
    })
  })
})
