/**
 * Tests for FFmpeg converter wrapper
 * Validates security measures and error handling:
 * - Path traversal prevention
 * - Timeout protection
 * - Error handling with cleanup
 */

import { convertVideoWithFFmpeg, extractPosterFrame } from '../ffmpeg-converter';

jest.mock('child_process');
jest.mock('fs/promises');

import { execFile } from 'child_process';
import * as fsModule from 'fs';

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
const mockFs = fsModule.promises as jest.Mocked<typeof fsModule.promises>;

describe('FFmpeg Converter', () => {
  const basePath = `${process.cwd()}/tmp`;
  const validPath = `${basePath}/uploads/test.webm`;
  const validOutputPath = `${basePath}/outputs/output.webm`;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful mocks
    mockFs.realpath = jest
      .fn()
      .mockResolvedValue(validPath);
    mockFs.access = jest.fn().mockResolvedValue(undefined);
    mockFs.mkdir = jest.fn().mockResolvedValue(undefined);
    mockFs.stat = jest
      .fn()
      .mockResolvedValue({ size: 1024000 } as any);
    mockFs.unlink = jest.fn().mockResolvedValue(undefined);
    mockFs.constants = { R_OK: 4 } as any;
  });

  describe('convertVideoWithFFmpeg', () => {
    it('should convert video successfully', async () => {
      // Mock successful FFmpeg execution
      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => {
          callback(null);
        }, 0);
        return {} as any;
      });

      const result = await convertVideoWithFFmpeg({
        inputPath: validPath,
        outputPath: validOutputPath,
        onProgress: jest.fn(),
      });

      // Output path is constructed from directory + basename
      expect(result.outputPath).toBeDefined();
      expect(typeof result.outputPath).toBe('string');
      expect(result.size).toBe(1024000);
      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-i', '-codec:v', 'libvpx-vp9']),
        expect.any(Function)
      );
    });

    it('should reject paths outside allowed directory', async () => {
      // Mock realpath to return path outside allowed directory
      mockFs.realpath = jest
        .fn()
        .mockResolvedValue('/etc/passwd');

      await expect(
        convertVideoWithFFmpeg({
          inputPath: '../../../etc/passwd',
          outputPath: validOutputPath,
        })
      ).rejects.toThrow('Path outside allowed directory');

      expect(mockFs.realpath).toHaveBeenCalled();
    });

    it('should handle FFmpeg command execution errors', async () => {
      const execError = new Error('ffmpeg: command not found');

      // Mock execFile to return an error
      mockExecFile.mockImplementation((cmd, args, callback) => {
        callback(execError);
        return {} as any;
      });

      await expect(
        convertVideoWithFFmpeg({
          inputPath: validPath,
          outputPath: validOutputPath,
        })
      ).rejects.toThrow('ffmpeg: command not found');

      // Verify cleanup was attempted on error
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should fail gracefully when input file not accessible', async () => {
      // Mock access to throw ENOENT error
      mockFs.access = jest.fn().mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(
        convertVideoWithFFmpeg({
          inputPath: validPath,
          outputPath: validOutputPath,
        })
      ).rejects.toThrow('File not accessible');

      expect(mockFs.access).toHaveBeenCalled();
    });

    it('should cleanup partial output file on FFmpeg error', async () => {
      const ffmpegError = new Error('FFmpeg process failed');

      // Mock execFile to return error
      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => {
          callback(ffmpegError);
        }, 0);
        return {} as any;
      });

      await expect(
        convertVideoWithFFmpeg({
          inputPath: validPath,
          outputPath: validOutputPath,
        })
      ).rejects.toThrow('FFmpeg process failed');

      // Verify cleanup was attempted
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should reject with timeout when ffmpeg callback never fires', async () => {
      // Mock execFile to never call its callback (simulates hung process)
      mockExecFile.mockImplementation(() => ({}) as any);

      const promise = convertVideoWithFFmpeg({
        inputPath: validPath,
        outputPath: validOutputPath,
        timeoutMs: 10,
      });

      await expect(promise).rejects.toThrow('FFmpeg timeout after 10ms');
      // Cleanup should still be attempted on timeout
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should ignore late execFile callback after timeout has fired', async () => {
      // Capture the callback so we can invoke it AFTER the timeout rejects
      let capturedCallback: ((err: Error | null) => void) | null = null;
      mockExecFile.mockImplementation((cmd, args, callback) => {
        capturedCallback = callback as (err: Error | null) => void;
        return {} as any;
      });

      const promise = convertVideoWithFFmpeg({
        inputPath: validPath,
        outputPath: validOutputPath,
        timeoutMs: 5,
      });

      // Expect the timeout rejection
      await expect(promise).rejects.toThrow('FFmpeg timeout after 5ms');

      // Now invoke the late callback — should be a no-op and NOT throw
      // unhandled rejection (covers the `timedOut` early-return branch).
      expect(() => {
        capturedCallback?.(new Error('late ffmpeg error'));
      }).not.toThrow();
    });

    it('should fall back to original output path when output dir realpath fails', async () => {
      // First realpath call validates the input path (success)
      // Second realpath call for output dir fails -> fallback branch
      mockFs.realpath = jest
        .fn()
        .mockResolvedValueOnce(validPath) // for input validation
        .mockRejectedValueOnce(new Error('ENOENT: output dir missing'));

      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => callback(null), 0);
        return {} as any;
      });

      const result = await convertVideoWithFFmpeg({
        inputPath: validPath,
        outputPath: validOutputPath,
      });

      // Output path should fall back to the raw outputPath argument
      expect(result.outputPath).toBe(validOutputPath);
    });

    it('should reject when resolved output path is outside allowed dir', async () => {
      // Input validation succeeds; output dir realpath resolves OUTSIDE allowed dir
      mockFs.realpath = jest
        .fn()
        .mockResolvedValueOnce(validPath) // input validation
        .mockResolvedValueOnce('/var/malicious'); // output dir realpath

      await expect(
        convertVideoWithFFmpeg({
          inputPath: validPath,
          outputPath: validOutputPath,
        })
      ).rejects.toThrow('Output path outside allowed directory');

      // FFmpeg should never have been invoked
      expect(mockExecFile).not.toHaveBeenCalled();
    });

    it('should handle complex path traversal patterns', async () => {
      // Test multiple traversal patterns that might evade simple checks
      const maliciousPaths = [
        '../../../etc/passwd',
        '../../var/lib/shadow',
        '/tmp/../../../etc/hosts',
      ];

      for (const maliciousPath of maliciousPaths) {
        mockFs.realpath = jest
          .fn()
          .mockResolvedValue('/etc/passwd');

        await expect(
          convertVideoWithFFmpeg({
            inputPath: maliciousPath,
            outputPath: validOutputPath,
          })
        ).rejects.toThrow('Path outside allowed directory');
      }
    });

    it('should reject paths with symlink escape attempts', async () => {
      // Symlink within allowed dir pointing outside -> realpath resolves it
      mockFs.realpath = jest
        .fn()
        .mockResolvedValue('/var/tmp/outside'); // symlink resolved to outside

      await expect(
        convertVideoWithFFmpeg({
          inputPath: `${basePath}/symlink-to-etc`,
          outputPath: validOutputPath,
        })
      ).rejects.toThrow('Path outside allowed directory');

      // Verify realpath was called (symlink resolution)
      expect(mockFs.realpath).toHaveBeenCalled();
    });

    it('should continue cleanup even if unlink fails', async () => {
      const ffmpegError = new Error('FFmpeg process failed');

      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => callback(ffmpegError), 0);
        return {} as any;
      });

      // Make unlink fail
      mockFs.unlink = jest.fn().mockRejectedValue(new Error('EACCES: permission denied'));

      // Should still reject with original FFmpeg error, not cleanup error
      await expect(
        convertVideoWithFFmpeg({
          inputPath: validPath,
          outputPath: validOutputPath,
        })
      ).rejects.toThrow('FFmpeg process failed');

      // Verify cleanup was attempted despite failure
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should pass onProgress callback with correct parameters', async () => {
      const onProgressMock = jest.fn();

      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => callback(null), 0);
        return {} as any;
      });

      await convertVideoWithFFmpeg({
        inputPath: validPath,
        outputPath: validOutputPath,
        onProgress: onProgressMock,
      });

      // Verify onProgress was called with 100 on success
      expect(onProgressMock).toHaveBeenCalledWith(100);
    });

    it('should not invoke onProgress if callback is undefined', async () => {
      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => callback(null), 0);
        return {} as any;
      });

      // Should not throw when onProgress is undefined
      const result = await convertVideoWithFFmpeg({
        inputPath: validPath,
        outputPath: validOutputPath,
        onProgress: undefined,
      });

      expect(result.outputPath).toBeDefined();
    });

    it('should verify output file stat and return correct size', async () => {
      const expectedSize = 2048000;

      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => callback(null), 0);
        return {} as any;
      });

      mockFs.stat = jest
        .fn()
        .mockResolvedValue({ size: expectedSize } as any);

      const result = await convertVideoWithFFmpeg({
        inputPath: validPath,
        outputPath: validOutputPath,
      });

      expect(mockFs.stat).toHaveBeenCalled();
      expect(result.size).toBe(expectedSize);
    });

    it('should use custom timeout value when provided', async () => {
      mockExecFile.mockImplementation(() => ({}) as any);

      const customTimeout = 100;
      const promise = convertVideoWithFFmpeg({
        inputPath: validPath,
        outputPath: validOutputPath,
        timeoutMs: customTimeout,
      });

      await expect(promise).rejects.toThrow(`FFmpeg timeout after ${customTimeout}ms`);
    });
  });

  describe('extractPosterFrame', () => {
    it('should extract poster frame successfully', async () => {
      // Mock successful FFmpeg execution
      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => {
          callback(null);
        }, 0);
        return {} as any;
      });

      await extractPosterFrame(
        validPath,
        validOutputPath,
        60000
      );

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockExecFile).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-vframes', '1', '-vf', 'scale=1920:-1']),
        expect.any(Function)
      );
    });

    it('should reject output path outside allowed directory', async () => {
      // Mock realpath for input path validation
      mockFs.realpath = jest.fn().mockResolvedValue(validPath);

      await expect(
        extractPosterFrame(
          validPath,
          '/etc/passwd.jpg', // Path outside allowed directory
          60000
        )
      ).rejects.toThrow('Output path outside allowed directory');
    });

    it('should cleanup partial output file on extraction error', async () => {
      const ffmpegError = new Error('FFmpeg frame extraction failed');

      // Mock execFile to return error
      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => {
          callback(ffmpegError);
        }, 0);
        return {} as any;
      });

      await expect(
        extractPosterFrame(
          validPath,
          validOutputPath
        )
      ).rejects.toThrow('FFmpeg frame extraction failed');

      // Verify cleanup was attempted
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should handle path validation for input in extractPosterFrame', async () => {
      // Mock realpath to reject validation for input path
      mockFs.realpath = jest
        .fn()
        .mockRejectedValue(new Error('ENOENT: no such file'));

      // Mock access to fail
      mockFs.access = jest.fn().mockRejectedValue(new Error('ENOENT'));

      await expect(
        extractPosterFrame(
          validPath,
          validOutputPath,
          60000
        )
      ).rejects.toThrow();
    });

    it('should use timeout parameter in extractPosterFrame', async () => {
      mockExecFile.mockImplementation(() => ({}) as any);

      const customTimeout = 100; // Use short timeout for testing
      const promise = extractPosterFrame(
        validPath,
        validOutputPath,
        customTimeout
      );

      await expect(promise).rejects.toThrow(`FFmpeg timeout after ${customTimeout}ms`);
    }, 10000); // Increase test timeout to 10s

    it('should reject when output path contains path traversal in extractPosterFrame', async () => {
      const maliciousOutput = '/etc/malicious.jpg';

      // Mock realpath for input to succeed
      mockFs.realpath = jest
        .fn()
        .mockResolvedValue(validPath);

      await expect(
        extractPosterFrame(
          validPath,
          maliciousOutput,
          60000
        )
      ).rejects.toThrow('Output path outside allowed directory');

      // FFmpeg should never be invoked
      expect(mockExecFile).not.toHaveBeenCalled();
    });

    it('should pass correct ffmpeg arguments for frame extraction', async () => {
      mockExecFile.mockImplementation((cmd, args, callback) => {
        setTimeout(() => callback(null), 0);
        return {} as any;
      });

      // Mock realpath for input path
      mockFs.realpath = jest
        .fn()
        .mockResolvedValue(validPath);

      await extractPosterFrame(
        validPath,
        validOutputPath,
        60000
      );

      // Verify ffmpeg args include scale filter
      expect(mockExecFile).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-vframes', '1', '-vf', 'scale=1920:-1']),
        expect.any(Function)
      );
    });
  });
});
