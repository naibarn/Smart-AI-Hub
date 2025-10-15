import { Request, Response } from 'express';
import { webhookService } from '../services/webhook.service';
import { WebhookSuccessResponse, WebhookErrorResponse } from '../types/webhook.types';
import logger from '../config/logger';

export class InternalController {
  /**
   * POST /internal/webhooks/trigger
   * Internal endpoint for triggering webhooks (service-to-service)
   */
  async triggerWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, userId, data, metadata } = req.body;

      // Validate required fields
      if (!eventType || !userId || !data) {
        const response: WebhookErrorResponse = {
          error: 'Missing required fields',
          message: 'eventType, userId, and data are required',
        };
        res.status(400).json(response);
        return;
      }

      // Trigger webhook
      await webhookService.triggerWebhook({
        eventType,
        userId,
        data,
        metadata,
      });

      const response: WebhookSuccessResponse = {
        success: true,
        data: null,
        message: 'Webhook triggered successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to trigger webhook:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to trigger webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      if (error instanceof Error && error.message.includes('Invalid event type')) {
        res.status(400).json(response);
      } else {
        res.status(500).json(response);
      }
    }
  }

  /**
   * GET /internal/health
   * Internal health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check database connection
      const { prisma } = require('../config/database');
      await prisma.$queryRaw`SELECT 1`;

      // Check Redis connection
      const { testRedisConnection } = require('../config/redis');
      const redisStatus = await testRedisConnection();

      const response: WebhookSuccessResponse = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          redis: redisStatus ? 'connected' : 'disconnected',
        },
        message: 'Webhook service is healthy',
      };

      res.json(response);
    } catch (error) {
      logger.error('Health check failed:', error);

      const response: WebhookErrorResponse = {
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(503).json(response);
    }
  }

  /**
   * GET /internal/stats
   * Internal statistics endpoint
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { getQueueStats } = require('../config/queue');
      const { prisma } = require('../config/database');

      const [queueStats, totalWebhooks, activeWebhooks, totalLogs] = await Promise.all([
        getQueueStats(),
        prisma.webhookEndpoint.count(),
        prisma.webhookEndpoint.count({ where: { isActive: true } }),
        prisma.webhookLog.count(),
      ]);

      const response: WebhookSuccessResponse = {
        success: true,
        data: {
          queue: queueStats,
          webhooks: {
            total: totalWebhooks,
            active: activeWebhooks,
          },
          logs: {
            total: totalLogs,
          },
        },
        message: 'Statistics retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get stats:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to retrieve statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(500).json(response);
    }
  }
}

export const internalController = new InternalController();
