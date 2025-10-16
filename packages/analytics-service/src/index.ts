import dotenv from 'dotenv';
import { calculateBaselinesJob } from './jobs/calculate-baselines.job';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

class AnalyticsService {
  private isShuttingDown = false;

  constructor() {
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      this.isShuttingDown = true;

      calculateBaselinesJob.stop();

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting Analytics Service');

      // Start the baselines calculation job
      calculateBaselinesJob.start();

      logger.info('Analytics Service started successfully');
    } catch (error) {
      logger.error('Failed to start Analytics Service', { error });
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    if (this.isShuttingDown) return;

    logger.info('Stopping Analytics Service');
    calculateBaselinesJob.stop();
    logger.info('Analytics Service stopped');
  }
}

// Start the service
const analyticsService = new AnalyticsService();
analyticsService.start().catch((error) => {
  logger.error('Failed to start Analytics Service', { error });
  process.exit(1);
});

export { AnalyticsService };
