import nock from 'nock';
import { WebhookDeliveryService } from '../../services/webhook-delivery.service';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bull';
import { generateSignature } from '../../utils/signature';

// Mock dependencies
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockQueue = new Queue('test') as jest.Mocked<Queue>;

describe('WebhookDeliveryService Integration Tests', () => {
  let webhookDeliveryService: WebhookDeliveryService;
  const webhookUrl = 'https://example.com/webhook';
  const webhookSecret = 'test-secret';
  const eventType = 'user.created';
  const payload = {
    userId: 'user_123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    webhookDeliveryService = new WebhookDeliveryService(mockPrisma, mockQueue);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Successful Webhook Delivery', () => {
    it('should deliver webhook successfully', async () => {
      const scope = nock('https://example.com')
        .post('/webhook')
        .matchHeader('content-type', 'application/json')
        .matchHeader('x-webhook-signature', (value) => {
          // Verify signature format
          return typeof value === 'string' && value.startsWith('sha256=');
        })
        .matchHeader('user-agent', (value) => {
          // Verify user agent contains Smart-AI-Hub
          return typeof value === 'string' && value.includes('Smart-AI-Hub');
        })
        .reply(200, { success: true });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      const result = await webhookDeliveryService.processWebhookDelivery(jobData);

      expect(scope.isDone()).toBe(true);
      expect(result.success).toBe(true);
      expect(result.responseStatus).toBe(200);
    });

    it('should include correct payload and signature', async () => {
      let receivedPayload: any;
      let receivedSignature: string;

      const scope = nock('https://example.com')
        .post('/webhook')
        .reply(200, function (uri, requestBody) {
          receivedPayload = JSON.parse(requestBody as string);
          receivedSignature = this.req.headers['x-webhook-signature'] as string;
          return { success: true };
        });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      await webhookDeliveryService.processWebhookDelivery(jobData);

      // Verify payload structure
      expect(receivedPayload).toHaveProperty('id');
      expect(receivedPayload).toHaveProperty('eventType', eventType);
      expect(receivedPayload).toHaveProperty('data', payload);
      expect(receivedPayload).toHaveProperty('metadata');
      expect(receivedPayload.metadata).toHaveProperty('timestamp');
      expect(receivedPayload.metadata).toHaveProperty('webhookId', 'webhook_123');

      // Verify signature
      const expectedSignature = generateSignature(JSON.stringify(receivedPayload), webhookSecret);
      expect(receivedSignature).toBe(expectedSignature);

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('Webhook Delivery Failures', () => {
    it('should handle HTTP error responses', async () => {
      const scope = nock('https://example.com')
        .post('/webhook')
        .reply(400, { error: 'Bad request' });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      const result = await webhookDeliveryService.processWebhookDelivery(jobData);

      expect(scope.isDone()).toBe(true);
      expect(result.success).toBe(false);
      expect(result.responseStatus).toBe(400);
      expect(result.errorMessage).toContain('HTTP 400');
    });

    it('should handle network timeouts', async () => {
      const scope = nock('https://example.com')
        .post('/webhook')
        .delayConnection(11000) // 11 seconds delay (longer than 10 second timeout)
        .reply(200, { success: true });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      const result = await webhookDeliveryService.processWebhookDelivery(jobData);

      expect(scope.isDone()).toBe(false); // Request should timeout
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('timeout');
    });

    it('should handle DNS resolution failures', async () => {
      const jobData = {
        webhookId: 'webhook_123',
        url: 'https://nonexistent-domain.example.com/webhook',
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      const result = await webhookDeliveryService.processWebhookDelivery(jobData);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('ENOTFOUND');
    });

    it('should handle connection refused errors', async () => {
      const scope = nock('https://example.com').post('/webhook').replyWithError('ECONNREFUSED');

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      const result = await webhookDeliveryService.processWebhookDelivery(jobData);

      expect(scope.isDone()).toBe(true);
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('ECONNREFUSED');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed webhook delivery', async () => {
      // First attempt fails
      const scope1 = nock('https://example.com')
        .post('/webhook')
        .reply(500, { error: 'Internal server error' });

      // Second attempt succeeds
      const scope2 = nock('https://example.com').post('/webhook').reply(200, { success: true });

      // First attempt
      const jobData1 = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      const result1 = await webhookDeliveryService.processWebhookDelivery(jobData1);

      expect(scope1.isDone()).toBe(true);
      expect(result1.success).toBe(false);
      expect(result1.responseStatus).toBe(500);

      // Verify retry job was added to queue
      expect(mockQueue.add).toHaveBeenCalledWith(
        'webhook-delivery',
        expect.objectContaining({
          webhookId: 'webhook_123',
          url: webhookUrl,
          secret: webhookSecret,
          eventType,
          data: payload,
          attempt: 2,
          maxAttempts: 3,
        }),
        expect.objectContaining({
          delay: 60000, // 1 minute delay for first retry
        })
      );
    });

    it('should not retry after max attempts', async () => {
      const scope = nock('https://example.com')
        .post('/webhook')
        .reply(500, { error: 'Internal server error' });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 3, // Max attempt
        maxAttempts: 3,
      };

      const result = await webhookDeliveryService.processWebhookDelivery(jobData);

      expect(scope.isDone()).toBe(true);
      expect(result.success).toBe(false);
      expect(result.responseStatus).toBe(500);

      // Verify no retry job was added
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('Webhook Logging', () => {
    it('should log successful delivery', async () => {
      const scope = nock('https://example.com').post('/webhook').reply(200, { success: true });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      await webhookDeliveryService.processWebhookDelivery(jobData);

      // Verify log was created
      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          webhookId: 'webhook_123',
          eventType,
          payload: expect.objectContaining({
            id: expect.any(String),
            eventType,
            data: payload,
            metadata: expect.objectContaining({
              webhookId: 'webhook_123',
              attempt: 1,
            }),
          }),
          responseStatus: 200,
          responseBody: JSON.stringify({ success: true }),
          attempt: 1,
          maxAttempts: 3,
          status: 'delivered',
          deliveredAt: expect.any(Date),
        }),
      });

      expect(scope.isDone()).toBe(true);
    });

    it('should log failed delivery', async () => {
      const scope = nock('https://example.com')
        .post('/webhook')
        .reply(400, { error: 'Bad request' });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      await webhookDeliveryService.processWebhookDelivery(jobData);

      // Verify log was created
      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          webhookId: 'webhook_123',
          eventType,
          payload: expect.any(Object),
          responseStatus: 400,
          responseBody: JSON.stringify({ error: 'Bad request' }),
          attempt: 1,
          maxAttempts: 3,
          status: 'failed',
          errorMessage: expect.stringContaining('HTTP 400'),
        }),
      });

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('Security', () => {
    it('should include security headers', async () => {
      let receivedHeaders: any;

      const scope = nock('https://example.com')
        .post('/webhook')
        .reply(200, function (uri, requestBody) {
          receivedHeaders = this.req.headers;
          return { success: true };
        });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      await webhookDeliveryService.processWebhookDelivery(jobData);

      // Verify security headers
      expect(receivedHeaders['content-type']).toBe('application/json');
      expect(receivedHeaders['x-webhook-signature']).toMatch(/^sha256=[a-f0-9]{64}$/);
      expect(receivedHeaders['user-agent']).toContain('Smart-AI-Hub');

      expect(scope.isDone()).toBe(true);
    });

    it('should not send sensitive data in headers', async () => {
      let receivedHeaders: any;

      const scope = nock('https://example.com')
        .post('/webhook')
        .reply(200, function (uri, requestBody) {
          receivedHeaders = this.req.headers;
          return { success: true };
        });

      const jobData = {
        webhookId: 'webhook_123',
        url: webhookUrl,
        secret: webhookSecret,
        eventType,
        data: payload,
        attempt: 1,
        maxAttempts: 3,
      };

      await webhookDeliveryService.processWebhookDelivery(jobData);

      // Verify secret is not in headers
      expect(receivedHeaders['x-webhook-secret']).toBeUndefined();
      expect(receivedHeaders['authorization']).toBeUndefined();
      expect(receivedHeaders['x-api-key']).toBeUndefined();

      expect(scope.isDone()).toBe(true);
    });
  });
});
