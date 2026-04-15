/**
 * In-memory job queue for tracking video conversion progress
 */

import { JobState } from './types/upload';

export interface JobQueueOptions {
  /** Cleanup poll interval in ms (default: 10 minutes) */
  cleanupIntervalMs?: number;
  /** Retention time for completed jobs in ms (default: 1 hour) */
  retentionMs?: number;
  /** Disable automatic cleanup interval (for testing) */
  autoStart?: boolean;
}

const DEFAULT_CLEANUP_INTERVAL_MS = 600000; // 10 minutes
const DEFAULT_RETENTION_MS = 3600000; // 1 hour

class JobQueue {
  private jobs = new Map<string, JobState>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly cleanupIntervalMs: number;
  private readonly retentionMs: number;

  constructor(options: JobQueueOptions = {}) {
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS;
    this.retentionMs = options.retentionMs ?? DEFAULT_RETENTION_MS;

    if (options.autoStart !== false) {
      this.startCleanupInterval();
    }
  }

  /**
   * Start the cleanup interval. Exposed for testing.
   */
  startCleanupInterval(): void {
    if (this.cleanupInterval) {
      return;
    }
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.cleanupIntervalMs);
  }

  /**
   * Perform cleanup of expired completed jobs. Exposed so that tests
   * can invoke it directly without relying on timer scheduling.
   */
  performCleanup(now: number = Date.now()): number {
    const jobsToDelete: string[] = [];

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        job.phase === 'Completed' &&
        job.completedAt &&
        now - job.completedAt > this.retentionMs
      ) {
        jobsToDelete.push(jobId);
      }
    }

    jobsToDelete.forEach((jobId) => this.deleteJob(jobId));
    return jobsToDelete.length;
  }

  /**
   * Add a new job to the queue
   */
  addJob(job: JobState): void {
    this.jobs.set(job.jobId, job);
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): JobState | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update specific fields of a job
   */
  updateJob(jobId: string, updates: Partial<JobState>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, ...updates });
    }
  }

  /**
   * Delete a job from the queue
   */
  deleteJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  /**
   * Get all jobs (for debugging)
   */
  getAllJobs(): JobState[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Clear all jobs (for testing)
   */
  clear(): void {
    this.jobs.clear();
  }

  /**
   * Destroy the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
export const jobQueue = new JobQueue();

// Export class for testing
export { JobQueue };
