import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusMessage from '../StatusMessage';

describe('StatusMessage', () => {
  describe('Success Status', () => {
    it('should render success message with success icon', () => {
      const { container } = render(
        <StatusMessage
          status="success"
          message="File uploaded successfully"
        />
      );

      expect(screen.getByText('File uploaded successfully')).toBeInTheDocument();
      expect(container.querySelector('[data-icon="success"]')).toBeInTheDocument();
    });

    it('should apply success styling classes', () => {
      const { container } = render(
        <StatusMessage
          status="success"
          message="Success message"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('text-green-600');
      expect(wrapper).toHaveClass('bg-green-50');
    });
  });

  describe('Error Status', () => {
    it('should render error message with error icon', () => {
      const { container } = render(
        <StatusMessage
          status="error"
          message="Conversion failed"
        />
      );

      expect(screen.getByText('Conversion failed')).toBeInTheDocument();
      expect(container.querySelector('[data-icon="error"]')).toBeInTheDocument();
    });

    it('should apply error styling classes', () => {
      const { container } = render(
        <StatusMessage
          status="error"
          message="Error message"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('text-red-600');
      expect(wrapper).toHaveClass('bg-red-50');
    });
  });

  describe('Info Status', () => {
    it('should render info message with info icon', () => {
      const { container } = render(
        <StatusMessage
          status="info"
          message="Processing video"
        />
      );

      expect(screen.getByText('Processing video')).toBeInTheDocument();
      expect(container.querySelector('[data-icon="info"]')).toBeInTheDocument();
    });

    it('should apply info styling classes', () => {
      const { container } = render(
        <StatusMessage
          status="info"
          message="Info message"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('text-blue-600');
      expect(wrapper).toHaveClass('bg-blue-50');
    });
  });

  describe('Warning Status', () => {
    it('should render warning message with warning icon', () => {
      const { container } = render(
        <StatusMessage
          status="warning"
          message="Large file size"
        />
      );

      expect(screen.getByText('Large file size')).toBeInTheDocument();
      expect(container.querySelector('[data-icon="warning"]')).toBeInTheDocument();
    });

    it('should apply warning styling classes', () => {
      const { container } = render(
        <StatusMessage
          status="warning"
          message="Warning message"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('text-yellow-600');
      expect(wrapper).toHaveClass('bg-yellow-50');
    });
  });

  describe('Optional Details', () => {
    it('should render details when provided', () => {
      render(
        <StatusMessage
          status="error"
          message="Upload failed"
          details="Network timeout after 30s"
        />
      );

      expect(screen.getByText('Upload failed')).toBeInTheDocument();
      expect(screen.getByText('Network timeout after 30s')).toBeInTheDocument();
    });

    it('should not render details when not provided', () => {
      const { container } = render(
        <StatusMessage
          status="success"
          message="Upload complete"
        />
      );

      expect(container.textContent).not.toContain('undefined');
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render when status is null', () => {
      const { container } = render(
        <StatusMessage
          status={null}
          message="This should not appear"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when status is undefined', () => {
      const { container } = render(
        <StatusMessage
          status={undefined}
          message="This should not appear"
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA role', () => {
      render(
        <StatusMessage
          status="error"
          message="Error occurred"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should announce status changes to screen readers', () => {
      const { rerender } = render(
        <StatusMessage
          status="info"
          message="Loading..."
        />
      );

      rerender(
        <StatusMessage
          status="success"
          message="Complete!"
        />
      );

      expect(screen.getByText('Complete!')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(500);
      render(
        <StatusMessage
          status="success"
          message={longMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle empty message string', () => {
      render(
        <StatusMessage
          status="success"
          message=""
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Error: <script>alert("xss")</script>';
      render(
        <StatusMessage
          status="error"
          message={specialMessage}
        />
      );

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
      expect(screen.queryByText('alert')).not.toBeInTheDocument();
    });
  });
});
