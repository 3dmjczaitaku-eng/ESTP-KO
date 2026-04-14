'use client';

import React from 'react';

export type StatusType = 'success' | 'error' | 'info' | 'warning';

interface StatusMessageProps {
  status: StatusType | null | undefined;
  message: string;
  details?: string;
}

const statusConfig = {
  success: {
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '✓',
  },
  error: {
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '✕',
  },
  info: {
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'ℹ',
  },
  warning: {
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: '⚠',
  },
} as const;

export default function StatusMessage({
  status,
  message,
  details,
}: StatusMessageProps) {
  if (!status) {
    return null;
  }

  const config = statusConfig[status];

  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor} ${config.textColor}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          data-icon={status}
          className="text-lg font-bold"
        >
          {config.icon}
        </span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {details && <p className="mt-1 text-sm opacity-75">{details}</p>}
        </div>
      </div>
    </div>
  );
}
