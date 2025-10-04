process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
import { PaymentService } from '../services/payment.service';
import { stripe } from '../config/stripe.config';
import { createMockPrismaClient } from '../__mocks__/prisma.mock';

const prisma = createMockPrismaClient();

jest.mock('../config/stripe.config', () => {
  const originalModule = jest.requireActual('../config/stripe.config');
  return {
    ...originalModule,
    stripe: {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    },
  };
});

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let prisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    prisma = createMockPrismaClient();
    paymentService = new PaymentService(prisma as any);
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a Stripe checkout session', async () => {
      const mockSession = { id: 'cs_test_123' };
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const session = await paymentService.createCheckoutSession('user_123', 'starter');

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          mode: 'payment',
          metadata: {
            userId: 'user_123',
            credits: '100',
          },
        })
      );
      expect(session).toEqual(mockSession);
    });

    it('should throw an error for an invalid package ID', async () => {
      await expect(paymentService.createCheckoutSession('user_123', 'invalid_package' as any)).rejects.toThrow(
        'Invalid package ID'
      );
    });
  });

  describe('handleWebhook', () => {
    it('should process a checkout.session.completed event', async () => {
      const mockSession = {
        id: 'cs_test_123',
        metadata: {
          userId: 'user_123',
          credits: '100',
        },
        payment_intent: 'pi_123',
        amount_total: 1000,
      };
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: mockSession,
        },
      };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: mockSession },
      } as any);
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await paymentService.handleWebhook('payload', 'sig');

      await paymentService.handleWebhook('payload', 'sig');

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should not process a payment if it already exists (idempotency)', async () => {
      const mockSession = {
        id: 'cs_test_123',
        metadata: {
          userId: 'user_123',
          credits: '100',
        },
      };
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: mockSession,
        },
      };
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent as any);
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({ id: 'payment_123' });

      await paymentService.handleWebhook('payload', 'sig');

      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw an error for an invalid webhook signature', async () => {
      (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(paymentService.handleWebhook('payload', 'invalid_sig')).rejects.toThrow(
        'Webhook signature verification failed: Invalid signature'
      );
    });
  });
});