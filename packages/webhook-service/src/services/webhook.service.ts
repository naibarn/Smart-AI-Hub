import { prisma } from '../config/database';
import logger from '../config/logger';
import axios from 'axios';
import {
  WebhookEndpoint,
  WebhookLog,
  WebhookStatus,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookTestRequest,
  WebhookTriggerRequest,
  WebhookDeliveryPayload,
  WebhookDeliveryResult,
  WebhookStats,
  WEBHOOK_EVENT_TYPES,
  WebhookEventType,
} from '../types/webhook.types';
import { createWebhookSecret, addSignatureHeaders } from '../utils/signature';
import { addWebhookJob } from '../config/queue';

export class WebhookService {
  /**
   * Create a new webhook endpoint
   */
  async createWebhook(userId: string, data: CreateWebhookRequest): Promise<WebhookEndpoint> {
    try {
      // Validate URL
      this.validateWebhookUrl(data.url);

      // Validate events
      this.validateEvents(data.events);

      // Generate secret
      const secret = createWebhookSecret();

      const webhook = await prisma.webhookEndpoint.create({
        data: {
          userId,
          url: data.url,
          secret,
          events: data.events,
          description: data.description,
        },
      });

      logger.info(`Webhook created: ${webhook.id}`, {
        userId,
        url: data.url,
        events: data.events,
      });

      return webhook;
    } catch (error) {
      logger.error('Failed to create webhook:', error);
      throw error;
    }
  }

  /**
   * Get all webhooks for a user
   */
  async getWebhooks(userId: string): Promise<WebhookEndpoint[]> {
    try {
      const webhooks = await prisma.webhookEndpoint.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return webhooks;
    } catch (error) {
      logger.error('Failed to get webhooks:', error);
      throw error;
    }
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(userId: string, webhookId: string): Promise<WebhookEndpoint | null> {
    try {
      const webhook = await prisma.webhookEndpoint.findFirst({
        where: {
          id: webhookId,
          userId,
        },
      });

      return webhook;
    } catch (error) {
      logger.error('Failed to get webhook by ID:', error);
      throw error;
    }
  }

  /**
   * Update webhook endpoint
   */
  async updateWebhook(
    userId: string,
    webhookId: string,
    data: UpdateWebhookRequest
  ): Promise<WebhookEndpoint> {
    try {
      // Check if webhook exists and belongs to user
      const existingWebhook = await this.getWebhookById(userId, webhookId);
      if (!existingWebhook) {
        throw new Error('Webhook not found');
      }

      // Validate URL if provided
      if (data.url) {
        this.validateWebhookUrl(data.url);
      }

      // Validate events if provided
      if (data.events) {
        this.validateEvents(data.events);
      }

      const updateData: any = {};
      if (data.url) updateData.url = data.url;
      if (data.events) updateData.events = data.events;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const webhook = await prisma.webhookEndpoint.update({
        where: { id: webhookId },
        data: updateData,
      });

      logger.info(`Webhook updated: ${webhook.id}`, {
        userId,
        updates: Object.keys(updateData),
      });

      return webhook;
    } catch (error) {
      logger.error('Failed to update webhook:', error);
      throw error;
    }
  }

  /**
   * Delete webhook endpoint
   */
  async deleteWebhook(userId: string, webhookId: string): Promise<void> {
    try {
      // Check if webhook exists and belongs to user
      const existingWebhook = await this.getWebhookById(userId, webhookId);
      if (!existingWebhook) {
        throw new Error('Webhook not found');
      }

      await prisma.webhookEndpoint.delete({
        where: { id: webhookId },
      });

      logger.info(`Webhook deleted: ${webhookId}`, { userId });
    } catch (error) {
      logger.error('Failed to delete webhook:', error);
      throw error;
    }
  }

  /**
   * Toggle webhook active status
   */
  async toggleWebhook(userId: string, webhookId: string): Promise<WebhookEndpoint> {
    try {
      const webhook = await this.getWebhookById(userId, webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const updatedWebhook = await prisma.webhookEndpoint.update({
        where: { id: webhookId },
        data: { isActive: !webhook.isActive },
      });

      logger.info(`Webhook toggled: ${webhookId}`, {
        userId,
        isActive: updatedWebhook.isActive,
      });

      return updatedWebhook;
    } catch (error) {
      logger.error('Failed to toggle webhook:', error);
      throw error;
    }
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(
    userId: string,
    webhookId: string,
    data: WebhookTestRequest
  ): Promise<WebhookLog> {
    try {
      const webhook = await this.getWebhookById(userId, webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      // Validate event type
      this.validateEvent(data.eventType);

      // Create test payload
      const payload: WebhookDeliveryPayload = {
        id: `test-${Date.now()}`,
        eventType: data.eventType,
        timestamp: new Date().toISOString(),
        userId,
        data: data.payload || { test: true },
        metadata: { test: true },
      };

      // Create log entry
      const log = await prisma.webhookLog.create({
        data: {
          webhookId,
          eventType: data.eventType,
          payload,
          status: WebhookStatus.PENDING,
          attempt: 1,
          maxAttempts: 1, // Test webhooks only try once
        },
      });

      // Deliver webhook synchronously for testing
      const result = await this.deliverWebhook(webhook, payload);

      // Update log with result
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          status: result.success ? WebhookStatus.DELIVERED : WebhookStatus.FAILED,
          statusCode: result.statusCode,
          response: result.response,
          error: result.error,
          deliveredAt: result.success ? new Date() : undefined,
        },
      });

      logger.info(`Webhook test completed: ${webhookId}`, {
        userId,
        eventType: data.eventType,
        success: result.success,
      });

      return prisma.webhookLog.findUnique({ where: { id: log.id } }) as Promise<WebhookLog>;
    } catch (error) {
      logger.error('Failed to test webhook:', error);
      throw error;
    }
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(
    userId: string,
    webhookId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: WebhookLog[]; total: number }> {
    try {
      // Check if webhook exists and belongs to user
      const webhook = await this.getWebhookById(userId, webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const [logs, total] = await Promise.all([
        prisma.webhookLog.findMany({
          where: { webhookId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.webhookLog.count({
          where: { webhookId },
        }),
      ]);

      return { logs, total };
    } catch (error) {
      logger.error('Failed to get webhook logs:', error);
      throw error;
    }
  }

  /**
   * Trigger webhook event
   */
  async triggerWebhook(data: WebhookTriggerRequest): Promise<void> {
    try {
      // Validate event type
      this.validateEvent(data.eventType);

      // Find active webhooks for this user and event type
      const webhooks = await prisma.webhookEndpoint.findMany({
        where: {
          userId: data.userId,
          isActive: true,
          events: {
            has: data.eventType,
          },
        },
      });

      if (webhooks.length === 0) {
        logger.debug(`No active webhooks found for event: ${data.eventType}`, {
          userId: data.userId,
        });
        return;
      }

      // Create payload
      const payload: WebhookDeliveryPayload = {
        id: `${data.eventType}-${Date.now()}`,
        eventType: data.eventType,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        data: data.data,
        metadata: data.metadata,
      };

      // Queue webhook deliveries
      for (const webhook of webhooks) {
        await this.queueWebhookDelivery(webhook, payload);
      }

      logger.info(`Webhooks triggered: ${data.eventType}`, {
        userId: data.userId,
        webhookCount: webhooks.length,
      });
    } catch (error) {
      logger.error('Failed to trigger webhook:', error);
      throw error;
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(userId: string): Promise<WebhookStats> {
    try {
      const [
        totalWebhooks,
        activeWebhooks,
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        pendingDeliveries,
      ] = await Promise.all([
        prisma.webhookEndpoint.count({
          where: { userId },
        }),
        prisma.webhookEndpoint.count({
          where: { userId, isActive: true },
        }),
        prisma.webhookLog.count({
          where: {
            webhook: { userId },
          },
        }),
        prisma.webhookLog.count({
          where: {
            webhook: { userId },
            status: WebhookStatus.DELIVERED,
          },
        }),
        prisma.webhookLog.count({
          where: {
            webhook: { userId },
            status: WebhookStatus.FAILED,
          },
        }),
        prisma.webhookLog.count({
          where: {
            webhook: { userId },
            status: WebhookStatus.PENDING,
          },
        }),
      ]);

      return {
        totalWebhooks,
        activeWebhooks,
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        pendingDeliveries,
      };
    } catch (error) {
      logger.error('Failed to get webhook stats:', error);
      throw error;
    }
  }

  /**
   * Queue webhook delivery
   */
  private async queueWebhookDelivery(
    webhook: WebhookEndpoint,
    payload: WebhookDeliveryPayload
  ): Promise<void> {
    try {
      // Create log entry
      const log = await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          eventType: payload.eventType,
          payload,
          status: WebhookStatus.PENDING,
          attempt: 1,
          maxAttempts: 3,
          nextRetryAt: new Date(Date.now() + 5000), // 5 seconds from now
        },
      });

      // Add to queue
      await addWebhookJob(webhook.id, payload.eventType, payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      logger.debug(`Webhook queued: ${webhook.id}`, {
        logId: log.id,
        eventType: payload.eventType,
      });
    } catch (error) {
      logger.error('Failed to queue webhook delivery:', error);
      throw error;
    }
  }

  /**
   * Deliver webhook synchronously
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
      });

      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        response: response.data,
        attempt: 1,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt: 1,
      };
    }
  }

  /**
   * Validate webhook URL
   */
  private validateWebhookUrl(url: string): void {
    try {
      const urlObj = new URL(url);

      if (urlObj.protocol !== 'https:') {
        throw new Error('Webhook URL must use HTTPS');
      }

      if (!urlObj.hostname) {
        throw new Error('Invalid webhook URL');
      }
    } catch (error) {
      throw new Error(
        `Invalid webhook URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate event types
   */
  private validateEvents(events: string[]): void {
    const validEvents = Object.values(WEBHOOK_EVENT_TYPES);

    for (const event of events) {
      if (!validEvents.includes(event as WebhookEventType)) {
        throw new Error(`Invalid event type: ${event}`);
      }
    }
  }

  /**
   * Validate single event type
   */
  private validateEvent(event: string): void {
    this.validateEvents([event]);
  }
}

export const webhookService = new WebhookService();
