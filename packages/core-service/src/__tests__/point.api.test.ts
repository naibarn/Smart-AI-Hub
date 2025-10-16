import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Points API', () => {
  let authToken: string;
  let testUserId: string;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'point-test@example.com',
        passwordHash: 'hashedpassword',
        verified: true,
        points: 1000,
        credits: 10,
      },
    });
    testUserId = testUser.id;

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'point-admin@example.com',
        passwordHash: 'hashedpassword',
        verified: true,
        tier: 'admin',
        points: 5000,
        credits: 100,
      },
    });
    adminUserId = adminUser.id;

    // Create point accounts
    await prisma.pointAccount.create({
      data: {
        userId: testUserId,
        balance: 1000,
      },
    });

    await prisma.pointAccount.create({
      data: {
        userId: adminUserId,
        balance: 5000,
      },
    });

    // Generate mock tokens (in a real app, these would be JWT tokens)
    authToken = 'mock-user-token';
    adminToken = 'mock-admin-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.pointTransaction.deleteMany({
      where: { userId: { in: [testUserId, adminUserId] } },
    });
    await prisma.pointAccount.deleteMany({
      where: { userId: { in: [testUserId, adminUserId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, adminUserId] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/points/balance', () => {
    it('should return points balance for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/points/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('balance');
      expect(typeof response.body.data.balance).toBe('number');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/points/balance');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/points/history', () => {
    it('should return paginated transaction history', async () => {
      const response = await request(app)
        .get('/api/v1/points/history?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/points/history?page=0&limit=101')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/points/exchange-from-credits', () => {
    it('should exchange credits to points', async () => {
      const response = await request(app)
        .post('/api/v1/points/exchange-from-credits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ creditAmount: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('newPointBalance');
      expect(response.body.data).toHaveProperty('newCreditBalance');
      expect(response.body.data).toHaveProperty('pointsReceived');
    });

    it('should validate credit amount', async () => {
      const response = await request(app)
        .post('/api/v1/points/exchange-from-credits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ creditAmount: -5 });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/points/purchase', () => {
    it('should purchase points with valid payment', async () => {
      const response = await request(app)
        .post('/api/v1/points/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pointsAmount: 1000,
          paymentDetails: {
            stripeSessionId: 'sess_test123',
            amount: 10,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('newBalance');
      expect(response.body.data).toHaveProperty('transactionId');
    });

    it('should validate purchase parameters', async () => {
      const response = await request(app)
        .post('/api/v1/points/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pointsAmount: -1000,
          paymentDetails: {
            stripeSessionId: 'sess_test123',
            amount: 10,
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/points/claim-daily-reward', () => {
    it('should claim daily reward', async () => {
      const response = await request(app)
        .post('/api/v1/points/claim-daily-reward')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('points');
      expect(response.body.data).toHaveProperty('message');
    });

    it('should prevent claiming twice in one day', async () => {
      // First claim
      await request(app)
        .post('/api/v1/points/claim-daily-reward')
        .set('Authorization', `Bearer ${authToken}`);

      // Second claim should fail
      const response = await request(app)
        .post('/api/v1/points/claim-daily-reward')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/points/daily-reward-status', () => {
    it('should return daily reward status', async () => {
      const response = await request(app)
        .get('/api/v1/points/daily-reward-status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('canClaim');
      expect(response.body.data).toHaveProperty('rewardAmount');
    });
  });

  describe('GET /api/v1/wallet/balance', () => {
    it('should return both credits and points balance', async () => {
      const response = await request(app)
        .get('/api/v1/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('credits');
      expect(response.body.data).toHaveProperty('points');
    });
  });

  describe('POST /api/v1/mcp/points/deduct', () => {
    it('should deduct points with service authentication', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/points/deduct')
        .set('X-User-ID', testUserId)
        .set('X-Service-Token', 'mock-service-token')
        .send({
          amount: 100,
          description: 'Test deduction',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('new_balance');
      expect(response.body).toHaveProperty('transaction_id');
    });

    it('should require authentication headers', async () => {
      const response = await request(app)
        .post('/api/v1/mcp/points/deduct')
        .send({
          amount: 100,
          description: 'Test deduction',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Admin endpoints', () => {
    describe('POST /api/v1/admin/points/adjust', () => {
      it('should adjust user points for admin', async () => {
        const response = await request(app)
          .post('/api/v1/admin/points/adjust')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: testUserId,
            amount: 500,
            reason: 'Test adjustment',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('newBalance');
      });

      it('should require admin authentication', async () => {
        const response = await request(app)
          .post('/api/v1/admin/points/adjust')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            userId: testUserId,
            amount: 500,
            reason: 'Test adjustment',
          });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/v1/admin/exchange-rates', () => {
      it('should return all exchange rates for admin', async () => {
        const response = await request(app)
          .get('/api/v1/admin/exchange-rates')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('PUT /api/v1/admin/exchange-rates/:name', () => {
      it('should update exchange rate for admin', async () => {
        const response = await request(app)
          .put('/api/v1/admin/exchange-rates/credit_to_points')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            rate: 1200,
            description: 'Updated rate',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.rate).toEqual({ rate: 1200 });
      });
    });

    describe('GET /api/v1/admin/points/stats', () => {
      it('should return points statistics for admin', async () => {
        const response = await request(app)
          .get('/api/v1/admin/points/stats')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalPoints');
        expect(response.body.data).toHaveProperty('totalUsers');
        expect(response.body.data).toHaveProperty('activeUsers');
        expect(response.body.data).toHaveProperty('averageBalance');
        expect(response.body.data).toHaveProperty('totalTransactions');
      });
    });

    describe('GET /api/v1/admin/auto-topup/stats', () => {
      it('should return auto top-up statistics for admin', async () => {
        const response = await request(app)
          .get('/api/v1/admin/auto-topup/stats')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalAutoTopups');
        expect(response.body.data).toHaveProperty('totalCreditsConverted');
        expect(response.body.data).toHaveProperty('totalPointsGenerated');
        expect(response.body.data).toHaveProperty('recentAutoTopups');
      });
    });
  });
});