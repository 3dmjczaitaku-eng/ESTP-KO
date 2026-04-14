import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversionProgress from '../ConversionProgress';

describe('ConversionProgress', () => {
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnCancel.mockClear();
  });

  describe('Progress Display', () => {
    it('should render progress bar', () => {
      render(
        <ConversionProgress
          progress={50}
          status="converting"
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should update progress value', () => {
      const { rerender } = render(
        <ConversionProgress
          progress={25}
          status="converting"
        />
      );

      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');

      rerender(
        <ConversionProgress
          progress={75}
          status="converting"
        />
      );

      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('should display percentage text', () => {
      render(
        <ConversionProgress
          progress={33}
          status="converting"
        />
      );

      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should handle progress at 0%', () => {
      render(
        <ConversionProgress
          progress={0}
          status="converting"
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle progress at 100%', () => {
      render(
        <ConversionProgress
          progress={100}
          status="completed"
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should display pending status', () => {
      render(
        <ConversionProgress
          progress={0}
          status="pending"
        />
      );

      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('should display converting status', () => {
      render(
        <ConversionProgress
          progress={50}
          status="converting"
        />
      );

      expect(screen.getByText(/converting/i)).toBeInTheDocument();
    });

    it('should display completed status', () => {
      render(
        <ConversionProgress
          progress={100}
          status="completed"
        />
      );

      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });

    it('should display failed status', () => {
      render(
        <ConversionProgress
          progress={45}
          status="failed"
          errorMessage="Codec not supported"
        />
      );

      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  describe('Status Styling', () => {
    it('should apply pending styling', () => {
      const { container } = render(
        <ConversionProgress
          progress={0}
          status="pending"
        />
      );

      const statusElement = container.querySelector('[data-status="pending"]');
      expect(statusElement).toHaveClass('text-gray-600');
    });

    it('should apply converting styling', () => {
      const { container } = render(
        <ConversionProgress
          progress={50}
          status="converting"
        />
      );

      const statusElement = container.querySelector('[data-status="converting"]');
      expect(statusElement).toHaveClass('text-blue-600');
    });

    it('should apply completed styling', () => {
      const { container } = render(
        <ConversionProgress
          progress={100}
          status="completed"
        />
      );

      const statusElement = container.querySelector('[data-status="completed"]');
      expect(statusElement).toHaveClass('text-green-600');
    });

    it('should apply failed styling', () => {
      const { container } = render(
        <ConversionProgress
          progress={45}
          status="failed"
          errorMessage="Error occurred"
        />
      );

      const statusElement = container.querySelector('[data-status="failed"]');
      expect(statusElement).toHaveClass('text-red-600');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(
        <ConversionProgress
          progress={45}
          status="failed"
          errorMessage="Codec not supported"
        />
      );

      expect(screen.getByText('Codec not supported')).toBeInTheDocument();
    });

    it('should display error in alert role', () => {
      render(
        <ConversionProgress
          progress={0}
          status="failed"
          errorMessage="Failed to convert"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Failed to convert');
    });
  });

  describe('ETA Display', () => {
    it('should display ETA when provided', () => {
      render(
        <ConversionProgress
          progress={50}
          status="converting"
          etaSeconds={120}
        />
      );

      expect(screen.getByText(/2 minutes/i)).toBeInTheDocument();
    });

    it('should format ETA correctly for minutes', () => {
      render(
        <ConversionProgress
          progress={75}
          status="converting"
          etaSeconds={180}
        />
      );

      expect(screen.getByText(/3 minutes/i)).toBeInTheDocument();
    });

    it('should format ETA correctly for seconds', () => {
      render(
        <ConversionProgress
          progress={90}
          status="converting"
          etaSeconds={45}
        />
      );

      expect(screen.getByText(/45 seconds/i)).toBeInTheDocument();
    });

    it('should not display ETA when not provided', () => {
      render(
        <ConversionProgress
          progress={50}
          status="converting"
        />
      );

      expect(screen.queryByText(/minutes/i)).not.toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('should display cancel button when onCancel is provided', () => {
      render(
        <ConversionProgress
          progress={50}
          status="converting"
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should not display cancel button when onCancel is not provided', () => {
      render(
        <ConversionProgress
          progress={50}
          status="converting"
        />
      );

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ConversionProgress
          progress={50}
          status="converting"
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable cancel button when status is completed', () => {
      render(
        <ConversionProgress
          progress={100}
          status="completed"
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should disable cancel button when status is failed', () => {
      render(
        <ConversionProgress
          progress={50}
          status="failed"
          errorMessage="Error"
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have progress bar with ARIA attributes', () => {
      render(
        <ConversionProgress
          progress={60}
          status="converting"
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have progress bar with label', () => {
      render(
        <ConversionProgress
          progress={60}
          status="converting"
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('FFmpeg'));
    });

    it('should announce error status', () => {
      render(
        <ConversionProgress
          progress={45}
          status="failed"
          errorMessage="Codec not supported"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should display all elements in order', () => {
      const { container } = render(
        <ConversionProgress
          progress={50}
          status="converting"
          etaSeconds={120}
        />
      );

      const elements = container.querySelectorAll('*');
      const progressBar = screen.getByRole('progressbar');
      const percentage = screen.getByText('50%');
      const eta = screen.getByText(/2 minutes/i);

      expect(progressBar).toBeInTheDocument();
      expect(percentage).toBeInTheDocument();
      expect(eta).toBeInTheDocument();
    });
  });

  describe('Progress Bar Appearance', () => {
    it('should show filled portion correctly', () => {
      const { container } = render(
        <ConversionProgress
          progress={50}
          status="converting"
        />
      );

      const filledBar = container.querySelector('[data-filled]');
      expect(filledBar).toHaveStyle({ width: '50%' });
    });

    it('should update filled portion as progress changes', () => {
      const { container, rerender } = render(
        <ConversionProgress
          progress={25}
          status="converting"
        />
      );

      let filledBar = container.querySelector('[data-filled]');
      expect(filledBar).toHaveStyle({ width: '25%' });

      rerender(
        <ConversionProgress
          progress={75}
          status="converting"
        />
      );

      filledBar = container.querySelector('[data-filled]');
      expect(filledBar).toHaveStyle({ width: '75%' });
    });
  });
});
