import axios from 'axios';
import { logger } from '../utils/logger';

interface WebhookEventData {
  eventType: string;
  userId: string;
  data: any;
  metadata?: any;
}

class WebhookService {
  private webhookServiceUrl: string;
  private internalSecret?: string;

  constructor() {
    this.webhookServiceUrl = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3005';
    this.internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(eventType: string, userId: string, data: any, metadata: any = {}): Promise<void> {
    try {
      if (!this.internalSecret) {
        logger.warn('Webhook service integration not configured - skipping webhook trigger');
        return;
      }

      const payload: WebhookEventData = {
        eventType,
        userId,
        data,
        metadata: {
          ...metadata,
          service: 'mcp-server',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await axios.post(
        `${this.webhookServiceUrl}/internal/webhooks/trigger`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.internalSecret}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 seconds timeout
        }
      );

      logger.info(`Webhook triggered successfully: ${eventType} for user ${userId}`);
    } catch (error: any) {
      // Log error but don't fail the main operation
      logger.error(`Failed to trigger webhook: ${eventType} for user ${userId}:`, error.message);
      
      if (error.response) {
        logger.error('Webhook service response:', error.response.status, error.response.data);
      }
    }
  }

  /**
   * Trigger service.completed event
   */
  async triggerServiceCompleted(
    userId: string,
    requestId: string,
    model: string,
    tokens: number,
    credits: number,
    duration: number,
    response: any
  ): Promise<void> {
    return await this.triggerEvent('service.completed', userId, {
      userId,
      requestId,
      service: 'mcp',
      model,
      tokens,
      credits,
      duration,
      response: response.content || response.data,
      completedAt: new Date().toISOString(),
    }, {
      source: 'mcp_completion',
      requestId,
      model,
    });
  }

  /**
   * Trigger service.failed event
   */
  async triggerServiceFailed(
    userId: string,
    requestId: string,
    model: string,
    errorCode: string,
    errorMessage: string,
    duration: number
  ): Promise<void> {
    return await this.triggerEvent('service.failed', userId, {
      userId,
      requestId,
      service: 'mcp',
      model,
      errorCode,
      errorMessage,
      duration,
      failedAt: new Date().toISOString(),
    }, {
      source: 'mcp_error',
      requestId,
      model,
      errorCode,
    });
  }

  /**
   * Trigger service.started event
   */
  async triggerServiceStarted(
    userId: string,
    requestId: string,
    model: string,
    maxTokens: number
  ): Promise<void> {
    return await this.triggerEvent('service.started', userId, {
      userId,
      requestId,
      service: 'mcp',
      model,
      maxTokens,
      startedAt: new Date().toISOString(),
    }, {
      source: 'mcp_start',
      requestId,
      model,
    });
  }

  /**
   * Check if webhook service is available
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.webhookServiceUrl}/internal/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.internalSecret}`,
          },
          timeout: 3000,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Webhook service health check failed:', error.message);
      return null;
    }
  }
}

export default new WebhookService();