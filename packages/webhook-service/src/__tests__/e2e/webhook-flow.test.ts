import request from 'supertest';
import nock from 'nock';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import { generateSignature } from '../../utils/signature';

// Mock dependencies
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Webhook E2E Tests', () => {
  const authToken = 'Bearer valid-jwt-token';
  const userId = 'user_123';
  const webhookUrl = 'https://example.com/webhook';
  const webhookSecret = 'test-secret';

  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();

    // Mock authentication middleware
    jest.doMock('../../middleware/auth.middleware', () => ({
      authenticateToken: (req: any, res: any, next: any) => {
        req.user = { id: userId, email: 'test@example.com' };
        next();
      },
      authenticateInternal: (req: any, res: any, next: any) => {
        req.service = { name: 'auth-service', secret: 'internal-secret' };
        next();
      },
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('Complete Webhook Flow', () => {
    it('should create webhook, trigger event, and deliver successfully', async () => {
      // Step 1: Create webhook
      const createWebhookData = {
        url: webhookUrl,
        eventTypes: ['user.created'],
        secret: webhookSecret,
      };

      const createdWebhook = {
        id: 'webhook_123',
        ...createWebhookData,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.create.mockResolvedValue(createdWebhook);

      const createResponse = await request(app)
        .post('/api/v1/webhooks')
        .set('Authorization', authToken)
        .send(createWebhookData)
        .expect(201);

      expect(createResponse.body).toEqual(createdWebhook);

      // Step 2: Trigger webhook event via internal endpoint
      const eventData = {
        eventType: 'user.created',
        data: {
          userId: 'user_456',
          email: 'newuser@example.com',
          name: 'New User',
        },
      };

      // Mock webhook endpoint to receive the event
      const webhookScope = nock('https://example.com')
        .post('/webhook')
        .matchHeader('x-webhook-signature', (value) => {
          return typeof value === 'string' && value.startsWith('sha256=');
        })
        .reply(200, { success: true });

      // Mock finding webhooks for the event
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([createdWebhook]);

      const triggerResponse = await request(app)
        .post('/api/internal/webhooks/trigger')
        .send(eventData)
        .expect(200);

      expect(triggerResponse.body).toEqual({
        success: true,
        message: 'Webhook events triggered',
        triggered: 1,
      });

      // Step 3: Verify webhook was delivered
      expect(webhookScope.isDone()).toBe(true);

      // Step 4: Check webhook logs
      const mockLogs = [
        {
          id: 'log_123',
          webhookId: createdWebhook.id,
          eventType: eventData.eventType,
          payload: expect.any(Object),
          responseStatus: 200,
          responseBody: JSON.stringify({ success: true }),
          attempt: 1,
          maxAttempts: 3,
          status: 'delivered',
          createdAt: new Date(),
          deliveredAt: new Date(),
        },
      ];

      mockPrisma.webhookLog.findMany.mockResolvedValue(mockLogs);

      const logsResponse = await request(app)
        .get(`/api/v1/webhooks/${createdWebhook.id}/logs`)
        .set('Authorization', authToken)
        .expect(200);

      expect(logsResponse.body.logs).toEqual(mockLogs);
      expect(logsResponse.body.total).toBe(1);
    });

    it('should handle webhook creation with validation errors', async () => {
      const invalidWebhookData = {
        url: 'invalid-url',
        eventTypes: [],
        secret: '',
      };

      const response = await request(app)
        .post('/api/v1/webhooks')
        .set('Authorization', authToken)
        .send(invalidWebhookData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
    });

    it('should handle webhook delivery failure and retry', async () => {
      // Create webhook
      const createdWebhook = {
        id: 'webhook_123',
        url: webhookUrl,
        eventTypes: ['user.created'],
        secret: webhookSecret,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.create.mockResolvedValue(createdWebhook);

      const createResponse = await request(app)
        .post('/api/v1/webhooks')
        .set('Authorization', authToken)
        .send({
          url: webhookUrl,
          eventTypes: ['user.created'],
          secret: webhookSecret,
        })
        .expect(201);

      // Trigger event that will fail
      const eventData = {
        eventType: 'user.created',
        data: { userId: 'user_456' },
      };

      // Mock webhook endpoint to return error
      const webhookScope = nock('https://example.com')
        .post('/webhook')
        .reply(500, { error: 'Internal server error' });

      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([createdWebhook]);

      const triggerResponse = await request(app)
        .post('/api/internal/webhooks/trigger')
        .send(eventData)
        .expect(200);

      expect(triggerResponse.body.triggered).toBe(1);
      expect(webhookScope.isDone()).toBe(true);

      // Verify failed log was created
      const mockFailedLog = {
        id: 'log_123',
        webhookId: createdWebhook.id,
        eventType: eventData.eventType,
        payload: expect.any(Object),
        responseStatus: 500,
        responseBody: JSON.stringify({ error: 'Internal server error' }),
        attempt: 1,
        maxAttempts: 3,
        status: 'failed',
        errorMessage: expect.stringContaining('HTTP 500'),
        createdAt: new Date(),
      };

      mockPrisma.webhookLog.findMany.mockResolvedValue([mockFailedLog]);

      const logsResponse = await request(app)
        .get(`/api/v1/webhooks/${createdWebhook.id}/logs`)
        .set('Authorization', authToken)
        .expect(200);

      expect(logsResponse.body.logs[0].status).toBe('failed');
      expect(logsResponse.body.logs[0].responseStatus).toBe(500);
    });
  });

  describe('Webhook Management', () => {
    it('should list all webhooks for a user', async () => {
      const webhooks = [
        {
          id: 'webhook_1',
          url: 'https://example.com/webhook1',
          eventTypes: ['user.created'],
          secret: 'secret1',
          userId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'webhook_2',
          url: 'https://example.com/webhook2',
          eventTypes: ['user.updated'],
          secret: 'secret2',
          userId,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.webhookEndpoint.findMany.mockResolvedValue(webhooks);

      const response = await request(app)
        .get('/api/v1/webhooks')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toEqual(webhooks);
    });

    it('should get a specific webhook', async () => {
      const webhook = {
        id: 'webhook_123',
        url: webhookUrl,
        eventTypes: ['user.created'],
        secret: webhookSecret,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.findUnique.mockResolvedValue(webhook);

      const response = await request(app)
        .get(`/api/v1/webhooks/${webhook.id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toEqual(webhook);
    });

    it('should update a webhook', async () => {
      const webhook = {
        id: 'webhook_123',
        url: webhookUrl,
        eventTypes: ['user.created'],
        secret: webhookSecret,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        url: 'https://updated.example.com/webhook',
        eventTypes: ['user.created', 'user.updated'],
      };

      const updatedWebhook = {
        ...webhook,
        ...updateData,
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.update.mockResolvedValue(updatedWebhook);

      const response = await request(app)
        .put(`/api/v1/webhooks/${webhook.id}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedWebhook);
    });

    it('should delete a webhook', async () => {
      const webhook = {
        id: 'webhook_123',
        url: webhookUrl,
        eventTypes: ['user.created'],
        secret: webhookSecret,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.delete.mockResolvedValue(webhook);

      const response = await request(app)
        .delete(`/api/v1/webhooks/${webhook.id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toEqual(webhook);
    });

    it('should toggle webhook active status', async () => {
      const webhook = {
        id: 'webhook_123',
        url: webhookUrl,
        eventTypes: ['user.created'],
        secret: webhookSecret,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const toggledWebhook = {
        ...webhook,
        isActive: false,
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.findUnique.mockResolvedValue(webhook);
      mockPrisma.webhookEndpoint.update.mockResolvedValue(toggledWebhook);

      const response = await request(app)
        .post(`/api/v1/webhooks/${webhook.id}/toggle`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it('should test a webhook', async () => {
      const webhook = {
        id: 'webhook_123',
        url: webhookUrl,
        eventTypes: ['user.created'],
        secret: webhookSecret,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testData = {
        eventType: 'user.created',
        data: { test: true },
      };

      // Mock webhook endpoint
      const webhookScope = nock('https://example.com')
        .post('/webhook')
        .reply(200, { success: true });

      mockPrisma.webhookEndpoint.findUnique.mockResolvedValue(webhook);

      const response = await request(app)
        .post(`/api/v1/webhooks/${webhook.id}/test`)
        .set('Authorization', authToken)
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(webhookScope.isDone()).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app).get('/api/v1/webhooks').expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with invalid authentication', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject internal requests without proper authentication', async () => {
      const response = await request(app)
        .post('/api/internal/webhooks/trigger')
        .send({ eventType: 'user.created', data: {} })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate webhook URL format', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        'http://localhost/local',
        'javascript:alert(1)',
      ];

      for (const url of invalidUrls) {
        const response = await request(app)
          .post('/api/v1/webhooks')
          .set('Authorization', authToken)
          .send({
            url,
            eventTypes: ['user.created'],
            secret: 'test-secret',
          })
          .expect(400);

        expect(response.body.error).toContain('Invalid webhook URL');
      }
    });

    it('should validate event types', async () => {
      const invalidEventTypes = ['invalid-event', 'user.invalid', 'invalid.created', ''];

      for (const eventType of invalidEventTypes) {
        const response = await request(app)
          .post('/api/internal/webhooks/trigger')
          .send({
            eventType,
            data: {},
          })
          .expect(400);

        expect(response.body.error).toContain('Invalid event type');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to webhook endpoints', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get('/api/v1/webhooks').set('Authorization', authToken));

      const responses = await Promise.all(requests);

      // At least one request should be rate limited
      const rateLimitedResponse = responses.find((res) => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse?.body).toHaveProperty('error');
    });
  });
});
