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
  });
});
