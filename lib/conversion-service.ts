/**
 * Conversion service — orchestrates async FFmpeg conversion with
 * robust error recovery and resource cleanup.
 *
 * Responsibilities:
 * - Run FFmpeg conversion for a queued job
 * - Guarantee temp file cleanup on both success and failure
 * - Publish job state transitions (Converting -> Uploading -> Completed)
 * - Never leak uncaught promise rejections
 * - Respect optional AbortSignal for cancellation plumbing
 */

import fs from 'fs/promises';
import path from 'path';
import { jobQueue } from './job-queue';
import { convertVideoWithFFmpeg } from './ffmpeg-converter';

const OUTPUT_DIR = path.join(process.cwd(), 'tmp/outputs');
const DEFAULT_TIMEOUT_MS = 300000; // 5 minutes

export interface ConversionTask {
  jobId: string;
  inputPath: string;
  /** Optional abort signal for cancellation */
  abortSignal?: AbortSignal;
  /** Optional override for output directory (testing) */
  outputDir?: string;
  /** Optional timeout override */
  timeoutMs?: number;
}

/**
 * Delete a file, swallowing ENOENT / already-gone errors.
 * Exported so tests can verify cleanup happens even on retries.
 */
export async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File already gone or inaccessible — nothing to clean up
  }
}

/**
 * Core conversion routine. Throws on failure so callers can decide
 * whether to retry or report. Always cleans up the input temp file
 * before returning (success OR failure).
 */
export async function runConversion(task: ConversionTask): Promise<void> {
  const {
    jobId,
    inputPath,
    abortSignal,
    outputDir = OUTPUT_DIR,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = task;

  const outputPath = path.join(outputDir, `${jobId}.webm`);

  // Early abort check so a cancelled task never burns FFmpeg
  if (abortSignal?.aborted) {
    await safeUnlink(inputPath);
    throw new Error('Conversion aborted before start');
  }

  try {
    await fs.mkdir(outputDir, { recursive: true });

    jobQueue.updateJob(jobId, {
      phase: 'Converting',
      progress: 0,
    });

    await convertVideoWithFFmpeg({
      inputPath,
      outputPath,
      timeoutMs,
      onProgress: (percent: number) => {
        // Cap at 99 — 100 is reserved for post-conversion completion
        jobQueue.updateJob(jobId, {
          phase: 'Converting',
          progress: Math.min(percent, 99),
        });
      },
    });

    // Post-conversion: treat as Uploading while we (would) move the file
    jobQueue.updateJob(jobId, {
      phase: 'Uploading',
      progress: 0,
      outputPath,
    });

    // Respect abort between phases
    if (abortSignal?.aborted) {
      throw new Error('Conversion aborted after FFmpeg step');
    }

    jobQueue.updateJob(jobId, {
      phase: 'Completed',
      progress: 100,
      completedAt: Date.now(),
    });
  } finally {
    // Always clean up the input temp file — conversion is either done
    // or failed; the raw upload is no longer needed either way.
    await safeUnlink(inputPath);
  }
}

/**
 * Fire-and-forget wrapper for background conversion.
 *
 * Returns a promise (never rejected) so callers can `void` it safely
 * while also letting tests `await` it to observe completion.
 */
export function startConversionAsync(task: ConversionTask): Promise<void> {
  return runConversion(task).catch((err: unknown) => {
    const message =
      err instanceof Error ? err.message : 'Conversion failed';
    jobQueue.updateJob(task.jobId, {
      phase: 'Completed',
      error: message,
      completedAt: Date.now(),
    });
    // Intentionally swallow — caller already has the error reflected
    // in job state. Re-throwing would produce an uncaught rejection.
  });
}
