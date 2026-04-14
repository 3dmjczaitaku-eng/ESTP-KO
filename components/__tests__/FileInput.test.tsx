import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileInput from '../FileInput';

describe('FileInput', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
  });

  describe('Rendering', () => {
    it('should render file input with label', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      expect(screen.getByLabelText(/select video/i)).toBeInTheDocument();
    });

    it('should render upload button', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have correct accept attribute', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/webm"
        />
      );

      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;
      expect(input.accept).toBe('video/webm');
    });
  });

  describe('File Selection', () => {
    it('should call onFileSelect when file is selected', async () => {
      const user = userEvent.setup();
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      const file = new File(['video content'], 'video.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it('should pass correct file object with metadata', async () => {
      const user = userEvent.setup();
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test.mp4',
          type: 'video/mp4',
          size: expect.any(Number),
        })
      );
    });

    it('should handle single file selection', async () => {
      const user = userEvent.setup();
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
          multiple={false}
        />
      );

      const file1 = new File(['content1'], 'video1.webm', { type: 'video/webm' });
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      await user.upload(input, file1);

      expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
      expect(mockOnFileSelect).toHaveBeenCalledWith(file1);
    });
  });

  describe('File Validation', () => {
    it('should validate accept attribute in HTML', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/webm,video/mp4"
        />
      );

      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;
      expect(input.accept).toBe('video/webm,video/mp4');
    });
  });

  describe('Error Handling', () => {
    it('should display error message in UI when error prop is provided', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
          error="ファイルサイズが大きすぎます"
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('ファイルサイズが大きすぎます');
    });
  });

  describe('UI States', () => {
    it('should show loading state during file processing', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
          isLoading={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Processing...');
    });

    it('should display selected filename', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
          selectedFileName="test.webm"
        />
      );

      expect(screen.getByText('test.webm')).toBeInTheDocument();
    });

    it('should show drag and drop zone', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over event', () => {
      const { container } = render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      // Find the outer drag-drop container (first child with border-dashed)
      const dropZone = container.querySelector('.border-dashed') as HTMLDivElement;
      expect(dropZone).toBeInTheDocument();

      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('border-blue-500');
    });

    it('should accept dropped files', async () => {
      const { container } = render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      const dropZone = container.querySelector('.border-dashed') as HTMLDivElement;
      const file = new File(['content'], 'video.webm', { type: 'video/webm' });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it('should handle drag leave event', () => {
      const { container } = render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      const dropZone = container.querySelector('.border-dashed') as HTMLDivElement;
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(dropZone).not.toHaveClass('border-blue-500');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      const input = screen.getByLabelText(/select video/i);
      expect(input).toHaveAttribute('type', 'file');
    });

    it('should have accessible button', () => {
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName();
    });

    it('should announce errors to screen readers via alert role', () => {
      const errorMsg = 'ファイルが大きすぎます';
      render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
          error={errorMsg}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveTextContent(errorMsg);
    });
  });

  describe('Button Click', () => {
    it('should open file picker on button click', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <FileInput
          onFileSelect={mockOnFileSelect}
          accept="video/*"
        />
      );

      const button = screen.getByRole('button');
      const input = screen.getByLabelText(/select video/i) as HTMLInputElement;

      // Spy on click
      const clickSpy = jest.spyOn(input, 'click');

      await user.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
