import Bull from 'bull';
import logger from './logger';
import { WebhookQueueJob } from '../types/webhook.types';

// Webhook delivery queue
export const webhookQueue = new Bull('webhook delivery', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Default retry attempts
    backoff: {
      type: 'exponential',
      delay: 5000, // Initial delay: 5 seconds
    },
  },
});

// Queue events logging
webhookQueue.on('completed', (job, result) => {
  logger.info(`Webhook delivery completed: ${job.id}`, {
    webhookId: job.data.webhookId,
    eventType: job.data.eventType,
    attempt: job.data.attempt,
    result,
  });
});

webhookQueue.on('failed', (job, err) => {
  logger.error(`Webhook delivery failed: ${job.id}`, {
    webhookId: job.data.webhookId,
    eventType: job.data.eventType,
    attempt: job.data.attempt,
    error: err.message,
    stack: err.stack,
  });
});

webhookQueue.on('stalled', (job) => {
  logger.warn(`Webhook delivery stalled: ${job.id}`, {
    webhookId: job.data.webhookId,
    eventType: job.data.eventType,
  });
});

webhookQueue.on('progress', (job, progress) => {
  logger.debug(`Webhook delivery progress: ${job.id}`, {
    webhookId: job.data.webhookId,
    eventType: job.data.eventType,
    progress,
  });
});

// Add webhook delivery job to queue
export const addWebhookJob = async (
  webhookId: string,
  eventType: string,
  payload: any,
  options?: Bull.JobOptions
): Promise<Bull.Job<WebhookQueueJob>> => {
  const jobData: WebhookQueueJob = {
    id: `${webhookId}-${eventType}-${Date.now()}`,
    webhookId,
    eventType,
    payload,
    attempt: 1,
    maxAttempts: options?.attempts || 3,
    delay: options?.delay || 0,
  };

  return await webhookQueue.add('deliver-webhook', jobData, {
    ...options,
    jobId: jobData.id,
  });
};

// Get queue statistics
export const getQueueStats = async (): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}> => {
  const counts = await webhookQueue.getJobCounts();

  let paused = 0;
  try {
    paused = (await webhookQueue.isPaused()) ? 1 : 0;
  } catch (e) {
    paused = 0;
  }

  return {
    waiting: counts.waiting || 0,
    active: counts.active || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    delayed: counts.delayed || 0,
    paused,
  };
};

// Get job by ID
export const getJob = async (jobId: string): Promise<Bull.Job<WebhookQueueJob> | null> => {
  return await webhookQueue.getJob(jobId);
};

// Get jobs for webhook
export const getJobsForWebhook = async (
  webhookId: string,
  status: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed' = 'completed',
  limit: number = 50
): Promise<Bull.Job<WebhookQueueJob>[]> => {
  let jobs: Bull.Job<WebhookQueueJob>[];

  switch (status) {
    case 'completed':
      jobs = await webhookQueue.getCompleted();
      break;
    case 'failed':
      jobs = await webhookQueue.getFailed();
      break;
    case 'active':
      jobs = await webhookQueue.getActive();
      break;
    case 'waiting':
      jobs = await webhookQueue.getWaiting();
      break;
    case 'delayed':
      jobs = await webhookQueue.getDelayed();
      break;
    default:
      jobs = await webhookQueue.getCompleted();
  }

  return jobs
    .filter((job) => job.data.webhookId === webhookId)
    .slice(0, limit)
    .reverse(); // Most recent first
};

// Remove jobs for webhook
export const removeJobsForWebhook = async (
  webhookId: string,
  status?: 'completed' | 'failed' | 'active' | 'waiting' | 'delayed'
): Promise<number> => {
  let jobsToRemove: Bull.Job<WebhookQueueJob>[];

  if (status) {
    switch (status) {
      case 'completed':
        jobsToRemove = await webhookQueue.getCompleted();
        break;
      case 'failed':
        jobsToRemove = await webhookQueue.getFailed();
        break;
      case 'active':
        jobsToRemove = await webhookQueue.getActive();
        break;
      case 'waiting':
        jobsToRemove = await webhookQueue.getWaiting();
        break;
      case 'delayed':
        jobsToRemove = await webhookQueue.getDelayed();
        break;
      default:
        jobsToRemove = await webhookQueue.getJobs([
          'completed',
          'failed',
          'active',
          'waiting',
          'delayed',
        ]);
    }
  } else {
    jobsToRemove = await webhookQueue.getJobs([
      'completed',
      'failed',
      'active',
      'waiting',
      'delayed',
    ]);
  }

  const webhooksJobs = jobsToRemove.filter((job) => job.data.webhookId === webhookId);
  let removedCount = 0;

  for (const job of webhooksJobs) {
    try {
      await job.remove();
      removedCount++;
    } catch (error) {
      logger.error(`Failed to remove job ${job.id}:`, error);
    }
  }

  return removedCount;
};

// Pause/resume queue
export const pauseQueue = async (): Promise<void> => {
  await webhookQueue.pause();
  logger.info('Webhook queue paused');
};

export const resumeQueue = async (): Promise<void> => {
  await webhookQueue.resume();
  logger.info('Webhook queue resumed');
};

// Clean queue
export const cleanQueue = async (
  grace: number = 0,
  status: 'completed' | 'failed' = 'completed',
  limit: number = 100
): Promise<string[]> => {
  const jobs = await webhookQueue.clean(grace, status, limit);
  logger.info(`Cleaned ${jobs.length} ${status} jobs from queue`);
  // Normalize to string[] of job IDs to satisfy return type across Bull versions
  return jobs.map((j: any) => String(j?.id ?? j));
};

// Close queue
export const closeQueue = async (): Promise<void> => {
  await webhookQueue.close();
  logger.info('Webhook queue closed');
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeQueue();
});

process.on('SIGTERM', async () => {
  await closeQueue();
});
