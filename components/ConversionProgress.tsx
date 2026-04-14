import React from 'react';

type ConversionStatus = 'pending' | 'converting' | 'completed' | 'failed';

interface ConversionProgressProps {
  progress: number;
  status: ConversionStatus;
  etaSeconds?: number;
  errorMessage?: string;
  onCancel?: () => void;
}

export default function ConversionProgress({
  progress,
  status,
  etaSeconds,
  errorMessage,
  onCancel,
}: ConversionProgressProps): React.ReactElement {
  const formatETA = (seconds: number): string => {
    if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${seconds} seconds`;
  };

  const statusColorMap: Record<ConversionStatus, string> = {
    pending: 'text-gray-600',
    converting: 'text-blue-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
  };

  const canCancel = status !== 'completed' && status !== 'failed';

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="FFmpeg conversion progress"
        className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
      >
        <div
          data-filled
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

      {/* ETA */}
      {etaSeconds !== undefined && status === 'converting' && (
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

      {/* Cancel Button */}
      {onCancel && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={!canCancel}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
