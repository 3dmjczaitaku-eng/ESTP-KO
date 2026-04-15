/**
 * Video Converter Tests (Minimal)
 */

import { convertToWebM, getVideoDuration, VideoConverterError } from '@/lib/video-converter'

jest.mock('child_process')
jest.mock('fs/promises')

import { execFile } from 'child_process'
import * as fs from 'fs/promises'

const mockExecFile = execFile as unknown as jest.Mock
const mockAccess = fs.access as jest.Mock
const mockMkdir = fs.mkdir as jest.Mock

describe('Video Converter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws error on input file not found', async () => {
    mockAccess.mockRejectedValueOnce(new Error('ENOENT'))

    await expect(convertToWebM('/missing.mp4', '/output', 'test')).rejects.toThrow(
      VideoConverterError,
    )
  })

  it('creates output directory if missing', async () => {
    mockAccess.mockResolvedValueOnce(undefined)
    mockMkdir.mockResolvedValueOnce(undefined)
    mockExecFile.mockImplementation((cmd, args, cb) => cb(null, { stdout: '' }, ''))

    try {
      await convertToWebM('/input.mp4', '/output', 'test')
    } catch {
      // Expected to fail on ffmpeg call
    }

    expect(mockMkdir).toHaveBeenCalledWith('/output', { recursive: true })
  })

  it('creates VideoConverterError on failure', () => {
    const error = new VideoConverterError('TEST', 'message')

    expect(error.code).toBe('TEST')
    expect(error instanceof Error).toBe(true)
  })
})
