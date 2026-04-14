import React from 'react';

type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';

interface UploadProgressProps {
  progress: number;
  status: UploadStatus;
  bytesSent: number;
  bytesTotal: number;
  etaSeconds?: number;
  errorMessage?: string;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export default function UploadProgress({
  progress,
  status,
  bytesSent,
  bytesTotal,
  etaSeconds,
  errorMessage,
  onCancel,
  onPause,
  onResume,
}: UploadProgressProps): React.ReactElement {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatETA = (seconds: number): string => {
    if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${seconds} seconds`;
  };

  const statusColorMap: Record<UploadStatus, string> = {
    pending: 'text-gray-600',
    uploading: 'text-blue-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    paused: 'text-yellow-600',
  };

  const canCancel = status !== 'completed' && status !== 'failed';
  const showPauseButton = status === 'uploading' && onPause;
  const showResumeButton = status === 'paused' && onResume;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Upload progress"
        className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
      >
        <div
          data-testid="upload-progress-fill"
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Percentage */}
      <div className="text-center text-sm font-medium text-gray-700">
        {progress}%
      </div>

      {/* Status */}
      <div className="text-center">
        <span
          data-status={status}
          className={`text-sm font-medium ${statusColorMap[status]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Bytes Display */}
      <div className="text-center text-sm text-gray-600">
        {formatBytes(bytesSent)} / {formatBytes(bytesTotal)}
      </div>

      {/* ETA */}
      {etaSeconds !== undefined && status === 'uploading' && (
        <div className="text-center text-sm text-gray-600">
          ETA: {formatETA(etaSeconds)}
        </div>
      )}

      {/* Error Message */}
      {status === 'failed' && errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        {showPauseButton && (
          <button
            type="button"
            onClick={onPause}
            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 transition-colors"
          >
            Pause
          </button>
        )}

        {showResumeButton && (
          <button
            type="button"
            onClick={onResume}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
          >
            Resume
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={!canCancel}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
