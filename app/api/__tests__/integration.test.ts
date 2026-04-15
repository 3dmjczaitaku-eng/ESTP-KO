/**
 * Integration tests for upload and progress endpoints
 * Tests boundary conditions, size limits, and SSE stream behavior
 */

import { jobQueue } from '@/lib/job-queue';

jest.mock('@/lib/job-queue');
jest.mock('@/lib/ffmpeg-converter');
jest.mock('@/lib/conversion-service', () => ({
  startConversionAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random()),
}));
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

// Mock File class
const OriginalFile = global.File;
if (typeof global.File !== 'undefined') {
  global.File = class extends OriginalFile {
    async arrayBuffer() {
      return new ArrayBuffer(0);
    }
  };
}

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
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
      this.ok = this.status < 400;
    }

    static json(data, init) {
      const instance = new NextResponseClass(data, init);
      instance.json = jest.fn(async () => data);
      return instance;
    }
  };

  return {
    NextRequest: mockNextRequest,
    NextResponse: NextResponseClass,
  };
});

import { POST } from '../upload/route';
import { GET } from '../progress/[jobId]/route';
import { NextRequest } from 'next/server';

const mockJobQueue = jobQueue as jest.Mocked<typeof jobQueue>;

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJobQueue.addJob = jest.fn();
    mockJobQueue.getJob = jest.fn();
  });

  describe('Upload boundary conditions', () => {
    it('should accept exactly 500MB file', async () => {
      const formData = new FormData();
      const file = new File(['x'], 'test.mp4', { type: 'video/mp4' });
      Object.defineProperty(file, 'size', { value: 500 * 1024 * 1024 });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(202);
    });

    it('should reject 500.1MB file', async () => {
      const formData = new FormData();
      const file = new File(['x'], 'test.webm', { type: 'video/webm' });
      Object.defineProperty(file, 'size', { value: 500.1 * 1024 * 1024 });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(413);
    });

    it('should accept 499MB file', async () => {
      const formData = new FormData();
      const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });
      Object.defineProperty(file, 'size', { value: 499 * 1024 * 1024 });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(202);
    });

    it('should accept empty file (0 bytes)', async () => {
      const formData = new FormData();
      const file = new File([], 'empty.webm', { type: 'video/webm' });
      Object.defineProperty(file, 'size', { value: 0 });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(202);
    });

    it('should handle filename with special characters', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'video_2024-01-15 (1).mp4', {
        type: 'video/mp4',
      });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(202);

      const json = await response.json();
      expect(json).toHaveProperty('jobId');
    });

    it('should handle filename with UTF-8 characters', async () => {
      const formData = new FormData();
      const file = new File(['test'], '動画_テスト.webm', { type: 'video/webm' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(202);
    });
  });

  describe('Job registration integration', () => {
    it('should register job with correct initial state', async () => {
      const formData = new FormData();
      formData.append('file', new File(['x'], 'test.mp4', { type: 'video/mp4' }));

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(mockJobQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: json.jobId,
          phase: 'Converting',
          progress: 0,
        })
      );
    });

    it('should register multiple jobs with unique IDs', async () => {
      const jobIds = [];

      for (let i = 0; i < 3; i++) {
        const formData = new FormData();
        formData.append('file', new File(['x'], `test${i}.webm`, { type: 'video/webm' }));

        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData,
        });

        const response = await POST(request);
        const json = await response.json();
        jobIds.push(json.jobId);
      }

      // Verify all jobIds are unique
      const uniqueIds = new Set(jobIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('SSE stream format validation', () => {
    it('should return proper SSE headers', async () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      mockJobQueue.getJob = jest.fn().mockReturnValue({
        jobId: validUUID,
        phase: 'Converting',
        progress: 30,
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
      expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    });

    it('should handle missing job gracefully in progress endpoint', async () => {
      mockJobQueue.getJob = jest.fn().mockReturnValue(null);

      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest(`http://localhost:3000/api/progress/${validUUID}`, {
        method: 'GET',
      });

      const response = await GET(request, {
        params: Promise.resolve({ jobId: validUUID }),
      });

      expect(response.status).toBe(404);
    });

    it('should reject malformed UUID in progress endpoint', async () => {
      const request = new NextRequest('http://localhost:3000/api/progress/not-uuid', {
        method: 'GET',
      });

      const response = await GET(request, {
        params: Promise.resolve({ jobId: 'not-uuid' }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid jobId format');
    });
  });

  describe('Multipart form handling', () => {
    it('should handle form with additional fields', async () => {
      const formData = new FormData();
      formData.append('file', new File(['test'], 'video.webm', { type: 'video/webm' }));
      formData.append('metadata', 'extra-field-data');

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      // Should still succeed and ignore extra fields
      expect(response.status).toBe(202);
    });

    it('should handle file with long filename', async () => {
      const longName = 'video-' + 'a'.repeat(200) + '.mp4';
      const formData = new FormData();
      formData.append('file', new File(['x'], longName, { type: 'video/mp4' }));

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(202);
    });
  });
});
