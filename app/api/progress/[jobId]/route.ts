import { NextRequest, NextResponse } from 'next/server';
import { jobQueue } from '@/lib/job-queue';
import { ProgressEvent } from '@/lib/types/upload';

/**
 * GET /api/progress/[jobId]
 * Server-Sent Events endpoint for real-time conversion progress
 *
 * Returns: text/event-stream with ProgressEvent objects
 *
 * Example usage (client):
 * ```
 * const eventSource = new EventSource(`/api/progress/${jobId}`)
 * eventSource.onmessage = (event) => {
 *   const { phase, progress } = JSON.parse(event.data)
 *   console.log(`Progress: ${phase} - ${progress}%`)
 * }
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // Validate jobId format (UUID)
  if (!isValidUUID(jobId)) {
    return NextResponse.json(
      { error: 'Invalid jobId format' },
      { status: 400 }
    );
  }

  // Check if job exists
  const job = jobQueue.getJob(jobId);
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      let intervalId: NodeJS.Timeout | null = null;
      let isStreamClosed = false;

      const sendProgressUpdate = () => {
        if (isStreamClosed) return;

        const currentJob = jobQueue.getJob(jobId);
        if (!currentJob) {
          // Job was deleted
          controller.close();
          isStreamClosed = true;
          if (intervalId) clearInterval(intervalId);
          return;
        }

        // Format progress event
        const event: ProgressEvent = {
          jobId: currentJob.jobId,
          phase: currentJob.phase,
          progress: currentJob.progress,
          timestamp: Date.now(),
          error: currentJob.error,
        };

        // Send event
        try {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch {
          // Stream may be closed
          isStreamClosed = true;
          if (intervalId) clearInterval(intervalId);
          return;
        }

        // Check if conversion is complete
        if (currentJob.phase === 'Completed') {
          controller.close();
          isStreamClosed = true;
          if (intervalId) clearInterval(intervalId);
        }
      };

      // Send initial update
      sendProgressUpdate();

      // Poll job queue every 500ms
      intervalId = setInterval(sendProgressUpdate, 500);

      // Cleanup on stream close
      return () => {
        isStreamClosed = true;
        if (intervalId) clearInterval(intervalId);
      };
    },
  });

  // Return SSE response
  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering
    },
  });
}

/**
 * Simple UUID validation (v4 format: 8-4-4-4-12)
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
