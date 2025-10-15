import { Request, Response } from 'express';
import { webhookService } from '../services/webhook.service';
import { WebhookSuccessResponse, WebhookErrorResponse } from '../types/webhook.types';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import logger from '../config/logger';

export class WebhookController {
  /**
   * GET /api/v1/webhooks
   * List all webhooks for the authenticated user
   */
  async getWebhooks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      const webhooks = await webhookService.getWebhooks(req.user.id);

      const response: WebhookSuccessResponse = {
        success: true,
        data: webhooks,
        message: 'Webhooks retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get webhooks:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to retrieve webhooks',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/v1/webhooks
   * Create a new webhook endpoint
   */
  async createWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      const webhook = await webhookService.createWebhook(req.user.id, req.body);

      const response: WebhookSuccessResponse = {
        success: true,
        data: webhook,
        message: 'Webhook created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create webhook:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to create webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      if (error instanceof Error && error.message.includes('Invalid webhook URL')) {
        res.status(400).json(response);
      } else if (error instanceof Error && error.message.includes('Invalid event type')) {
        res.status(400).json(response);
      } else {
        res.status(500).json(response);
      }
    }
  }

  /**
   * GET /api/v1/webhooks/:id
   * Get webhook endpoint details
   */
  async getWebhookById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      const webhook = await webhookService.getWebhookById(req.user.id, req.params.id);

      if (!webhook) {
        const response: WebhookErrorResponse = {
          error: 'Webhook not found',
          message: 'The requested webhook does not exist',
        };
        res.status(404).json(response);
        return;
      }

      const response: WebhookSuccessResponse = {
        success: true,
        data: webhook,
        message: 'Webhook retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get webhook:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to retrieve webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(500).json(response);
    }
  }

  /**
   * PUT /api/v1/webhooks/:id
   * Update webhook endpoint
   */
  async updateWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      const webhook = await webhookService.updateWebhook(req.user.id, req.params.id, req.body);

      const response: WebhookSuccessResponse = {
        success: true,
        data: webhook,
        message: 'Webhook updated successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update webhook:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to update webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      if (error instanceof Error && error.message.includes('Webhook not found')) {
        res.status(404).json(response);
      } else if (error instanceof Error && error.message.includes('Invalid webhook URL')) {
        res.status(400).json(response);
      } else if (error instanceof Error && error.message.includes('Invalid event type')) {
        res.status(400).json(response);
      } else {
        res.status(500).json(response);
      }
    }
  }

  /**
   * DELETE /api/v1/webhooks/:id
   * Delete webhook endpoint
   */
  async deleteWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      await webhookService.deleteWebhook(req.user.id, req.params.id);

      const response: WebhookSuccessResponse = {
        success: true,
        data: null,
        message: 'Webhook deleted successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to delete webhook:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to delete webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      if (error instanceof Error && error.message.includes('Webhook not found')) {
        res.status(404).json(response);
      } else {
        res.status(500).json(response);
      }
    }
  }

  /**
   * POST /api/v1/webhooks/:id/test
   * Test webhook delivery
   */
  async testWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      const log = await webhookService.testWebhook(req.user.id, req.params.id, req.body);

      const response: WebhookSuccessResponse = {
        success: true,
        data: log,
        message: 'Webhook test completed',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to test webhook:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to test webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      if (error instanceof Error && error.message.includes('Webhook not found')) {
        res.status(404).json(response);
      } else if (error instanceof Error && error.message.includes('Invalid event type')) {
        res.status(400).json(response);
      } else {
        res.status(500).json(response);
      }
    }
  }

  /**
   * POST /api/v1/webhooks/:id/toggle
   * Enable/disable webhook
   */
  async toggleWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      const webhook = await webhookService.toggleWebhook(req.user.id, req.params.id);

      const response: WebhookSuccessResponse = {
        success: true,
        data: webhook,
        message: `Webhook ${webhook.isActive ? 'enabled' : 'disabled'} successfully`,
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to toggle webhook:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to toggle webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      if (error instanceof Error && error.message.includes('Webhook not found')) {
        res.status(404).json(response);
      } else {
        res.status(500).json(response);
      }
    }
  }

  /**
   * GET /api/v1/webhooks/:id/logs
   * Get webhook delivery logs
   */
  async getWebhookLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { logs, total } = await webhookService.getWebhookLogs(
        req.user.id,
        req.params.id,
        limit,
        offset
      );

      const response: WebhookSuccessResponse = {
        success: true,
        data: {
          logs,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
        message: 'Webhook logs retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get webhook logs:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to retrieve webhook logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      if (error instanceof Error && error.message.includes('Webhook not found')) {
        res.status(404).json(response);
      } else {
        res.status(500).json(response);
      }
    }
  }

  /**
   * GET /api/v1/webhooks/stats
   * Get webhook statistics
   */
  async getWebhookStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        const response: WebhookErrorResponse = {
          error: 'Authentication required',
          message: 'User authentication is required',
        };
        res.status(401).json(response);
        return;
      }

      const stats = await webhookService.getWebhookStats(req.user.id);

      const response: WebhookSuccessResponse = {
        success: true,
        data: stats,
        message: 'Webhook statistics retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get webhook stats:', error);

      const response: WebhookErrorResponse = {
        error: 'Failed to retrieve webhook statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      res.status(500).json(response);
    }
  }
}

export const webhookController = new WebhookController();
