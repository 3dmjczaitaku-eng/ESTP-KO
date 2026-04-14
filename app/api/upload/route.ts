import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { jobQueue } from '@/lib/job-queue';
import { convertVideoWithFFmpeg } from '@/lib/ffmpeg-converter';

// Security: Define allowed file types
const ALLOWED_TYPES = ['video/webm', 'video/mp4'] as const;
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// Storage directories
const UPLOAD_DIR = path.join(process.cwd(), 'tmp/uploads');
const OUTPUT_DIR = path.join(process.cwd(), 'tmp/outputs');

/**
 * POST /api/upload
 * Receives video file, validates, and starts async conversion
 *
 * Request: multipart/form-data with 'file' field
 * Response: { jobId: string } (202 Accepted)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // 1. Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // 2. Validate file type (whitelist)
    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Supported types: ${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { error: `File exceeds ${sizeMB}MB size limit` },
        { status: 413 }
      );
    }

    // 4. Save temporary file
    const jobId = uuidv4();
    const ext = file.type === 'video/mp4' ? 'mp4' : 'webm';
    const tempPath = path.join(UPLOAD_DIR, `${jobId}.${ext}`);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = await file.arrayBuffer();
    await fs.writeFile(tempPath, Buffer.from(buffer));

    // 5. Register job in queue
    jobQueue.addJob({
      jobId,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      phase: 'Converting',
      progress: 0,
      startedAt: Date.now(),
    });

    // 6. Start async conversion (fire and forget)
    // This allows the response to return immediately while conversion happens in background
    startConversionAsync(jobId, tempPath).catch((err) => {
      // Update job with error state
      jobQueue.updateJob(jobId, {
        phase: 'Completed',
        error: err instanceof Error ? err.message : 'Conversion failed',
        completedAt: Date.now(),
      });
    });

    // Return jobId for client to poll progress
    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Background conversion process
 * Runs asynchronously after request returns
 */
async function startConversionAsync(
  jobId: string,
  inputPath: string
): Promise<void> {
  const outputPath = path.join(OUTPUT_DIR, `${jobId}.webm`);

  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Update job: Converting phase
    jobQueue.updateJob(jobId, {
      phase: 'Converting',
      progress: 0,
    });

    // Convert video using FFmpeg
    // Progress callback updates job queue
    await convertVideoWithFFmpeg({
      inputPath,
      outputPath,
      onProgress: (percent: number) => {
        jobQueue.updateJob(jobId, {
          phase: 'Converting',
          progress: Math.min(percent, 99), // Keep at 99% until upload complete
        });
      },
      timeoutMs: 300000, // 5 minutes
    });

    // Update job: Uploading phase
    jobQueue.updateJob(jobId, {
      phase: 'Uploading',
      progress: 0,
      outputPath,
    });

    // Simulate upload/save to storage
    // In production: upload to cloud storage (S3, Cloudinary, etc)
    // For now: just update progress
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mark as completed
    jobQueue.updateJob(jobId, {
      phase: 'Completed',
      progress: 100,
      completedAt: Date.now(),
    });

    console.log(`✅ Conversion complete: ${jobId}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Conversion failed';
    console.error(`❌ Conversion error for ${jobId}:`, errorMessage);

    // Update job with error
    jobQueue.updateJob(jobId, {
      phase: 'Completed',
      error: errorMessage,
      completedAt: Date.now(),
    });

    // Cleanup temp files
    try {
      await fs.unlink(inputPath);
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  }
}
