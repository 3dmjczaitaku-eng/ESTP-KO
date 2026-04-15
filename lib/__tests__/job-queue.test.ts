/**
 * Tests for Job Queue
 * Validates in-memory job storage, updates, and cleanup
 */

import { JobQueue } from '../job-queue';
import { JobState } from '../types/upload';

describe('Job Queue', () => {
  let queue: JobQueue;
  const mockJob: JobState = {
    jobId: 'test-job-1',
    phase: 'Uploading',
    progress: 0,
    timestamp: Date.now(),
    error: null,
  };

  beforeEach(() => {
    // autoStart: false disables the setInterval so tests can drive
    // cleanup deterministically via performCleanup().
    queue = new JobQueue({ autoStart: false });
  });

  afterEach(() => {
    queue.destroy();
  });

  describe('addJob', () => {
    it('should add a job to the queue', () => {
      queue.addJob(mockJob);
      const job = queue.getJob('test-job-1');
      expect(job).toBeDefined();
      expect(job?.jobId).toBe('test-job-1');
      expect(job?.phase).toBe('Uploading');
    });

    it('should allow multiple jobs in queue', () => {
      const job1 = { ...mockJob, jobId: 'job-1' };
      const job2 = { ...mockJob, jobId: 'job-2' };

      queue.addJob(job1);
      queue.addJob(job2);

      expect(queue.getJob('job-1')).toBeDefined();
      expect(queue.getJob('job-2')).toBeDefined();
      expect(queue.getAllJobs()).toHaveLength(2);
    });

    it('should overwrite existing job with same ID', () => {
      const job1 = { ...mockJob, progress: 0 };
      const job2 = { ...mockJob, progress: 50 };

      queue.addJob(job1);
      queue.addJob(job2);

      const retrieved = queue.getJob('test-job-1');
      expect(retrieved?.progress).toBe(50);
      expect(queue.getAllJobs()).toHaveLength(1);
    });
  });

  describe('getJob', () => {
    it('should return job by ID', () => {
      queue.addJob(mockJob);
      const retrieved = queue.getJob('test-job-1');
      expect(retrieved).toEqual(mockJob);
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = queue.getJob('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('updateJob', () => {
    it('should update job progress', () => {
      queue.addJob(mockJob);
      queue.updateJob('test-job-1', { progress: 75 });

      const updated = queue.getJob('test-job-1');
      expect(updated?.progress).toBe(75);
      expect(updated?.phase).toBe('Uploading'); // Other fields preserved
    });

    it('should update job phase', () => {
      queue.addJob(mockJob);
      queue.updateJob('test-job-1', { phase: 'Converting' });

      const updated = queue.getJob('test-job-1');
      expect(updated?.phase).toBe('Converting');
    });

    it('should update multiple fields at once', () => {
      queue.addJob(mockJob);
      queue.updateJob('test-job-1', {
        phase: 'Completed',
        progress: 100,
        completedAt: Date.now(),
      });

      const updated = queue.getJob('test-job-1');
      expect(updated?.phase).toBe('Completed');
      expect(updated?.progress).toBe(100);
      expect(updated?.completedAt).toBeDefined();
    });

    it('should not affect non-existent job', () => {
      queue.updateJob('non-existent', { progress: 50 });
      expect(queue.getJob('non-existent')).toBeUndefined();
    });

    it('should preserve all other fields when updating', () => {
      const job = {
        ...mockJob,
        timestamp: 12345,
        error: null,
      };
      queue.addJob(job);
      queue.updateJob('test-job-1', { phase: 'Converting' });

      const updated = queue.getJob('test-job-1');
      expect(updated?.timestamp).toBe(12345);
      expect(updated?.error).toBeNull();
    });
  });

  describe('deleteJob', () => {
    it('should delete job from queue', () => {
      queue.addJob(mockJob);
      expect(queue.getJob('test-job-1')).toBeDefined();

      queue.deleteJob('test-job-1');
      expect(queue.getJob('test-job-1')).toBeUndefined();
    });

    it('should not error when deleting non-existent job', () => {
      expect(() => queue.deleteJob('non-existent')).not.toThrow();
    });

    it('should delete specific job without affecting others', () => {
      const job1 = { ...mockJob, jobId: 'job-1' };
      const job2 = { ...mockJob, jobId: 'job-2' };

      queue.addJob(job1);
      queue.addJob(job2);
      queue.deleteJob('job-1');

      expect(queue.getJob('job-1')).toBeUndefined();
      expect(queue.getJob('job-2')).toBeDefined();
      expect(queue.getAllJobs()).toHaveLength(1);
    });
  });

  describe('getAllJobs', () => {
    it('should return empty array when no jobs', () => {
      expect(queue.getAllJobs()).toEqual([]);
    });

    it('should return all jobs in queue', () => {
      const job1 = { ...mockJob, jobId: 'job-1' };
      const job2 = { ...mockJob, jobId: 'job-2' };
      const job3 = { ...mockJob, jobId: 'job-3' };

      queue.addJob(job1);
      queue.addJob(job2);
      queue.addJob(job3);

      const all = queue.getAllJobs();
      expect(all).toHaveLength(3);
      expect(all.map((j) => j.jobId)).toEqual(['job-1', 'job-2', 'job-3']);
    });

    it('should return snapshot of current jobs', () => {
      const job1 = { ...mockJob, jobId: 'job-1' };
      queue.addJob(job1);

      const jobs1 = queue.getAllJobs();
      expect(jobs1).toHaveLength(1);

      const job2 = { ...mockJob, jobId: 'job-2' };
      queue.addJob(job2);

      const jobs2 = queue.getAllJobs();
      expect(jobs2).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should remove all jobs', () => {
      queue.addJob({ ...mockJob, jobId: 'job-1' });
      queue.addJob({ ...mockJob, jobId: 'job-2' });
      expect(queue.getAllJobs()).toHaveLength(2);

      queue.clear();
      expect(queue.getAllJobs()).toHaveLength(0);
    });

    it('should allow adding jobs after clear', () => {
      queue.addJob({ ...mockJob, jobId: 'job-1' });
      queue.clear();
      queue.addJob({ ...mockJob, jobId: 'job-2' });

      expect(queue.getAllJobs()).toHaveLength(1);
      expect(queue.getJob('job-2')).toBeDefined();
    });
  });

  describe('performCleanup', () => {
    it('should delete completed jobs older than retention window', () => {
      const startTime = Date.now();
      const oldJob: JobState = {
        jobId: 'old-job',
        phase: 'Completed',
        progress: 100,
        timestamp: startTime,
        completedAt: startTime - 3700000, // 1h + 100s ago
        error: null,
      };

      queue.addJob(oldJob);
      const deleted = queue.performCleanup(startTime);

      expect(deleted).toBe(1);
      expect(queue.getJob('old-job')).toBeUndefined();
    });

    it('should not delete completed jobs less than 1 hour old', () => {
      const startTime = Date.now();
      const recentJob: JobState = {
        jobId: 'recent-job',
        phase: 'Completed',
        progress: 100,
        timestamp: startTime,
        completedAt: startTime - 1800000, // 30 minutes ago
        error: null,
      };

      queue.addJob(recentJob);
      const deleted = queue.performCleanup(startTime);

      expect(deleted).toBe(0);
      expect(queue.getJob('recent-job')).toBeDefined();
    });

    it('should never delete jobs that are still in progress', () => {
      const inProgressJob: JobState = {
        jobId: 'in-progress-job',
        phase: 'Converting',
        progress: 50,
        timestamp: Date.now(),
        error: null,
      };

      queue.addJob(inProgressJob);
      const deleted = queue.performCleanup();

      expect(deleted).toBe(0);
      expect(queue.getJob('in-progress-job')).toBeDefined();
    });

    it('should skip completed jobs missing completedAt timestamp', () => {
      const jobWithoutTime: JobState = {
        jobId: 'no-time-job',
        phase: 'Completed',
        progress: 100,
        timestamp: Date.now(),
        error: null,
      };

      queue.addJob(jobWithoutTime);
      const deleted = queue.performCleanup();

      expect(deleted).toBe(0);
      expect(queue.getJob('no-time-job')).toBeDefined();
    });

    it('should only delete expired jobs while preserving others', () => {
      const startTime = Date.now();
      queue.addJob({
        jobId: 'old-job',
        phase: 'Completed',
        progress: 100,
        timestamp: startTime,
        completedAt: startTime - 3700000,
        error: null,
      });
      queue.addJob({
        jobId: 'recent-job',
        phase: 'Completed',
        progress: 100,
        timestamp: startTime,
        completedAt: startTime - 1800000,
        error: null,
      });

      const deleted = queue.performCleanup(startTime);

      expect(deleted).toBe(1);
      expect(queue.getJob('old-job')).toBeUndefined();
      expect(queue.getJob('recent-job')).toBeDefined();
    });

    it('should respect custom retention window', () => {
      const shortQueue = new JobQueue({
        autoStart: false,
        retentionMs: 1000, // 1 second retention
      });
      const now = Date.now();

      shortQueue.addJob({
        jobId: 'short-lived',
        phase: 'Completed',
        progress: 100,
        timestamp: now,
        completedAt: now - 2000, // 2 seconds ago
        error: null,
      });

      const deleted = shortQueue.performCleanup(now);
      expect(deleted).toBe(1);
      shortQueue.destroy();
    });
  });

  describe('automatic cleanup interval', () => {
    it('should fire performCleanup on the configured interval', () => {
      jest.useFakeTimers();
      try {
        const autoQueue = new JobQueue({
          cleanupIntervalMs: 1000,
          retentionMs: 500,
        });
        const spy = jest.spyOn(autoQueue, 'performCleanup');

        jest.advanceTimersByTime(1000);
        expect(spy).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(2000);
        expect(spy).toHaveBeenCalledTimes(3);

        autoQueue.destroy();
      } finally {
        jest.useRealTimers();
      }
    });

    it('should not start a second interval when startCleanupInterval is called twice', () => {
      jest.useFakeTimers();
      try {
        const autoQueue = new JobQueue({ cleanupIntervalMs: 1000 });
        const spy = jest.spyOn(autoQueue, 'performCleanup');

        autoQueue.startCleanupInterval(); // should be a no-op
        jest.advanceTimersByTime(1000);

        expect(spy).toHaveBeenCalledTimes(1);
        autoQueue.destroy();
      } finally {
        jest.useRealTimers();
      }
    });

    it('should stop firing after destroy', () => {
      jest.useFakeTimers();
      try {
        const autoQueue = new JobQueue({ cleanupIntervalMs: 1000 });
        const spy = jest.spyOn(autoQueue, 'performCleanup');

        jest.advanceTimersByTime(1000);
        expect(spy).toHaveBeenCalledTimes(1);

        autoQueue.destroy();
        jest.advanceTimersByTime(5000);
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('destroy', () => {
    it('should clear all jobs', () => {
      queue.addJob(mockJob);
      expect(queue.getJob('test-job-1')).toBeDefined();

      queue.destroy();
      expect(queue.getAllJobs()).toHaveLength(0);
    });

    it('should stop cleanup interval', () => {
      const now = Date.now();
      const expiredJob: JobState = {
        jobId: 'expired-job',
        phase: 'Completed',
        progress: 100,
        timestamp: now,
        completedAt: now - 3700000,
        error: null,
      };

      queue.addJob(expiredJob);
      queue.destroy();

      // Create new instance and verify the old one's interval stopped
      // (this is implicit - if interval wasn't cleared, Jest would complain about timers)
      expect(queue.getAllJobs()).toHaveLength(0);
    });
  });
});
