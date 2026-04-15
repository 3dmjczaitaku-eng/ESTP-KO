/**
 * Tests for conversion-service — the async FFmpeg orchestration layer.
 * Covers normal flow, error propagation, temp-file cleanup, and AbortSignal.
 */

import {
  runConversion,
  startConversionAsync,
  safeUnlink,
} from '../conversion-service';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../ffmpeg-converter', () => ({
  convertVideoWithFFmpeg: jest.fn(),
}));

jest.mock('../job-queue', () => ({
  jobQueue: {
    updateJob: jest.fn(),
  },
}));

import fs from 'fs/promises';
import { convertVideoWithFFmpeg } from '../ffmpeg-converter';
import { jobQueue } from '../job-queue';

const mockFsUnlink = fs.unlink as jest.MockedFunction<typeof fs.unlink>;
const mockFsMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
const mockConvert = convertVideoWithFFmpeg as jest.MockedFunction<
  typeof convertVideoWithFFmpeg
>;
const mockUpdateJob = jobQueue.updateJob as jest.MockedFunction<
  typeof jobQueue.updateJob
>;

describe('conversion-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFsMkdir.mockResolvedValue(undefined as unknown as string);
    mockFsUnlink.mockResolvedValue(undefined);
  });

  describe('safeUnlink', () => {
    it('swallows unlink errors (file already gone)', async () => {
      mockFsUnlink.mockRejectedValueOnce(new Error('ENOENT'));
      await expect(safeUnlink('/tmp/missing.webm')).resolves.toBeUndefined();
    });

    it('deletes the file when present', async () => {
      await safeUnlink('/tmp/real.webm');
      expect(mockFsUnlink).toHaveBeenCalledWith('/tmp/real.webm');
    });
  });

  describe('runConversion — normal flow', () => {
    it('transitions Converting -> Uploading -> Completed', async () => {
      mockConvert.mockImplementation(async ({ onProgress }) => {
        onProgress?.(50);
        return {
          outputPath: '/tmp/outputs/job-1.webm',
          duration: 10,
          size: 1024,
        };
      });

      await runConversion({
        jobId: 'job-1',
        inputPath: '/tmp/uploads/job-1.webm',
        outputDir: '/tmp/outputs',
      });

      const phases = mockUpdateJob.mock.calls.map(([, updates]) => updates.phase);
      expect(phases).toContain('Converting');
      expect(phases).toContain('Uploading');
      expect(phases).toContain('Completed');

      // Final call should mark complete at 100
      const last = mockUpdateJob.mock.calls[mockUpdateJob.mock.calls.length - 1];
      expect(last[1]).toMatchObject({ phase: 'Completed', progress: 100 });
    });

    it('caps progress at 99 during Converting phase', async () => {
      mockConvert.mockImplementation(async ({ onProgress }) => {
        onProgress?.(150); // absurdly high to confirm cap
        return {
          outputPath: '/tmp/outputs/job-2.webm',
          duration: 10,
          size: 1024,
        };
      });

      await runConversion({
        jobId: 'job-2',
        inputPath: '/tmp/uploads/job-2.webm',
        outputDir: '/tmp/outputs',
      });

      const convertingCalls = mockUpdateJob.mock.calls.filter(
        ([, u]) => u.phase === 'Converting' && typeof u.progress === 'number'
      );
      // Every Converting progress update should be <= 99
      for (const [, u] of convertingCalls) {
        expect(u.progress).toBeLessThanOrEqual(99);
      }
    });

    it('cleans up the input file on success', async () => {
      mockConvert.mockResolvedValue({
        outputPath: '/tmp/outputs/job-3.webm',
        duration: 10,
        size: 1024,
      });

      await runConversion({
        jobId: 'job-3',
        inputPath: '/tmp/uploads/job-3.webm',
        outputDir: '/tmp/outputs',
      });

      expect(mockFsUnlink).toHaveBeenCalledWith('/tmp/uploads/job-3.webm');
    });
  });

  describe('runConversion — error flow', () => {
    it('propagates FFmpeg errors and still cleans up input', async () => {
      mockConvert.mockRejectedValueOnce(new Error('FFmpeg crashed'));

      await expect(
        runConversion({
          jobId: 'job-err',
          inputPath: '/tmp/uploads/job-err.webm',
          outputDir: '/tmp/outputs',
        })
      ).rejects.toThrow('FFmpeg crashed');

      expect(mockFsUnlink).toHaveBeenCalledWith('/tmp/uploads/job-err.webm');
    });

    it('cleans up even when mkdir fails', async () => {
      mockFsMkdir.mockRejectedValueOnce(new Error('EACCES'));

      await expect(
        runConversion({
          jobId: 'job-mk',
          inputPath: '/tmp/uploads/job-mk.webm',
          outputDir: '/tmp/outputs',
        })
      ).rejects.toThrow('EACCES');

      expect(mockFsUnlink).toHaveBeenCalledWith('/tmp/uploads/job-mk.webm');
    });
  });

  describe('runConversion — AbortSignal', () => {
    it('rejects before FFmpeg when already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        runConversion({
          jobId: 'job-abort',
          inputPath: '/tmp/uploads/job-abort.webm',
          outputDir: '/tmp/outputs',
          abortSignal: controller.signal,
        })
      ).rejects.toThrow('Conversion aborted before start');

      expect(mockConvert).not.toHaveBeenCalled();
      expect(mockFsUnlink).toHaveBeenCalledWith('/tmp/uploads/job-abort.webm');
    });

    it('rejects between FFmpeg and Completed when aborted mid-flight', async () => {
      const controller = new AbortController();
      // Abort just after FFmpeg finishes
      mockConvert.mockImplementation(async () => {
        controller.abort();
        return {
          outputPath: '/tmp/outputs/job-mid.webm',
          duration: 10,
          size: 1024,
        };
      });

      await expect(
        runConversion({
          jobId: 'job-mid',
          inputPath: '/tmp/uploads/job-mid.webm',
          outputDir: '/tmp/outputs',
          abortSignal: controller.signal,
        })
      ).rejects.toThrow('Conversion aborted after FFmpeg step');

      // Input still cleaned up via finally
      expect(mockFsUnlink).toHaveBeenCalledWith('/tmp/uploads/job-mid.webm');
      // Completed phase should never have been written
      const completedCalls = mockUpdateJob.mock.calls.filter(
        ([, u]) => u.phase === 'Completed' && u.progress === 100
      );
      expect(completedCalls).toHaveLength(0);
    });
  });

  describe('startConversionAsync — fire-and-forget wrapper', () => {
    it('never rejects; reflects FFmpeg errors into job state', async () => {
      mockConvert.mockRejectedValueOnce(new Error('FFmpeg boom'));

      // Should resolve (not reject) even though underlying runConversion throws
      await expect(
        startConversionAsync({
          jobId: 'job-faf',
          inputPath: '/tmp/uploads/job-faf.webm',
          outputDir: '/tmp/outputs',
        })
      ).resolves.toBeUndefined();

      const errorUpdates = mockUpdateJob.mock.calls.filter(
        ([, u]) => u.error
      );
      expect(errorUpdates.length).toBeGreaterThan(0);
      expect(errorUpdates[errorUpdates.length - 1][1]).toMatchObject({
        phase: 'Completed',
        error: expect.stringContaining('FFmpeg boom'),
      });
    });

    it('uses fallback message when non-Error is thrown', async () => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      mockConvert.mockImplementationOnce(() => {
        throw 'raw string failure';
      });

      await expect(
        startConversionAsync({
          jobId: 'job-nonerr',
          inputPath: '/tmp/uploads/job-nonerr.webm',
          outputDir: '/tmp/outputs',
        })
      ).resolves.toBeUndefined();

      const errorUpdates = mockUpdateJob.mock.calls.filter(
        ([, u]) => u.error
      );
      expect(errorUpdates[errorUpdates.length - 1][1].error).toBe(
        'Conversion failed'
      );
    });

    it('resolves normally on success', async () => {
      mockConvert.mockResolvedValueOnce({
        outputPath: '/tmp/outputs/job-ok.webm',
        duration: 10,
        size: 1024,
      });

      await expect(
        startConversionAsync({
          jobId: 'job-ok',
          inputPath: '/tmp/uploads/job-ok.webm',
          outputDir: '/tmp/outputs',
        })
      ).resolves.toBeUndefined();

      // No error updates should be recorded
      const errorUpdates = mockUpdateJob.mock.calls.filter(
        ([, u]) => u.error
      );
      expect(errorUpdates).toHaveLength(0);
    });
  });
});
