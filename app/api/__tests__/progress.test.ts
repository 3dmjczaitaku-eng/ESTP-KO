/**
 * Tests for GET /api/progress/[jobId] endpoint
 * Validates SSE stream delivery, UUID validation, and job status polling
 */

import { jobQueue } from '@/lib/job-queue';

jest.mock('@/lib/job-queue');

// Polyfill ReadableStream for test environment
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class {
    constructor(underlyingSource) {
      this.underlyingSource = underlyingSource;
    }
  } as any;
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

import { GET } from '../progress/[jobId]/route';
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
