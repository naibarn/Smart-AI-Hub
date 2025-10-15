import axios from 'axios';

interface WebhookEventData {
  eventType: string;
  userId: string;
  data: any;
  metadata?: any;
}

class WebhookService {
  private webhookServiceUrl: string;
  private internalSecret?: string;

  constructor() {
    this.webhookServiceUrl = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3005';
    this.internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(eventType: string, userId: string, data: any, metadata: any = {}): Promise<void> {
    try {
      if (!this.internalSecret) {
        console.warn('Webhook service integration not configured - skipping webhook trigger');
        return;
      }

      const payload: WebhookEventData = {
        eventType,
        userId,
        data,
        metadata: {
          ...metadata,
          service: 'core-service',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await axios.post(
        `${this.webhookServiceUrl}/internal/webhooks/trigger`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.internalSecret}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 seconds timeout
        }
      );

      console.log(`Webhook triggered successfully: ${eventType} for user ${userId}`);
    } catch (error: any) {
      // Log error but don't fail the main operation
      console.error(`Failed to trigger webhook: ${eventType} for user ${userId}:`, error.message);
      
      if (error.response) {
        console.error('Webhook service response:', error.response.status, error.response.data);
      }
    }
  }

  /**
   * Trigger credit.depleted event
   */
  async triggerCreditDepleted(userId: string, balance: number, transactionData: any): Promise<void> {
    return await this.triggerEvent('credit.depleted', userId, {
      userId,
      balance,
      previousBalance: transactionData.balanceAfter + transactionData.amount,
      transactionId: transactionData.id,
      transactionType: transactionData.type,
      amount: transactionData.amount,
      description: transactionData.description,
      depletedAt: new Date().toISOString(),
    }, {
      source: 'credit_transaction',
      transactionId: transactionData.id,
    });
  }

  /**
   * Trigger credit.low event (when credits fall below threshold)
   */
  async triggerCreditLow(userId: string, balance: number, threshold: number = 10): Promise<void> {
    return await this.triggerEvent('credit.low', userId, {
      userId,
      balance,
      threshold,
      lowCreditAt: new Date().toISOString(),
    }, {
      source: 'credit_monitoring',
      threshold,
    });
  }

  /**
   * Trigger credit.purchased event
   */
  async triggerCreditPurchased(userId: string, amount: number, balance: number, paymentData: any): Promise<void> {
    return await this.triggerEvent('credit.purchased', userId, {
      userId,
      amount,
      balance,
      previousBalance: balance - amount,
      transactionId: paymentData.transactionId,
      paymentMethod: paymentData.paymentMethod,
      purchasedAt: new Date().toISOString(),
    }, {
      source: 'payment',
      paymentId: paymentData.paymentId,
    });
  }

  /**
   * Trigger credit.refunded event
   */
  async triggerCreditRefunded(userId: string, amount: number, balance: number, refundData: any): Promise<void> {
    return await this.triggerEvent('credit.refunded', userId, {
      userId,
      amount,
      balance,
      previousBalance: balance - amount,
      transactionId: refundData.transactionId,
      reason: refundData.reason,
      refundedAt: new Date().toISOString(),
    }, {
      source: 'refund',
      refundId: refundData.refundId,
    });
  }

  /**
   * Trigger credit.promo_redeemed event
   */
  async triggerCreditPromoRedeemed(userId: string, promoCode: string, credits: number, balance: number): Promise<void> {
    return await this.triggerEvent('credit.promo_redeemed', userId, {
      userId,
      promoCode,
      credits,
      balance,
      previousBalance: balance - credits,
      redeemedAt: new Date().toISOString(),
    }, {
      source: 'promo_code',
      promoCode,
    });
  }

  /**
   * Check if credit is low and trigger appropriate webhook
   */
  async checkAndTriggerLowCredit(userId: string, balance: number, threshold: number = 10): Promise<void> {
    if (balance <= threshold) {
      await this.triggerCreditLow(userId, balance, threshold);
    }
  }

  /**
   * Check if credit is depleted and trigger appropriate webhook
   */
  async checkAndTriggerCreditDepleted(userId: string, balance: number, transactionData: any): Promise<void> {
    if (balance <= 0) {
      await this.triggerCreditDepleted(userId, balance, transactionData);
    }
  }

  /**
   * Check if webhook service is available
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.webhookServiceUrl}/internal/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.internalSecret}`,
          },
          timeout: 3000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Webhook service health check failed:', error.message);
      return null;
    }
  }
}

export default new WebhookService();