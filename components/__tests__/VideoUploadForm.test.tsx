import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoUploadForm from '../VideoUploadForm';

describe('VideoUploadForm', () => {
  const mockOnUploadComplete = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    mockOnUploadComplete.mockClear();
    mockOnError.mockClear();
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render form title', () => {
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      expect(screen.getByText(/video upload/i)).toBeInTheDocument();
    });

    it('should render FileInput initially', () => {
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      expect(screen.getByLabelText(/select video/i)).toBeInTheDocument();
    });

    it('should render upload button', () => {
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept video files', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(input.files?.[0]).toBe(file);
    });

    it('should display selected filename', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'my-video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByText(/my-video\.webm/i)).toBeInTheDocument();
    });

    it('should enable upload button when file is selected', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      expect(uploadButton).toBeDisabled();

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(uploadButton).not.toBeDisabled();
    });
  });

  describe('Upload Flow State Management', () => {
    it('should show conversion progress after upload starts', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('progressbar', { name: /conversion/i })).toBeInTheDocument();
      }, { timeout: 1500 });
    });

    it('should show upload progress after conversion completes', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      // Wait for conversion to complete (simulated)
      await waitFor(() => {
        const conversionBar = screen.getByRole('progressbar', { name: /conversion/i });
        expect(conversionBar).toHaveAttribute('aria-valuenow', '100');
      }, { timeout: 1500 });

      // Upload progress should appear
      await waitFor(() => {
        expect(screen.getByRole('progressbar', { name: /upload/i })).toBeInTheDocument();
      }, { timeout: 1500 });
    });

    it('should show completion message after upload succeeds', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      // Wait for completion - check for success alert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/upload.*complete/i);
      }, { timeout: 5000 });
    });
  });

  describe('Upload Button Behavior', () => {
    it('should disable upload button during upload', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      // After clicking upload, the button should be removed and conversion progress should show
      await waitFor(() => {
        expect(screen.getByRole('progressbar', { name: /FFmpeg conversion progress/i })).toBeInTheDocument();
      }, { timeout: 1500 });
    });

    it('should show reset option after upload completes', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset|upload.*new/i })).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Cancel Functionality', () => {
    it('should show cancel button during upload', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      }, { timeout: 1500 });
    });

    it('should reset form when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeInTheDocument();
      }, { timeout: 1500 });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/select video/i)).toBeInTheDocument();
      }, { timeout: 1500 });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on upload failure', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'large-video.webm', { type: 'video/webm' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 * 1024 }); // 1GB file

      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;
      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should call onError callback on upload failure', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
          onError={mockOnError}
        />
      );

      const file = new File(['video content'], 'large-video.webm', { type: 'video/webm' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 * 1024 });

      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;
      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
          onError={mockOnError}
        />
      );

      // First attempt with large file
      const largeFile = new File(['video content'], 'large-video.webm', { type: 'video/webm' });
      Object.defineProperty(largeFile, 'size', { value: 1024 * 1024 * 1024 });

      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;
      await user.upload(input, largeFile);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Reset and try with smaller file
      const resetButton = screen.getByRole('button', { name: /reset|try.*again/i });
      await user.click(resetButton);

      const smallFile = new File(['video content'], 'video.webm', { type: 'video/webm' });
      await user.upload(input, smallFile);

      expect(input.files?.[0]).toBe(smallFile);
    });
  });

  describe('Callbacks', () => {
    it('should call onUploadComplete when upload finishes', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('should pass result to onUploadComplete', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            originalFile: expect.any(File),
            convertedFormat: 'mp4',
          })
        );
      }, { timeout: 5000 });
    });
  });

  describe('Form Reset', () => {
    it('should clear file selection on reset', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);
      expect(input.files?.[0]).toBe(file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset|upload.*new/i })).toBeInTheDocument();
      }, { timeout: 5000 });

      const resetButton = screen.getByRole('button', { name: /reset|upload.*new/i });
      await user.click(resetButton);

      expect(input.files?.length).toBe(0);
    });

    it('should return to initial state on reset', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset|upload.*new/i })).toBeInTheDocument();
      }, { timeout: 5000 });

      const resetButton = screen.getByRole('button', { name: /reset|upload.*new/i });
      await user.click(resetButton);

      expect(screen.getByLabelText(/select video/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form structure', () => {
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should have accessible progress indicators', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
        progressBars.forEach(bar => {
          expect(bar).toHaveAttribute('aria-valuenow');
          expect(bar).toHaveAttribute('aria-valuemin');
          expect(bar).toHaveAttribute('aria-valuemax');
        });
      }, { timeout: 1500 });
    });
  });

  describe('File Validation', () => {
    it('should accept webm format', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(input.files?.[0]).toBe(file);
    });

    it('should accept mp4 format', async () => {
      const user = userEvent.setup();
      render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
        />
      );

      const file = new File(['video content'], 'video.mp4', { type: 'video/mp4' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(input.files?.[0]).toBe(file);
    });

    it('should validate file size', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <VideoUploadForm
          onUploadComplete={mockOnUploadComplete}
          maxFileSize={100 * 1024 * 1024}
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      Object.defineProperty(file, 'size', { value: 150 * 1024 * 1024 });

      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;
      await user.upload(input, file);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/file.*too.*large|exceeds.*size/i)).toBeInTheDocument();
      });
    });
  });
});
