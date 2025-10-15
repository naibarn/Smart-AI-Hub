import { WebhookService } from '../../services/webhook.service';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bull';

// Mock dependencies
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockQueue = new Queue('test') as jest.Mocked<Queue>;

describe('WebhookService', () => {
  let webhookService: WebhookService;
  const mockUserId = 'user_123';

  beforeEach(() => {
    jest.clearAllMocks();
    webhookService = new WebhookService(mockPrisma, mockQueue);
  });

  describe('createWebhook', () => {
    const webhookData = {
      url: 'https://example.com/webhook',
      eventTypes: ['user.created', 'user.updated'],
      secret: 'test-secret',
    };

    it('should create a webhook successfully', async () => {
      const expectedWebhook = {
        id: 'webhook_123',
        ...webhookData,
        userId: mockUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.create.mockResolvedValue(expectedWebhook);

      const result = await webhookService.createWebhook(webhookData, mockUserId);

      expect(mockPrisma.webhookEndpoint.create).toHaveBeenCalledWith({
        data: {
          ...webhookData,
          userId: mockUserId,
        },
      });
      expect(result).toEqual(expectedWebhook);
    });

    it('should throw error when database fails', async () => {
      const error = new Error('Database error');
      mockPrisma.webhookEndpoint.create.mockRejectedValue(error);

      await expect(webhookService.createWebhook(webhookData, mockUserId))
        .rejects.toThrow('Database error');
    });

    it('should validate webhook URL format', async () => {
      const invalidWebhookData = {
        ...webhookData,
        url: 'invalid-url',
      };

      await expect(webhookService.createWebhook(invalidWebhookData, mockUserId))
        .rejects.toThrow('Invalid webhook URL');
    });
  });

  describe('getWebhooks', () => {
    it('should return webhooks for a user', async () => {
      const expectedWebhooks = [
        {
          id: 'webhook_1',
          url: 'https://example.com/webhook1',
          eventTypes: ['user.created'],
          secret: 'secret1',
          userId: mockUserId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'webhook_2',
          url: 'https://example.com/webhook2',
          eventTypes: ['user.updated'],
          secret: 'secret2',
          userId: mockUserId,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.webhookEndpoint.findMany.mockResolvedValue(expectedWebhooks);

      const result = await webhookService.getWebhooks(mockUserId);

      expect(mockPrisma.webhookEndpoint.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedWebhooks);
    });

    it('should return empty array when no webhooks exist', async () => {
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([]);

      const result = await webhookService.getWebhooks(mockUserId);

      expect(result).toEqual([]);
    });

    it('should throw error when database fails', async () => {
      const error = new Error('Database error');
      mockPrisma.webhookEndpoint.findMany.mockRejectedValue(error);

      await expect(webhookService.getWebhooks(mockUserId))
        .rejects.toThrow('Database error');
    });
  });

  describe('getWebhookById', () => {
    const webhookId = 'webhook_123';

    it('should return webhook when found', async () => {
      const expectedWebhook = {
        id: webhookId,
        url: 'https://example.com/webhook',
        eventTypes: ['user.created'],
        secret: 'secret',
        userId: mockUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.findUnique.mockResolvedValue(expectedWebhook);

      const result = await webhookService.getWebhookById(webhookId, mockUserId);

      expect(mockPrisma.webhookEndpoint.findUnique).toHaveBeenCalledWith({
        where: { id: webhookId },
      });
      expect(result).toEqual(expectedWebhook);
    });

    it('should return null when webhook not found', async () => {
      mockPrisma.webhookEndpoint.findUnique.mockResolvedValue(null);

      const result = await webhookService.getWebhookById('nonexistent', mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error when database fails', async () => {
      const error = new Error('Database error');
      mockPrisma.webhookEndpoint.findUnique.mockRejectedValue(error);

      await expect(webhookService.getWebhookById(webhookId, mockUserId))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateWebhook', () => {
    const webhookId = 'webhook_123';
    const updateData = {
      url: 'https://updated.example.com/webhook',
      eventTypes: ['user.created', 'user.deleted'],
    };

    it('should update webhook successfully', async () => {
      const expectedWebhook = {
        id: webhookId,
        ...updateData,
        secret: 'original-secret',
        userId: mockUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.update.mockResolvedValue(expectedWebhook);

      const result = await webhookService.updateWebhook(webhookId, updateData, mockUserId);

      expect(mockPrisma.webhookEndpoint.update).toHaveBeenCalledWith({
        where: { id: webhookId },
        data: updateData,
      });
      expect(result).toEqual(expectedWebhook);
    });

    it('should throw error when webhook not found', async () => {
      const error = new Error('Webhook not found');
      mockPrisma.webhookEndpoint.update.mockRejectedValue(error);

      await expect(webhookService.updateWebhook(webhookId, updateData, mockUserId))
        .rejects.toThrow('Webhook not found');
    });

    it('should validate webhook URL format', async () => {
      const invalidUpdateData = {
        ...updateData,
        url: 'invalid-url',
      };

      await expect(webhookService.updateWebhook(webhookId, invalidUpdateData, mockUserId))
        .rejects.toThrow('Invalid webhook URL');
    });
  });

  describe('deleteWebhook', () => {
    const webhookId = 'webhook_123';

    it('should delete webhook successfully', async () => {
      const expectedWebhook = {
        id: webhookId,
        url: 'https://example.com/webhook',
        eventTypes: ['user.created'],
        secret: 'secret',
        userId: mockUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.delete.mockResolvedValue(expectedWebhook);

      const result = await webhookService.deleteWebhook(webhookId, mockUserId);

      expect(mockPrisma.webhookEndpoint.delete).toHaveBeenCalledWith({
        where: { id: webhookId },
      });
      expect(result).toEqual(expectedWebhook);
    });

    it('should throw error when webhook not found', async () => {
      const error = new Error('Webhook not found');
      mockPrisma.webhookEndpoint.delete.mockRejectedValue(error);

      await expect(webhookService.deleteWebhook(webhookId, mockUserId))
        .rejects.toThrow('Webhook not found');
    });
  });

  describe('toggleWebhook', () => {
    const webhookId = 'webhook_123';

    it('should toggle webhook to inactive', async () => {
      const currentWebhook = {
        id: webhookId,
        url: 'https://example.com/webhook',
        eventTypes: ['user.created'],
        secret: 'secret',
        userId: mockUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedWebhook = {
        ...currentWebhook,
        isActive: false,
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.findUnique.mockResolvedValue(currentWebhook);
      mockPrisma.webhookEndpoint.update.mockResolvedValue(updatedWebhook);

      const result = await webhookService.toggleWebhook(webhookId, mockUserId);

      expect(mockPrisma.webhookEndpoint.update).toHaveBeenCalledWith({
        where: { id: webhookId },
        data: { isActive: false },
      });
      expect(result).toEqual(updatedWebhook);
    });

    it('should toggle webhook to active', async () => {
      const currentWebhook = {
        id: webhookId,
        url: 'https://example.com/webhook',
        eventTypes: ['user.created'],
        secret: 'secret',
        userId: mockUserId,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedWebhook = {
        ...currentWebhook,
        isActive: true,
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.findUnique.mockResolvedValue(currentWebhook);
      mockPrisma.webhookEndpoint.update.mockResolvedValue(updatedWebhook);

      const result = await webhookService.toggleWebhook(webhookId, mockUserId);

      expect(mockPrisma.webhookEndpoint.update).toHaveBeenCalledWith({
        where: { id: webhookId },
        data: { isActive: true },
      });
      expect(result).toEqual(updatedWebhook);
    });

    it('should throw error when webhook not found', async () => {
      mockPrisma.webhookEndpoint.findUnique.mockResolvedValue(null);

      await expect(webhookService.toggleWebhook(webhookId, mockUserId))
        .rejects.toThrow('Webhook not found');
    });
  });

  describe('triggerWebhook', () => {
    const webhookId = 'webhook_123';
    const eventData = {
      eventType: 'user.created',
      data: { userId: 'user_456', email: 'test@example.com' },
    };

    it('should add webhook job to queue', async () => {
      const webhook = {
        id: webhookId,
        url: 'https://example.com/webhook',
        eventTypes: ['user.created'],
        secret: 'secret',
        userId: mockUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([webhook]);
      mockQueue.add.mockResolvedValue({ id: 'job_123' } as any);

      await webhookService.triggerWebhook(eventData.eventType, eventData.data);

      expect(mockPrisma.webhookEndpoint.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          eventTypes: {
            has: eventData.eventType,
          },
        },
      });

      expect(mockQueue.add).toHaveBeenCalledWith('webhook-delivery', {
        webhookId: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        eventType: eventData.eventType,
        data: eventData.data,
        attempt: 1,
        maxAttempts: 3,
      });
    });

    it('should not queue jobs when no matching webhooks found', async () => {
      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([]);

      await webhookService.triggerWebhook(eventData.eventType, eventData.data);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should handle queue errors gracefully', async () => {
      const webhook = {
        id: webhookId,
        url: 'https://example.com/webhook',
        eventTypes: ['user.created'],
        secret: 'secret',
        userId: mockUserId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.webhookEndpoint.findMany.mockResolvedValue([webhook]);
      mockQueue.add.mockRejectedValue(new Error('Queue error'));

      // Should not throw error, just log it
      await expect(webhookService.triggerWebhook(eventData.eventType, eventData.data))
        .resolves.toBeUndefined();
    });
  });
});