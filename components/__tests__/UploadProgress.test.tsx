import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadProgress from '../UploadProgress';

describe('UploadProgress', () => {
  const mockOnCancel = jest.fn();
  const mockOnPause = jest.fn();
  const mockOnResume = jest.fn();

  beforeEach(() => {
    mockOnCancel.mockClear();
    mockOnPause.mockClear();
    mockOnResume.mockClear();
  });

  describe('Progress Display', () => {
    it('should render progress bar', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should update progress value', () => {
      const { rerender } = render(
        <UploadProgress
          progress={25}
          status="uploading"
          bytesSent={250}
          bytesTotal={1000}
        />
      );

      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');

      rerender(
        <UploadProgress
          progress={75}
          status="uploading"
          bytesSent={750}
          bytesTotal={1000}
        />
      );

      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('should display percentage text', () => {
      render(
        <UploadProgress
          progress={42}
          status="uploading"
          bytesSent={420}
          bytesTotal={1000}
        />
      );

      expect(screen.getByText('42%')).toBeInTheDocument();
    });

    it('should have correct aria attributes', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Upload'));
    });
  });

  describe('Status Display', () => {
    it('should display pending status', () => {
      render(
        <UploadProgress
          progress={0}
          status="pending"
          bytesSent={0}
          bytesTotal={1000}
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display uploading status', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      expect(screen.getByText('Uploading')).toBeInTheDocument();
    });

    it('should display completed status', () => {
      render(
        <UploadProgress
          progress={100}
          status="completed"
          bytesSent={1000}
          bytesTotal={1000}
        />
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should display failed status', () => {
      render(
        <UploadProgress
          progress={50}
          status="failed"
          bytesSent={500}
          bytesTotal={1000}
          errorMessage="Network timeout"
        />
      );

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('should apply correct color class for status', () => {
      const { rerender } = render(
        <UploadProgress
          progress={0}
          status="pending"
          bytesSent={0}
          bytesTotal={1000}
        />
      );

      let statusElement = screen.getByText('Pending');
      expect(statusElement).toHaveClass('text-gray-600');

      rerender(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      statusElement = screen.getByText('Uploading');
      expect(statusElement).toHaveClass('text-blue-600');
    });
  });

  describe('Bytes Display', () => {
    it('should display bytes sent and total', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      expect(screen.getByText(/500 bytes/)).toBeInTheDocument();
      expect(screen.getByText(/1000 bytes/)).toBeInTheDocument();
    });

    it('should format large byte values with units', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={5242880}
          bytesTotal={10485760}
        />
      );

      expect(screen.getByText(/5 MB/)).toBeInTheDocument();
      expect(screen.getByText(/10 MB/)).toBeInTheDocument();
    });

    it('should handle KB formatting', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={51200}
          bytesTotal={102400}
        />
      );

      expect(screen.getByText(/50 KB/)).toBeInTheDocument();
      expect(screen.getByText(/100 KB/)).toBeInTheDocument();
    });
  });

  describe('ETA Display', () => {
    it('should display ETA when uploading', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
          etaSeconds={30}
        />
      );

      expect(screen.getByText(/ETA:.*30 seconds/i)).toBeInTheDocument();
    });

    it('should not display ETA when not uploading', () => {
      render(
        <UploadProgress
          progress={0}
          status="pending"
          bytesSent={0}
          bytesTotal={1000}
          etaSeconds={60}
        />
      );

      expect(screen.queryByText(/ETA:/i)).not.toBeInTheDocument();
    });

    it('should format ETA in minutes when >= 60 seconds', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
          etaSeconds={90}
        />
      );

      expect(screen.getByText(/ETA:.*2 minutes/i)).toBeInTheDocument();
    });

    it('should format ETA correctly for singular minute', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
          etaSeconds={60}
        />
      );

      expect(screen.getByText(/ETA:.*1 minute/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when failed', () => {
      render(
        <UploadProgress
          progress={50}
          status="failed"
          bytesSent={500}
          bytesTotal={1000}
          errorMessage="Connection lost"
        />
      );

      expect(screen.getByText('Connection lost')).toBeInTheDocument();
    });

    it('should not display error message when not failed', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
          errorMessage="This should not appear"
        />
      );

      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });

    it('should have alert role for error message', () => {
      render(
        <UploadProgress
          progress={50}
          status="failed"
          bytesSent={500}
          bytesTotal={1000}
          errorMessage="Upload failed"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Upload failed');
    });
  });

  describe('Action Buttons', () => {
    it('should render cancel button when onCancel provided', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel not provided', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable cancel button when completed', () => {
      render(
        <UploadProgress
          progress={100}
          status="completed"
          bytesSent={1000}
          bytesTotal={1000}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should disable cancel button when failed', () => {
      render(
        <UploadProgress
          progress={50}
          status="failed"
          bytesSent={500}
          bytesTotal={1000}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should render pause button when onPause provided and uploading', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
          onPause={mockOnPause}
        />
      );

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should not render pause button when not uploading', () => {
      render(
        <UploadProgress
          progress={0}
          status="pending"
          bytesSent={0}
          bytesTotal={1000}
          onPause={mockOnPause}
        />
      );

      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument();
    });

    it('should call onPause when pause button clicked', async () => {
      const user = userEvent.setup();
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
          onPause={mockOnPause}
        />
      );

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);

      expect(mockOnPause).toHaveBeenCalledTimes(1);
    });

    it('should render resume button when onResume provided and paused', () => {
      render(
        <UploadProgress
          progress={50}
          status="paused"
          bytesSent={500}
          bytesTotal={1000}
          onResume={mockOnResume}
        />
      );

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should call onResume when resume button clicked', async () => {
      const user = userEvent.setup();
      render(
        <UploadProgress
          progress={50}
          status="paused"
          bytesSent={500}
          bytesTotal={1000}
          onResume={mockOnResume}
        />
      );

      const resumeButton = screen.getByRole('button', { name: /resume/i });
      await user.click(resumeButton);

      expect(mockOnResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Bar Styling', () => {
    it('should update progress fill width', () => {
      const { rerender } = render(
        <UploadProgress
          progress={25}
          status="uploading"
          bytesSent={250}
          bytesTotal={1000}
        />
      );

      let filled = screen.getByTestId('upload-progress-fill');
      expect(filled).toHaveStyle({ width: '25%' });

      rerender(
        <UploadProgress
          progress={75}
          status="uploading"
          bytesSent={750}
          bytesTotal={1000}
        />
      );

      filled = screen.getByTestId('upload-progress-fill');
      expect(filled).toHaveStyle({ width: '75%' });
    });

    it('should have correct color class on filled bar', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      const filled = screen.getByTestId('upload-progress-fill');
      expect(filled).toHaveClass('bg-blue-600');
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive aria-label on progress bar', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('Upload'));
    });

    it('should have correct aria attribute values', () => {
      render(
        <UploadProgress
          progress={45}
          status="uploading"
          bytesSent={450}
          bytesTotal={1000}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have data-status attribute for testing', () => {
      render(
        <UploadProgress
          progress={50}
          status="uploading"
          bytesSent={500}
          bytesTotal={1000}
        />
      );

      const statusElement = screen.getByText('Uploading');
      expect(statusElement).toHaveAttribute('data-status', 'uploading');
    });
  });
});
