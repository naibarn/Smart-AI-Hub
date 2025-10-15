import { apiService } from './api.service';

export interface WebhookEndpoint {
  id: string;
  url: string;
  eventTypes: string[];
  secret: string;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  attempt: number;
  maxAttempts: number;
  status: 'pending' | 'delivered' | 'failed';
  createdAt: string;
  deliveredAt?: string;
}

export interface CreateWebhookData {
  url: string;
  eventTypes: string[];
  secret?: string;
}

export interface UpdateWebhookData {
  url?: string;
  eventTypes?: string[];
  secret?: string;
  isActive?: boolean;
}

export interface TestWebhookData {
  eventType: string;
  data?: any;
}

export const webhookService = {
  // Get all webhooks for the current user
  async getWebhooks(): Promise<WebhookEndpoint[]> {
    return apiService.get<WebhookEndpoint[]>('/api/v1/webhooks');
  },

  // Get a specific webhook by ID
  async getWebhook(id: string): Promise<WebhookEndpoint> {
    return apiService.get<WebhookEndpoint>(`/api/v1/webhooks/${id}`);
  },

  // Create a new webhook
  async createWebhook(data: CreateWebhookData): Promise<WebhookEndpoint> {
    return apiService.post<WebhookEndpoint>('/api/v1/webhooks', data);
  },

  // Update an existing webhook
  async updateWebhook(id: string, data: UpdateWebhookData): Promise<WebhookEndpoint> {
    return apiService.put<WebhookEndpoint>(`/api/v1/webhooks/${id}`, data);
  },

  // Delete a webhook
  async deleteWebhook(id: string): Promise<void> {
    return apiService.delete<void>(`/api/v1/webhooks/${id}`);
  },

  // Toggle webhook active status
  async toggleWebhook(id: string): Promise<WebhookEndpoint> {
    return apiService.post<WebhookEndpoint>(`/api/v1/webhooks/${id}/toggle`);
  },

  // Test a webhook
  async testWebhook(
    id: string,
    data: TestWebhookData
  ): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>(
      `/api/v1/webhooks/${id}/test`,
      data
    );
  },

  // Get webhook delivery logs
  async getWebhookLogs(
    id: string,
    page = 1,
    limit = 20
  ): Promise<{
    logs: WebhookLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return apiService.get<{
      logs: WebhookLog[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/v1/webhooks/${id}/logs`, { page: page.toString(), limit: limit.toString() });
  },

  // Get available event types
  async getEventTypes(): Promise<{
    eventTypes: string[];
    descriptions: Record<string, string>;
  }> {
    return apiService.get<{
      eventTypes: string[];
      descriptions: Record<string, string>;
    }>('/api/v1/webhooks/event-types');
  },

  // Regenerate webhook secret
  async regenerateSecret(id: string): Promise<{ secret: string }> {
    return apiService.post<{ secret: string }>(`/api/v1/webhooks/${id}/regenerate-secret`);
  },

  // Get webhook statistics
  async getWebhookStats(id: string): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
    lastDeliveryAt?: string;
  }> {
    return apiService.get<{
      totalDeliveries: number;
      successfulDeliveries: number;
      failedDeliveries: number;
      averageResponseTime: number;
      lastDeliveryAt?: string;
    }>(`/api/v1/webhooks/${id}/stats`);
  },
};

// Event type descriptions for UI
export const EVENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  'user.created': 'Triggered when a new user account is created',
  'user.updated': 'Triggered when user profile information is updated',
  'user.deleted': 'Triggered when a user account is deleted',
  'user.login': 'Triggered when a user successfully logs in',
  'user.logout': 'Triggered when a user logs out',
  'credit.depleted': 'Triggered when user credits reach zero',
  'credit.low': 'Triggered when user credits fall below the low threshold',
  'credit.added': 'Triggered when credits are added to an account',
  'credit.deducted': 'Triggered when credits are deducted from an account',
  'service.completed': 'Triggered when an AI service completes successfully',
  'service.failed': 'Triggered when an AI service fails to complete',
  'service.started': 'Triggered when an AI service starts processing',
  'payment.completed': 'Triggered when a payment is completed successfully',
  'payment.failed': 'Triggered when a payment fails',
  'subscription.created': 'Triggered when a new subscription is created',
  'subscription.cancelled': 'Triggered when a subscription is cancelled',
  'subscription.renewed': 'Triggered when a subscription is renewed',
};

// Helper function to validate webhook URL
export const validateWebhookUrl = (url: string): { isValid: boolean; error?: string } => {
  try {
    const urlObj = new URL(url);

    // Must be HTTPS in production
    if (import.meta.env.PROD && urlObj.protocol !== 'https:') {
      return { isValid: false, error: 'Webhook URL must use HTTPS in production' };
    }

    // Check for valid protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Webhook URL must use HTTP or HTTPS protocol' };
    }

    // Check for localhost in production
    if (import.meta.env.PROD && ['localhost', '127.0.0.1'].includes(urlObj.hostname)) {
      return { isValid: false, error: 'Localhost URLs are not allowed in production' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Helper function to generate a random webhook secret
export const generateWebhookSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper function to format webhook status
export const formatWebhookStatus = (status: string): { label: string; color: string } => {
  switch (status) {
    case 'delivered':
      return { label: 'Delivered', color: '#10b981' };
    case 'failed':
      return { label: 'Failed', color: '#ef4444' };
    case 'pending':
      return { label: 'Pending', color: '#f59e0b' };
    default:
      return { label: status, color: '#6b7280' };
  }
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Helper function to calculate success rate
export const calculateSuccessRate = (successful: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((successful / total) * 100);
};
