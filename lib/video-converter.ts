/**
 * Video Converter using FFmpeg
 * Converts MP4 video to WebM format and extracts poster image
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execFileAsync = promisify(execFile)

export interface VideoConversionResult {
  webmPath: string
  posterPath: string
}

export class VideoConverterError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'VideoConverterError'
  }
}

/**
 * Convert MP4 to WebM and extract poster image
 *
 * @param inputPath - Path to MP4 file
 * @param outputDir - Output directory for WebM and poster
 * @param fileId - ID for output files (e.g., "facility-001")
 */
export async function convertToWebM(
  inputPath: string,
  outputDir: string,
  fileId: string,
): Promise<VideoConversionResult> {
  // Validate input file exists
  try {
    await fs.access(inputPath)
  } catch {
    throw new VideoConverterError(
      'INPUT_NOT_FOUND',
      `Input file not found: ${inputPath}`,
    )
  }

  // Ensure output directory exists
  try {
    await fs.mkdir(outputDir, { recursive: true })
  } catch (error) {
    throw new VideoConverterError(
      'OUTPUT_DIR_ERROR',
      `Failed to create output directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }

  const webmPath = path.join(outputDir, `${fileId}.webm`)
  const posterPath = path.join(outputDir, `${fileId}-poster.jpg`)

  try {
    // Convert MP4 to WebM (VP9 codec, CRF=28)
    await execFileAsync('ffmpeg', [
      '-i',
      inputPath,
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '28',
      '-b:v',
      '0',
      '-c:a',
      'libopus',
      '-q:a',
      '6',
      '-y',
      webmPath,
    ])

    // Extract first frame as poster
    await execFileAsync('ffmpeg', [
      '-i',
      inputPath,
      '-ss',
      '0',
      '-vframes',
      '1',
      '-y',
      posterPath,
    ])

    return { webmPath, posterPath }
  } catch (error) {
    // Clean up partial files
    try {
      await fs.rm(webmPath, { force: true })
      await fs.rm(posterPath, { force: true })
    } catch {
      // Ignore cleanup errors
    }

    throw new VideoConverterError(
      'CONVERSION_FAILED',
      `FFmpeg conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1:nokey_sep=:',
      filePath,
    ])

    const duration = parseFloat(stdout.trim())
    if (isNaN(duration)) {
      throw new Error('Invalid duration')
    }
    return duration
  } catch (error) {
    throw new VideoConverterError(
      'PROBE_FAILED',
      `Failed to get video duration: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
