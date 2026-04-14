'use client';

import React, { useEffect, useRef, useState } from 'react';
import FileInput from './FileInput';
import ConversionProgress from './ConversionProgress';
import UploadProgress from './UploadProgress';
import StatusMessage from './StatusMessage';

type FormStatus = 'idle' | 'converting' | 'uploading' | 'completed' | 'failed';

interface VideoUploadFormProps {
  onUploadComplete: (result: { originalFile: File; convertedFormat: string }) => void;
  onError?: (error: string) => void;
  maxFileSize?: number;
}

interface ProgressEvent {
  jobId: string;
  phase: 'Converting' | 'Uploading' | 'Completed';
  progress: number;
  timestamp: number;
  error?: string;
}

export default function VideoUploadForm({
  onUploadComplete,
  onError,
  maxFileSize = 500 * 1024 * 1024, // 500MB default
}: VideoUploadFormProps): React.ReactElement {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBytes, setUploadBytes] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
    setStatus('failed');
    onError?.(error);
  };

  const validateFile = (file: File): boolean => {
    if (maxFileSize && file.size > maxFileSize) {
      const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(2);
      const error = `File exceeds ${sizeMB}MB size limit`;
      handleError(error);
      return false;
    }
    return true;
  };

  const startConversion = async () => {
    if (!selectedFile) {
      return;
    }

    if (!validateFile(selectedFile)) {
      return;
    }

    setStatus('converting');
    setConversionProgress(0);
    setUploadProgress(0);
    setUploadBytes(0);
    setErrorMessage(null);

    try {
      // 1. Upload file to server
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { jobId } = await uploadResponse.json();

      // 2. Connect to SSE endpoint for progress updates
      const eventSource = new EventSource(`/api/progress/${jobId}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const progressEvent: ProgressEvent = JSON.parse(event.data);

          if (progressEvent.error) {
            handleError(progressEvent.error);
            eventSource.close();
            return;
          }

          if (progressEvent.phase === 'Converting') {
            setStatus('converting');
            setConversionProgress(progressEvent.progress);
          } else if (progressEvent.phase === 'Uploading') {
            setStatus('uploading');
            setUploadProgress(progressEvent.progress);
            if (selectedFile) {
              setUploadBytes((progressEvent.progress / 100) * selectedFile.size);
            }
          } else if (progressEvent.phase === 'Completed') {
            setStatus('completed');
            setConversionProgress(100);
            setUploadProgress(100);
            if (selectedFile) {
              setUploadBytes(selectedFile.size);
              onUploadComplete({
                originalFile: selectedFile,
                convertedFormat: 'webm',
              });
            }
            eventSource.close();
          }
        } catch (error) {
          console.error('Error parsing progress event:', error);
        }
      };

      eventSource.onerror = () => {
        handleError('Connection lost during conversion');
        eventSource.close();
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      handleError(errorMessage);
    }
  };

  // Cleanup EventSource on unmount or when conversion ends
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    resetForm();
  };

  const resetForm = () => {
    setStatus('idle');
    setSelectedFile(null);
    setConversionProgress(0);
    setUploadProgress(0);
    setUploadBytes(0);
    setErrorMessage(null);
    setResetTrigger((prev) => prev + 1);
  };

  const handleReset = () => {
    resetForm();
  };

  const handleUploadClick = () => {
    startConversion();
  };

  return (
    <form role="form" className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Video Upload</h2>

      <FileInput
        onFileSelect={handleFileSelect}
        onError={handleError}
        accept="video/webm,video/mp4"
        maxSize={maxFileSize}
        selectedFileName={status === 'idle' ? selectedFile?.name : undefined}
        resetTrigger={resetTrigger}
        error={status === 'idle' && errorMessage ? errorMessage : null}
      />

      {status === 'idle' && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={!selectedFile}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Upload
          </button>
        </div>
      )}

      {status === 'converting' && (
        <>
          <ConversionProgress
            progress={Math.round(conversionProgress)}
            status="converting"
            onCancel={handleCancel}
          />
        </>
      )}

      {status === 'uploading' && (
        <>
          <UploadProgress
            progress={Math.round(uploadProgress)}
            status="uploading"
            bytesSent={Math.round(uploadBytes)}
            bytesTotal={selectedFile?.size || 1000}
            onCancel={handleCancel}
          />
        </>
      )}

      {status === 'completed' && (
        <>
          <StatusMessage
            status="success"
            message="Upload complete"
            details="Your video has been successfully uploaded and converted."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Upload New Video
            </button>
          </div>
        </>
      )}

      {status === 'failed' && (
        <>
          <StatusMessage status="error" message={errorMessage || 'Upload failed'} />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </>
      )}
    </form>
  );
}
