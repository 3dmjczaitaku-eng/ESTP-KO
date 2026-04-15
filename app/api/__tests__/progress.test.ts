/**
 * Tests for GET /api/progress/[jobId] endpoint
 * Validates SSE stream delivery, UUID validation, and job status polling
 */

import { jobQueue } from '@/lib/job-queue';

jest.mock('@/lib/job-queue');

// Use Node's built-in web streams (available on Node 18+ and in jsdom 22+)
// Fallback to a minimal stub only if truly missing.
if (typeof global.ReadableStream === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ReadableStream } = require('stream/web');
  global.ReadableStream = ReadableStream as unknown as typeof global.ReadableStream;
}

jest.mock('next/server', () => {
  const mockNextRequest = jest.fn((url, init) => {
    const storedFormData = init?.body || new FormData();

    return {
      url,
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      formData: jest.fn(async () => storedFormData),
      json: jest.fn().mockResolvedValue({}),
      text: jest.fn().mockResolvedValue(''),
      clone: jest.fn(),
      arrayBuffer: jest.fn(),
      blob: jest.fn(),
      body: init?.body,
    };
  });

  const NextResponseClass = class {
    constructor(body, init) {
      this.body = body;
      this.data = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
      this.ok = this.status < 400;
    }

    async json() {
      return this.data;
    }

    static json(data, init) {
      const instance = new NextResponseClass(data, init);
      return instance;
    }
  };

  return {
    NextRequest: mockNextRequest,
    NextResponse: NextResponseClass,
  };
});

import {
  GET,
  isValidUUID,
  formatProgressEvent,
  createProgressStream,
} from '../progress/[jobId]/route';
import { NextRequest } from 'next/server';

const mockJobQueue = jobQueue as jest.Mocked<typeof jobQueue>;

describe('GET /api/progress/[jobId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJobQueue.getJob = jest.fn();
  });

  it('should return 400 for invalid UUID format', async () => {
    const request = new NextRequest('http://localhost:3000/api/progress/invalid-uuid', {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ jobId: 'invalid-uuid' }),
    });

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('Invalid jobId format');
  });

  it('should return 404 when job is not found', async () => {
    mockJobQueue.getJob = jest.fn().mockReturnValue(null);

    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const request = new NextRequest(`http://localhost:3000/api/progress/${validUUID}`, {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ jobId: validUUID }),
    });

    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.error).toBe('Job not found');
  });

  it('should return SSE stream with text/event-stream content type', async () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    mockJobQueue.getJob = jest.fn().mockReturnValue({
      jobId: validUUID,
      phase: 'Converting',
      progress: 50,
      timestamp: Date.now(),
      error: null,
    });

    const request = new NextRequest(`http://localhost:3000/api/progress/${validUUID}`, {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ jobId: validUUID }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(response.headers.get('Connection')).toBe('keep-alive');
  });

  it('should reject invalid UUID patterns', async () => {
    const invalidUUIDs = [
      'not-a-uuid',
      '123',
      '550e8400-e29b-41d4-a716', // Too short
      '550e8400-e29b-41d4-a716-446655440000-extra', // Too long
      '550e8400_e29b_41d4_a716_446655440000', // Wrong separator
    ];

    for (const invalidUUID of invalidUUIDs) {
      const request = new NextRequest(`http://localhost:3000/api/progress/${invalidUUID}`, {
        method: 'GET',
      });

      const response = await GET(request, {
        params: Promise.resolve({ jobId: invalidUUID }),
      });

      expect(response.status).toBe(400);
    }
  });

  it('should accept valid UUID format (case insensitive)', async () => {
    const lowerUUID = '550e8400-e29b-41d4-a716-446655440000';
    const upperUUID = '550E8400-E29B-41D4-A716-446655440000';

    mockJobQueue.getJob = jest.fn().mockReturnValue({
      jobId: lowerUUID,
      phase: 'Converting',
      progress: 50,
      timestamp: Date.now(),
      error: null,
    });

    // Test lowercase
    let request = new NextRequest(`http://localhost:3000/api/progress/${lowerUUID}`, {
      method: 'GET',
    });

    let response = await GET(request, {
      params: Promise.resolve({ jobId: lowerUUID }),
    });

    expect(response.status).toBe(200);

    // Test uppercase
    mockJobQueue.getJob = jest.fn().mockReturnValue({
      jobId: upperUUID,
      phase: 'Converting',
      progress: 50,
      timestamp: Date.now(),
      error: null,
    });

    request = new NextRequest(`http://localhost:3000/api/progress/${upperUUID}`, {
      method: 'GET',
    });

    response = await GET(request, {
      params: Promise.resolve({ jobId: upperUUID }),
    });

    expect(response.status).toBe(200);
  });
});

describe('progress route — pure helpers', () => {
  describe('isValidUUID', () => {
    it('accepts canonical v4 UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
    it('accepts uppercase UUIDs', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });
    it('rejects non-UUID strings', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('12345')).toBe(false);
    });
  });

  describe('formatProgressEvent', () => {
    it('emits a well-formed SSE data frame', () => {
      const frame = formatProgressEvent({
        jobId: 'abc',
        file: { name: 'v.webm', size: 1, type: 'video/webm' },
        phase: 'Converting',
        progress: 42,
        startedAt: 0,
      });
      expect(frame.startsWith('data: ')).toBe(true);
      expect(frame.endsWith('\n\n')).toBe(true);
      const payload = JSON.parse(frame.replace(/^data: /, '').trimEnd());
      expect(payload).toMatchObject({
        jobId: 'abc',
        phase: 'Converting',
        progress: 42,
      });
      expect(typeof payload.timestamp).toBe('number');
    });
  });
});

describe('createProgressStream — lifecycle', () => {
  const VALID_JOB_ID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockJobQueue.getJob = jest.fn();
  });

  async function readAllAvailable(
    reader: ReadableStreamDefaultReader<string>,
    maxFrames = 10
  ): Promise<string[]> {
    const frames: string[] = [];
    for (let i = 0; i < maxFrames; i++) {
      const { value, done } = await reader.read();
      if (done) break;
      if (typeof value === 'string') frames.push(value);
    }
    return frames;
  }

  it('emits initial frame and terminates with [DONE] on Completed', async () => {
    mockJobQueue.getJob = jest.fn().mockReturnValue({
      jobId: VALID_JOB_ID,
      phase: 'Completed',
      progress: 100,
      startedAt: 0,
      completedAt: 1,
      file: { name: 'v.webm', size: 1, type: 'video/webm' },
    });

    const stream = createProgressStream(VALID_JOB_ID, undefined, {
      pollIntervalMs: 10_000,
    });
    const reader = stream.getReader();

    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(typeof first.value).toBe('string');
    expect(first.value).toContain('"phase":"Completed"');

    const second = await reader.read();
    expect(second.done).toBe(false);
    expect(second.value).toBe('data: [DONE]\n\n');

    const third = await reader.read();
    expect(third.done).toBe(true);
  });

  it('closes immediately when job is missing', async () => {
    mockJobQueue.getJob = jest.fn().mockReturnValue(undefined);

    const stream = createProgressStream(VALID_JOB_ID, undefined, {
      pollIntervalMs: 10_000,
    });
    const reader = stream.getReader();

    const { done } = await reader.read();
    expect(done).toBe(true);
  });

  it('emits a frame during Converting phase', async () => {
    mockJobQueue.getJob = jest.fn().mockReturnValue({
      jobId: VALID_JOB_ID,
      phase: 'Converting',
      progress: 30,
      startedAt: 0,
      file: { name: 'v.webm', size: 1, type: 'video/webm' },
    });

    const stream = createProgressStream(VALID_JOB_ID, undefined, {
      pollIntervalMs: 10_000,
    });
    const reader = stream.getReader();

    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(first.value).toContain('"phase":"Converting"');
    expect(first.value).toContain('"progress":30');

    // Cleanup so the interval doesn't leak during the test run
    await reader.cancel();
  });

  it('tears down when AbortSignal is aborted before start', async () => {
    mockJobQueue.getJob = jest.fn().mockReturnValue({
      jobId: VALID_JOB_ID,
      phase: 'Converting',
      progress: 10,
      startedAt: 0,
      file: { name: 'v.webm', size: 1, type: 'video/webm' },
    });

    const controller = new AbortController();
    controller.abort();

    const stream = createProgressStream(VALID_JOB_ID, controller.signal, {
      pollIntervalMs: 10_000,
    });
    const reader = stream.getReader();

    const { done } = await reader.read();
    expect(done).toBe(true);
  });

  it('tears down when AbortSignal fires mid-stream', async () => {
    mockJobQueue.getJob = jest.fn().mockReturnValue({
      jobId: VALID_JOB_ID,
      phase: 'Converting',
      progress: 10,
      startedAt: 0,
      file: { name: 'v.webm', size: 1, type: 'video/webm' },
    });

    const controller = new AbortController();
    const stream = createProgressStream(VALID_JOB_ID, controller.signal, {
      pollIntervalMs: 10_000,
    });
    const reader = stream.getReader();

    // First frame is emitted synchronously inside start()
    const first = await reader.read();
    expect(first.done).toBe(false);

    // Now abort — teardown should close the stream
    controller.abort();

    const next = await reader.read();
    expect(next.done).toBe(true);
  });

  it('routes ReadableStream.cancel() through the teardown path', async () => {
    mockJobQueue.getJob = jest.fn().mockReturnValue({
      jobId: VALID_JOB_ID,
      phase: 'Converting',
      progress: 10,
      startedAt: 0,
      file: { name: 'v.webm', size: 1, type: 'video/webm' },
    });

    const stream = createProgressStream(VALID_JOB_ID, undefined, {
      pollIntervalMs: 10_000,
    });
    const reader = stream.getReader();

    const first = await reader.read();
    expect(first.done).toBe(false);

    // Cancel the consumer — should not throw and should close cleanly
    await expect(reader.cancel()).resolves.toBeUndefined();
  });

  it('stops polling once the job becomes Completed on a later tick', async () => {
    jest.useFakeTimers();
    try {
      // First call: Converting. Second call (next tick): Completed.
      const mockFn = jest
        .fn()
        .mockReturnValueOnce({
          jobId: VALID_JOB_ID,
          phase: 'Converting',
          progress: 50,
          startedAt: 0,
          file: { name: 'v.webm', size: 1, type: 'video/webm' },
        })
        .mockReturnValue({
          jobId: VALID_JOB_ID,
          phase: 'Completed',
          progress: 100,
          startedAt: 0,
          completedAt: 1,
          file: { name: 'v.webm', size: 1, type: 'video/webm' },
        });
      mockJobQueue.getJob = mockFn;

      const stream = createProgressStream(VALID_JOB_ID, undefined, {
        pollIntervalMs: 100,
      });
      const reader = stream.getReader();

      // Initial Converting frame (enqueued synchronously in start())
      const first = await reader.read();
      expect(first.value).toContain('"phase":"Converting"');

      // Fire the next poll tick
      jest.advanceTimersByTime(100);

      // Completed frame, then [DONE], then done
      const second = await reader.read();
      expect(second.value).toContain('"phase":"Completed"');

      const third = await reader.read();
      expect(third.value).toBe('data: [DONE]\n\n');

      const fourth = await reader.read();
      expect(fourth.done).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
