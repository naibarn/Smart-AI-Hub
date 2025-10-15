// External imports
import Stripe from 'stripe';
import { PrismaClient, Prisma } from '@prisma/client';

// Local imports
import { stripe, creditPackages, CreditPackageId } from '../config/stripe.config';
import { AppError, ValidationError } from '@smart-ai-hub/shared';
import * as creditService from './credit.service';
import RedisService from './redis.service';

const prisma = new PrismaClient();

// Helper function to check for duplicate webhook events (idempotency)
async function checkIdempotency(eventId: string): Promise<boolean> {
  const key = `webhook:event:${eventId}`;
  const exists = await RedisService.exists(key);

  if (!exists) {
    // Mark this event as processed with a 24-hour expiry
    await RedisService.set(key, 'processed', 86400);
    return false; // Not processed before
  }

  return true; // Already processed
}

// Interfaces for type safety
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PaymentDetails {
  id: string;
  userId: string;
  credits: number;
  amount: number;
  status: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  metadata?: any;
}

/**
 * Create a Stripe checkout session for credit purchase
 */
export const createStripeCheckoutSession = async (
  userId: string,
  packageId: CreditPackageId
): Promise<Stripe.Checkout.Session> => {
  try {
    // 1. Validate the packageId and get credit package details (price, credits).
    const selectedPackage = creditPackages[packageId];
    if (!selectedPackage) {
      throw new ValidationError('Invalid package ID', 400);
    }

    // 2. Generate a unique transaction ID for this payment
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 3. Initialize the Stripe SDK.
    // Stripe SDK is already initialized in the config

    // 4. Call Stripe's API to create a checkout session, passing product details, success_url, cancel_url, and the pending transaction ID in metadata.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPackage.name} Credits Package`,
              description: `${selectedPackage.credits} credits for $${(selectedPackage.price / 100).toFixed(2)}`,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/cancel`,
      metadata: {
        userId,
        packageId,
        credits: selectedPackage.credits.toString(),
        transactionId, // Include the transaction ID in metadata
      },
    });

    // 5. Create a pending payment record in the database with the Stripe session ID
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.create({
        data: {
          userId,
          amount: selectedPackage.price,
          credits: selectedPackage.credits,
          status: 'pending',
          stripeSessionId: session.id,
          metadata: {
            packageId,
            transactionId,
            createdAt: new Date().toISOString(),
          },
        },
      });
    });

    // 6. Return the session URL to the controller.
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new AppError('Failed to create checkout session', 500);
  }
};

/**
 * Handle Stripe webhooks for payment events
 */
export const handleWebhook = async (payload: any, sig: string): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError('Webhook secret not configured', 500);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await processSuccessfulPayment(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session ${session.id} expired`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
};

/**
 * Process a successful payment and add credits to user account
 */
export const processSuccessfulPayment = async (session: Stripe.Checkout.Session): Promise<void> => {
  try {
    const { sessionId, userId, credits, packageId } = extractSessionData(session);

    // Idempotency check - prevent duplicate processing
    const existingPayment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (existingPayment) {
      console.log(`Payment with session ID ${sessionId} has already been processed.`);
      return;
    }

    // Process payment in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create payment record
      await tx.payment.create({
        data: {
          userId,
          amount: session.amount_total || 0,
          credits: parseInt(credits, 10),
          status: 'succeeded',
          stripeSessionId: sessionId,
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      // Add credits to user account using the credit service
      await creditService.adjustCredits(
        userId,
        parseInt(credits, 10),
        `Purchased ${packageId} credits package (Session: ${sessionId})`
      );
    });

    // Clear balance cache for this user
    const cacheKey = `credit_balance:${userId}`;
    await RedisService.del(cacheKey);

    console.log(`Successfully processed payment for user ${userId}, added ${credits} credits`);
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw new AppError('Failed to process payment', 500);
  }
};

/**
 * Get payment history for a user
 */
export const getPaymentHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: PaymentDetails[]; total: number }> => {
  try {
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.payment.count({
      where: { userId },
    });

    // Get payments with pagination, ordered by createdAt DESC
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: payments.map((payment) => ({
        id: payment.id,
        userId: payment.userId,
        credits: payment.credits,
        amount: payment.amount,
        status: payment.status,
        stripeSessionId: payment.stripeSessionId,
        stripePaymentIntentId: payment.stripePaymentIntentId || undefined,
        createdAt: payment.createdAt,
        metadata: payment.metadata,
      })),
      total,
    };
  } catch (error) {
    console.error('Error getting payment history:', error);
    throw new AppError('Failed to get payment history', 500);
  }
};

/**
 * Extract and validate session data from Stripe checkout session
 */
const extractSessionData = (
  session: Stripe.Checkout.Session
): {
  sessionId: string;
  userId: string;
  credits: string;
  packageId: string;
} => {
  const sessionId = session.id;
  const userId = session.metadata?.userId;
  const credits = session.metadata?.credits;
  const packageId = session.metadata?.packageId;

  if (!userId || !credits || !packageId) {
    throw new ValidationError('Missing required metadata in checkout session', 400);
  }

  return { sessionId, userId, credits, packageId };
};

// Consolidated webhook handler function with idempotency check
export const processStripeWebhook = async (payload: string, sig: string): Promise<void> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError('Webhook secret not configured', 500);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
  }

  // Check for duplicate event
  if (await checkIdempotency(event.id)) {
    console.log(`Duplicate event ${event.id} detected and skipped`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await processSuccessfulPayment(session);
      break;
    }
    case 'payment_intent.succeeded': {
      console.log('PaymentIntent was successful!');
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', failedPayment.last_payment_error?.message);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

/**
 * Process Stripe webhook events with enhanced security and idempotency (legacy)
 * @deprecated Use processStripeWebhook instead
 */
export const processStripeEvent = async (rawBody: string | Buffer, sig: string): Promise<void> => {
  // 1. Get the webhook secret from environment variables.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError('Webhook secret not configured', 500);
  }

  let event: Stripe.Event;

  try {
    // 2. Use the Stripe SDK to verify the event signature. This is crucial for security.
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    // 3. If verification fails, throw an error.
    throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
  }

  try {
    // 4. Use a 'switch' statement to handle different event types, especially 'checkout.session.completed'.
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // 5. For 'checkout.session.completed':
        //    a. Extract the pending transaction ID from the event's metadata.
        const sessionId = session.id;
        const userId = session.metadata?.userId;
        const credits = session.metadata?.credits;
        const packageId = session.metadata?.packageId;

        if (!userId || !credits || !packageId) {
          console.error(`Missing required metadata in session ${sessionId}`);
          return;
        }

        //    b. Verify the transaction status in our database to prevent duplicate processing (idempotency).
        const existingPayment = await prisma.payment.findUnique({
          where: { stripeSessionId: sessionId },
        });

        if (existingPayment) {
          console.log(`Payment with session ID ${sessionId} has already been processed.`);
          return;
        }

        //    c. If valid, start a database transaction.
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // Create payment record
          await tx.payment.create({
            data: {
              userId,
              amount: session.amount_total || 0,
              credits: parseInt(credits, 10),
              status: 'completed',
              stripeSessionId: sessionId,
              stripePaymentIntentId: session.payment_intent as string,
            },
          });

          //    d. Update the user's credit balance by calling the credit.service.
          await creditService.adjustCredits(
            userId,
            parseInt(credits, 10),
            `Purchased ${packageId} credits package (Session: ${sessionId})`
          );

          //    e. Mark the pending transaction as 'completed'.
          // (Already done above by setting status to 'completed')
        });

        //    f. Commit the database transaction.
        // (Automatically committed by Prisma when the transaction function resolves)

        // Clear balance cache for this user
        const cacheKey = `credit_balance:${userId}`;
        await RedisService.del(cacheKey);

        //    g. Send a purchase confirmation email (placeholder for now).
        console.log(
          `TODO: Send purchase confirmation email to user ${userId} for ${credits} credits`
        );

        console.log(`Successfully processed payment for user ${userId}, added ${credits} credits`);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session ${session.id} expired`);

        // Optionally update the payment record to 'expired' status if it exists
        // This would be useful if we created a pending record before checkout
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);

        // Optionally handle payment failures
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Invoice payment succeeded: ${invoice.id}`);

        // Handle subscription payments if we implement them in the future
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw new AppError('Failed to process webhook event', 500);
  }
};
