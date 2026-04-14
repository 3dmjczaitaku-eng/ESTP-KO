'use client';

import React, { useEffect, useRef, useState } from 'react';
import StatusMessage from './StatusMessage';

interface FileInputProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
  accept: string;
  maxSize?: number;
  multiple?: boolean;
  isLoading?: boolean;
  selectedFileName?: string;
  resetTrigger?: number;
  error?: string | null;
}

export default function FileInput({
  onFileSelect,
  onError,
  accept,
  maxSize = 100 * 1024 * 1024, // 100MB default
  multiple = false,
  isLoading = false,
  selectedFileName,
  resetTrigger,
  error,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [resetTrigger]);

  const handleFileSelect = (file: File) => {
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Select video file"
          disabled={isLoading}
        />

        <div className="space-y-3">
          <p className="text-lg font-medium text-gray-700">
            Drag and drop your video here
          </p>
          <p className="text-sm text-gray-600">or</p>
          <button
            onClick={handleButtonClick}
            disabled={isLoading}
            className="inline-block rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Processing...' : 'Select File'}
          </button>
        </div>
      </div>

      {selectedFileName && (
        <p className="text-sm font-medium text-gray-700">
          Selected: <span className="text-blue-600">{selectedFileName}</span>
        </p>
      )}

      {error && <StatusMessage status="error" message={error} />}
    </div>
  );
}
