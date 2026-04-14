/**
 * Video upload and conversion type definitions
 */

export type JobPhase = 'Converting' | 'Uploading' | 'Completed';

export interface ProgressEvent {
  jobId: string;
  phase: JobPhase;
  progress: number; // 0-100
  timestamp: number;
  eta?: number; // estimated seconds remaining
  error?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
}

export interface JobState {
  jobId: string;
  file: FileInfo;
  phase: JobPhase;
  progress: number; // 0-100
  startedAt: number;
  completedAt?: number;
  error?: string;
  outputPath?: string; // path to converted file
}

export interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  onProgress?: (percent: number) => void;
  timeoutMs?: number; // default 300000 (5 minutes)
}

export interface ConversionResult {
  outputPath: string;
  duration: number; // seconds
  size: number; // bytes
}
