import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis';

// Set environment variables for tests
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_testing';

const prisma = new PrismaClient();

describe('Sora2 Credit Management Endpoints', () => {
  let testUser: any;
  let testRole: any;

  beforeAll(async () => {
    // Create test role
    testRole = await prisma.role.upsert({
      where: { name: 'test-user' },
      update: {},
      create: {
        name: 'test-user',
        description: 'Test user role for Sora2 integration',
      },
    });

    // Create test user with credit account
    testUser = await prisma.user.upsert({
      where: { email: 'sora2-test@example.com' },
      update: {},
      create: {
        email: 'sora2-test@example.com',
        passwordHash: 'test-password',
        profile: {
          create: {
            firstName: 'Sora2',
            lastName: 'Test User',
          },
        },
        creditAccount: {
          create: {
            balance: 100,
          },
        },
        userRoles: {
          create: {
            roleId: testRole.id,
          },
        },
      },
      include: {
        creditAccount: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.creditTransaction.deleteMany({
      where: { userId: testUser.id },
    });

    await prisma.creditAccount.delete({
      where: { userId: testUser.id },
    });

    await prisma.userRole.deleteMany({
      where: { userId: testUser.id },
    });

    await prisma.user.delete({
      where: { id: testUser.id },
    });

    await prisma.role.delete({
      where: { id: testRole.id },
    });

    await prisma.$disconnect();
    await redisClient.quit();
  });

  describe('POST /api/mcp/v1/credits/check', () => {
    it('should return 200 with sufficient credits', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/check')
        .set('X-User-ID', testUser.id)
        .send({
          service: 'sora2-video-generation',
          cost: 30,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        sufficient: true,
        balance: 100,
      });
    });

    it('should return 200 with insufficient credits', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/check')
        .set('X-User-ID', testUser.id)
        .send({
          service: 'sora2-video-generation',
          cost: 150,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        sufficient: false,
        balance: 100,
      });
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/check')
        .set('X-User-ID', 'non-existent-user-id')
        .send({
          service: 'sora2-video-generation',
          cost: 30,
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found',
      });
    });

    it('should return 400 when X-User-ID header is missing', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/check')
        .send({
          service: 'sora2-video-generation',
          cost: 30,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User ID required',
      });
    });

    it('should return 400 when request body is missing', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/check')
        .set('X-User-ID', testUser.id)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Service and cost are required',
      });
    });

    it('should return 400 when cost is negative', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/check')
        .set('X-User-ID', testUser.id)
        .send({
          service: 'sora2-video-generation',
          cost: -10,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Cost must be a positive number',
      });
    });
  });

  describe('POST /api/mcp/v1/credits/deduct', () => {
    it('should successfully deduct credits and create transaction', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/deduct')
        .set('X-User-ID', testUser.id)
        .send({
          service: 'sora2-video-generation',
          cost: 30,
          metadata: {
            videoId: 'test-video-123',
            duration: 60,
            resolution: '1080p',
          },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        new_balance: 70,
      });
      expect(response.body).toHaveProperty('transaction_id');

      // Verify transaction was created
      const transaction = await prisma.creditTransaction.findUnique({
        where: { id: response.body.transaction_id },
      });

      expect(transaction).toMatchObject({
        userId: testUser.id,
        amount: -30,
        type: 'usage',
        description: 'sora2-video-generation',
      });

      // Verify credit account was updated
      const updatedAccount = await prisma.creditAccount.findUnique({
        where: { userId: testUser.id },
      });

      expect(updatedAccount?.balance).toBe(70);
    });

    it('should return 402 when insufficient credits', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/deduct')
        .set('X-User-ID', testUser.id)
        .send({
          service: 'sora2-video-generation',
          cost: 100, // More than remaining balance (70)
          metadata: {},
        })
        .expect(402);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Insufficient credits',
      });
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/deduct')
        .set('X-User-ID', 'non-existent-user-id')
        .send({
          service: 'sora2-video-generation',
          cost: 30,
          metadata: {},
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found',
      });
    });

    it('should return 400 when X-User-ID header is missing', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/deduct')
        .send({
          service: 'sora2-video-generation',
          cost: 30,
          metadata: {},
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User ID required',
      });
    });

    it('should return 400 when request body is missing required fields', async () => {
      const response = await request(app)
        .post('/api/mcp/v1/credits/deduct')
        .set('X-User-ID', testUser.id)
        .send({
          service: 'sora2-video-generation',
          // Missing cost and metadata
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Service, cost, and metadata are required',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error by disconnecting
      await prisma.$disconnect();

      const response = await request(app)
        .post('/api/mcp/v1/credits/deduct')
        .set('X-User-ID', testUser.id)
        .send({
          service: 'sora2-video-generation',
          cost: 30,
          metadata: {},
        })
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Internal server error',
      });

      // Reconnect for cleanup
      await prisma.$connect();
    });
  });
});
