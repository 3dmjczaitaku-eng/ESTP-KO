/**
 * FFmpeg video converter wrapper
 * Handles safe command execution with security measures:
 * - execFile with array format (prevents command injection)
 * - Path validation (prevents path traversal)
 * - Timeout protection
 * - Progress callback support
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { ConversionOptions, ConversionResult } from './types/upload';

// Security: Define allowed base directory for input files
const ALLOWED_BASE_DIR = path.join(process.cwd(), 'tmp');

/**
 * Validate file path for security
 * Prevents path traversal attacks
 */
async function validatePath(
  filePath: string,
  allowedBaseDir: string = ALLOWED_BASE_DIR
): Promise<string> {
  // Resolve to absolute path
  const realPath = await fs.realpath(filePath);

  // Ensure path is within allowed directory
  if (!realPath.startsWith(allowedBaseDir)) {
    throw new Error(`Path outside allowed directory: ${realPath}`);
  }

  // Verify file exists and is readable
  try {
    await fs.access(realPath, fs.constants.R_OK);
  } catch {
    throw new Error(`File not accessible: ${filePath}`);
  }

  return realPath;
}

/**
 * Execute FFmpeg command safely with configurable options
 *
 * Uses execFile (not spawn) for safety:
 * - Command and args are separate (no shell injection)
 * - Better suited for one-shot conversions
 * - Simpler error handling
 */
function executeFFmpeg(
  args: string[],
  timeoutMs: number = 300000
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      reject(new Error(`FFmpeg timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    execFile('ffmpeg', args, (err) => {
      clearTimeout(timeout);

      if (timedOut) {
        return; // Already rejected
      }

      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Convert video file to WebM format using VP9 codec
 *
 * Command: ffmpeg -i input.mp4 -codec:v libvpx-vp9 -crf 28 -b:v 0 -an -y output.webm
 *
 * Codec options:
 * - libvpx-vp9: VP9 codec (better compression than H.264)
 * - crf 28: Quality (0-51, lower is better; 28 is medium)
 * - b:v 0: Bitrate 0 (let CRF control quality)
 * - an: Disable audio (required for video upload form)
 * - y: Overwrite output file without asking
 */
export async function convertVideoWithFFmpeg(
  options: ConversionOptions
): Promise<ConversionResult> {
  const {
    inputPath,
    outputPath,
    onProgress,
    timeoutMs = 300000,
  } = options;

  // Security: Validate paths
  const validatedInputPath = await validatePath(inputPath);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Validate that output path is in allowed directory
  const validatedOutputPath = await fs.realpath(outputDir)
    .then((dir) => path.join(dir, path.basename(outputPath)))
    .catch(() => outputPath); // Fallback if directory doesn't exist yet

  if (!validatedOutputPath.startsWith(ALLOWED_BASE_DIR)) {
    throw new Error(`Output path outside allowed directory: ${validatedOutputPath}`);
  }

  // Build FFmpeg command
  // Array format is critical for security (prevents command injection)
  const ffmpegArgs = [
    '-i',
    validatedInputPath,
    '-codec:v',
    'libvpx-vp9',
    '-crf',
    '28',
    '-b:v',
    '0',
    '-an',
    '-y',
    validatedOutputPath,
  ];

  try {
    // Execute FFmpeg conversion
    await executeFFmpeg(ffmpegArgs, timeoutMs);

    // Verify output file exists and get stats
    const stats = await fs.stat(validatedOutputPath);

    // Success
    if (onProgress) {
      onProgress(100);
    }

    return {
      outputPath: validatedOutputPath,
      duration: 0, // TODO: Extract from ffmpeg output if needed
      size: stats.size,
    };
  } catch (error) {
    // Cleanup partial output file on error
    try {
      await fs.unlink(validatedOutputPath);
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  }
}

/**
 * Extract first frame from video as poster image
 * Used for video preview thumbnails
 *
 * Command: ffmpeg -i input.mp4 -vframes 1 -vf scale=1920:-1 -y output.jpg
 */
export async function extractPosterFrame(
  inputPath: string,
  outputPath: string,
  timeoutMs: number = 60000
): Promise<void> {
  // Security: Validate paths
  const validatedInputPath = await validatePath(inputPath);
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Ensure output path is in allowed directory
  if (!outputPath.startsWith(ALLOWED_BASE_DIR)) {
    throw new Error(`Output path outside allowed directory: ${outputPath}`);
  }

  // Build command: extract 1 frame and scale to 1920 width
  const ffmpegArgs = [
    '-i',
    validatedInputPath,
    '-vframes',
    '1',
    '-vf',
    'scale=1920:-1',
    '-y',
    outputPath,
  ];

  try {
    await executeFFmpeg(ffmpegArgs, timeoutMs);
  } catch (error) {
    // Cleanup partial output file on error
    try {
      await fs.unlink(outputPath);
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  }
}
