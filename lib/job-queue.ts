/**
 * In-memory job queue for tracking video conversion progress
 */

import { JobState } from './types/upload';

class JobQueue {
  private jobs = new Map<string, JobState>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup completed jobs after 1 hour
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const jobsToDelete: string[] = [];

      for (const [jobId, job] of this.jobs.entries()) {
        if (
          job.phase === 'Completed' &&
          job.completedAt &&
          now - job.completedAt > 3600000 // 1 hour
        ) {
          jobsToDelete.push(jobId);
        }
      }

      jobsToDelete.forEach((jobId) => this.deleteJob(jobId));
    }, 600000); // Check every 10 minutes
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
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Singleton instance
export const jobQueue = new JobQueue();

// Export class for testing
export { JobQueue };
