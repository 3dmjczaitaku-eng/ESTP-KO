/**
 * Tests for POST /api/upload endpoint
 * Validates file reception, type checking, and job registration
 */

import { jobQueue } from '@/lib/job-queue';

jest.mock('@/lib/job-queue');
jest.mock('@/lib/ffmpeg-converter');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random()),
}));
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

// Mock File class to add arrayBuffer method
const OriginalFile = global.File;
if (typeof global.File !== 'undefined') {
  global.File = class extends OriginalFile {
    async arrayBuffer() {
      return new ArrayBuffer(0);
    }
  };
}
jest.mock('next/server', () => {
  const mockNextRequest = jest.fn((url, init) => {
    // Store FormData for formData() method to return
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

  return {
    NextRequest: mockNextRequest,
    NextResponse: {
      json: (data, init) => ({
        status: init?.status || 200,
        headers: new Map(Object.entries(init?.headers || {})),
        json: jest.fn(async () => data),
        ok: (init?.status || 200) < 400,
      }),
    },
  };
});

import { POST } from '../upload/route';
import { NextRequest } from 'next/server';

const mockJobQueue = jobQueue as jest.Mocked<typeof jobQueue>;

describe('POST /api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockJobQueue.addJob = jest.fn();
  });

  it('should return 400 when file is missing', async () => {
    const formData = new FormData();
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('File is required');
  });

  it('should return 400 for unsupported file type', async () => {
    const formData = new FormData();
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toContain('Unsupported file type');
  });

  it('should return 413 for oversized file', async () => {
    const formData = new FormData();
    // Create a large enough file (>500MB simulation)
    const largeSize = 501 * 1024 * 1024;
    const file = new File([new Uint8Array(1024)], 'large.webm', { type: 'video/webm' });
    Object.defineProperty(file, 'size', { value: largeSize });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(413);

    const json = await response.json();
    expect(json.error).toContain('exceeds');
  });

  it('should return 202 with jobId for valid video file', async () => {
    const formData = new FormData();
    const file = new File(['test video'], 'test.webm', { type: 'video/webm' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(202);

    const json = await response.json();
    expect(json).toHaveProperty('jobId');
    expect(typeof json.jobId).toBe('string');
    expect(json.jobId.length).toBeGreaterThan(0);
  });

  it('should register job in queue for valid upload', async () => {
    mockJobQueue.addJob = jest.fn().mockResolvedValue(undefined);

    const formData = new FormData();
    const file = new File(['test video'], 'test.mp4', { type: 'video/mp4' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(mockJobQueue.addJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: json.jobId,
        phase: expect.any(String),
      })
    );
  });

  it('should accept both webm and mp4 formats', async () => {
    const formDataWebm = new FormData();
    formDataWebm.append('file', new File(['test'], 'test.webm', { type: 'video/webm' }));

    const requestWebm = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formDataWebm,
    });

    const responseWebm = await POST(requestWebm);
    expect(responseWebm.status).toBe(202);

    const formDataMp4 = new FormData();
    formDataMp4.append('file', new File(['test'], 'test.mp4', { type: 'video/mp4' }));

    const requestMp4 = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formDataMp4,
    });

    const responseMp4 = await POST(requestMp4);
    expect(responseMp4.status).toBe(202);
  });
});
