import { NextRequest, NextResponse } from 'next/server';
import { jobQueue } from '@/lib/job-queue';
import { JobState, ProgressEvent } from '@/lib/types/upload';

/**
 * GET /api/progress/[jobId]
 * Server-Sent Events endpoint for real-time conversion progress.
 *
 * Returns: text/event-stream with ProgressEvent objects,
 * followed by a `data: [DONE]` sentinel on completion.
 *
 * Robustness:
 * - Honors request.signal (client disconnect) via AbortSignal listener
 * - Unified teardown closure (once-guarded) to prevent leaked intervals
 * - ReadableStream.cancel() routes to the same teardown
 */

const POLL_INTERVAL_MS = 500;
const DONE_SENTINEL = 'data: [DONE]\n\n';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Simple UUID validation (v4-ish format: 8-4-4-4-12).
 * Exported for unit testing.
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

/**
 * Serialize a JobState into an SSE `data:` frame.
 * Exported for unit testing.
 */
export function formatProgressEvent(job: JobState): string {
  const event: ProgressEvent = {
    jobId: job.jobId,
    phase: job.phase,
    progress: job.progress,
    timestamp: Date.now(),
    error: job.error,
  };
  return `data: ${JSON.stringify(event)}\n\n`;
}

export interface ProgressStreamOptions {
  /** Override poll interval (default 500ms) */
  pollIntervalMs?: number;
}

/**
 * Factory that builds the ReadableStream driving /api/progress.
 *
 * Extracted as a pure function so unit tests can drive the stream
 * directly without involving the full NextRequest/NextResponse plumbing.
 */
export function createProgressStream(
  jobId: string,
  abortSignal?: AbortSignal,
  opts: ProgressStreamOptions = {}
): ReadableStream<string> {
  const pollIntervalMs = opts.pollIntervalMs ?? POLL_INTERVAL_MS;
  let teardownRef: (() => void) | null = null;

  return new ReadableStream<string>({
    start(controller) {
      let intervalId: NodeJS.Timeout | null = null;
      let closed = false;

      const teardown = () => {
        if (closed) return;
        closed = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        try {
          controller.close();
        } catch {
          // Controller may already be closed — ignore.
        }
        if (abortSignal) {
          abortSignal.removeEventListener('abort', teardown);
        }
      };
      teardownRef = teardown;

      const emit = () => {
        if (closed) return;

        const job = jobQueue.getJob(jobId);
        if (!job) {
          // Job was deleted / expired — terminate cleanly.
          teardown();
          return;
        }

        try {
          controller.enqueue(formatProgressEvent(job));
        } catch {
          teardown();
          return;
        }

        if (job.phase === 'Completed') {
          try {
            controller.enqueue(DONE_SENTINEL);
          } catch {
            // Sentinel best-effort; fall through to teardown.
          }
          teardown();
        }
      };

      // Early exit if already aborted (client gone before first tick).
      if (abortSignal?.aborted) {
        teardown();
        return;
      }

      if (abortSignal) {
        abortSignal.addEventListener('abort', teardown, { once: true });
      }

      emit();
      if (!closed) {
        intervalId = setInterval(emit, pollIntervalMs);
      }
    },
    cancel() {
      // Fires when the consumer (NextJS runtime) cancels the stream —
      // route to the same teardown path so we never leak the interval.
      if (teardownRef) teardownRef();
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!isValidUUID(jobId)) {
    return NextResponse.json(
      { error: 'Invalid jobId format' },
      { status: 400 }
    );
  }

  if (!jobQueue.getJob(jobId)) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const stream = createProgressStream(jobId, request.signal);

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
