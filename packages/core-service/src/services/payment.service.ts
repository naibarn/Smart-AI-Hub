import Stripe from 'stripe';
import { stripe, creditPackages, CreditPackageId } from '../config/stripe.config';
import { PrismaClient } from '@prisma/client';

export class PaymentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
  }

  async createCheckoutSession(userId: string, packageId: CreditPackageId): Promise<Stripe.Checkout.Session> {
    const selectedPackage = creditPackages[packageId];
    if (!selectedPackage) {
      throw new Error('Invalid package ID');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId,
        credits: selectedPackage.credits.toString(),
      },
    });

    return session;
  }

  async handleWebhook(payload: any, sig: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.processSuccessfulPayment(session);
        break;
      // Handle other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  async processSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
    const { sessionId, userId, credits } = this.extractSessionData(session);

    // Idempotency check
    const existingPayment = await this.prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (existingPayment) {
      console.log(`Payment with session ID ${sessionId} has already been processed.`);
      return;
    }

    // Create payment record and update user credits in a transaction
    await this.prisma.$transaction(async (prisma) => {
      await prisma.payment.create({
        data: {
          userId,
          amount: session.amount_total || 0,
          credits: parseInt(credits, 10),
          status: 'succeeded',
          stripeSessionId: sessionId,
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: parseInt(credits, 10),
          },
        },
      });
    });
  }

  private extractSessionData(session: Stripe.Checkout.Session): { sessionId: string; userId: string; credits: string } {
    const sessionId = session.id;
    const userId = session.metadata?.userId;
    const credits = session.metadata?.credits;

    if (!userId || !credits) {
      throw new Error('Missing metadata in checkout session');
    }

    return { sessionId, userId, credits };
  }
}