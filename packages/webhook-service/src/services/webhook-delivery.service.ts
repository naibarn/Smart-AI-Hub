import axios from 'axios';
import { prisma } from '../config/database';
import logger from '../config/logger';
import {
  WebhookEndpoint,
  WebhookLog,
  WebhookStatus,
  WebhookDeliveryPayload,
  WebhookDeliveryResult,
  WebhookQueueJob,
} from '../types/webhook.types';
import { addSignatureHeaders } from '../utils/signature';
import { addWebhookJob } from '../config/queue';
import type { Prisma } from '@prisma/client';

export class WebhookDeliveryService {
  /**
   * Process webhook delivery job from queue
   */
  async processWebhookDelivery(job: WebhookQueueJob): Promise<WebhookDeliveryResult> {
    const { webhookId, payload, attempt, maxAttempts } = job;

    try {
      // Get webhook details
      const webhook = await prisma.webhookEndpoint.findUnique({
        where: { id: webhookId },
      });

      if (!webhook) {
        throw new Error(`Webhook not found: ${webhookId}`);
      }

      if (!webhook.isActive) {
        throw new Error(`Webhook is inactive: ${webhookId}`);
      }

      // Get or create log entry
      const log = await this.getOrCreateLog(webhookId, payload, attempt, maxAttempts);

      // Attempt delivery
      const result = await this.deliverWebhook(webhook, payload);

      // Update log with result
      await this.updateLogAfterDelivery(log.id, result, attempt, maxAttempts);

      logger.info(`Webhook delivery processed: ${webhookId}`, {
        eventType: payload.eventType,
        attempt,
        success: result.success,
        statusCode: result.statusCode,
      });

      return result;
    } catch (error) {
      logger.error(`Failed to process webhook delivery: ${webhookId}`, {
        eventType: payload.eventType,
        attempt,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt,
      };
    }
  }

  /**
   * Deliver webhook to endpoint
   */
  private async deliverWebhook(
    webhook: WebhookEndpoint,
    payload: WebhookDeliveryPayload
  ): Promise<WebhookDeliveryResult> {
    try {
      const payloadString = JSON.stringify(payload);
      const headers = addSignatureHeaders(payloadString, webhook.secret);

      const response = await axios.post(webhook.url, payloadString, {
        headers,
        timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30000'),
        maxContentLength: 1024 * 1024, // 1MB
        validateStatus: () => true, // Don't throw on HTTP errors
        maxRedirects: 5,
      });

      const success = response.status >= 200 && response.status < 300;

      return {
        success,
        statusCode: response.status,
        response: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        attempt: 1,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          statusCode: error.response?.status,
          error: error.message,
          attempt: 1,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: 1,
      };
    }
  }

  /**
   * Get or create log entry for webhook delivery
   */
  private async getOrCreateLog(
    webhookId: string,
    payload: WebhookDeliveryPayload,
    attempt: number,
    maxAttempts: number
  ): Promise<WebhookLog> {
    // Try to find existing log for this delivery
    let log = await prisma.webhookLog.findFirst({
      where: {
        webhookId,
        eventType: payload.eventType,
        payload: {
          path: ['id'],
          equals: payload.id,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      // Create new log entry
      log = await prisma.webhookLog.create({
        data: {
          webhookId,
          eventType: payload.eventType,
          payload: payload as unknown as Prisma.InputJsonValue,
          status: WebhookStatus.PENDING,
          attempt,
          maxAttempts,
          nextRetryAt:
            attempt < maxAttempts
              ? new Date(Date.now() + this.calculateRetryDelay(attempt))
              : undefined,
        },
      });
    } else {
      // Update existing log
      log = await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          attempt,
          status: attempt >= maxAttempts ? WebhookStatus.FAILED : WebhookStatus.RETRYING,
          nextRetryAt:
            attempt < maxAttempts
              ? new Date(Date.now() + this.calculateRetryDelay(attempt))
              : undefined,
        },
      });
    }

    return log;
  }

  /**
   * Update log after delivery attempt
   */
  private async updateLogAfterDelivery(
    logId: string,
    result: WebhookDeliveryResult,
    attempt: number,
    maxAttempts: number
  ): Promise<void> {
    const updateData: any = {
      statusCode: result.statusCode,
      response: result.response,
      error: result.error,
    };

    if (result.success) {
      updateData.status = WebhookStatus.DELIVERED;
      updateData.deliveredAt = new Date();
      updateData.nextRetryAt = null;
    } else if (attempt >= maxAttempts) {
      updateData.status = WebhookStatus.FAILED;
      updateData.nextRetryAt = null;
    } else {
      updateData.status = WebhookStatus.RETRYING;
      updateData.nextRetryAt = new Date(Date.now() + this.calculateRetryDelay(attempt));
    }

    await prisma.webhookLog.update({
      where: { id: logId },
      data: updateData,
    });
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 5000; // 5 seconds
    const maxDelay = 300000; // 5 minutes

    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Retry failed webhooks
   */
  async retryFailedWebhooks(): Promise<number> {
    try {
      // Get webhooks that need to be retried
      const logsToRetry = await prisma.webhookLog.findMany({
        where: {
          status: WebhookStatus.RETRYING,
          nextRetryAt: {
            lte: new Date(),
          },
        },
        include: {
          webhook: true,
        },
      });

      let retriedCount = 0;

      for (const log of logsToRetry) {
        if (log.webhook && log.webhook.isActive) {
          try {
            // Re-queue the webhook delivery
            await addWebhookJob(
              log.webhookId,
              log.eventType,
              log.payload as unknown as WebhookDeliveryPayload,
              {
                attempts: log.maxAttempts - log.attempt + 1,
                delay: 0,
              }
            );

            // Update log status
            await prisma.webhookLog.update({
              where: { id: log.id },
              data: {
                status: WebhookStatus.PENDING,
                nextRetryAt: null,
              },
            });

            retriedCount++;
          } catch (error) {
            logger.error(`Failed to retry webhook: ${log.id}`, {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      if (retriedCount > 0) {
        logger.info(`Retried ${retriedCount} failed webhooks`);
      }

      return retriedCount;
    } catch (error) {
      logger.error('Failed to retry failed webhooks:', error);
      return 0;
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.webhookLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          status: {
            in: [WebhookStatus.DELIVERED, WebhookStatus.FAILED],
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old webhook logs`);
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error);
      return 0;
    }
  }
}

export const webhookDeliveryService = new WebhookDeliveryService();
