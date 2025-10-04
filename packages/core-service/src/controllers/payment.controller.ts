import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { CreditPackageId } from '../config/stripe.config';

const paymentService = new PaymentService();

export class PaymentController {
  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const { userId, packageId } = req.body;
      if (!userId || !packageId) {
        res.status(400).json({ error: 'Missing userId or packageId' });
        return;
      }
      const session = await paymentService.createCheckoutSession(userId, packageId as CreditPackageId);
      res.status(200).json({ sessionId: session.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleSuccess(req: Request, res: Response): Promise<void> {
    res.status(200).send('Payment successful');
  }

  async handleCancel(req: Request, res: Response): Promise<void> {
    res.status(200).send('Payment canceled');
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const sig = req.headers['stripe-signature'] as string;
      await paymentService.handleWebhook(req.body, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
}