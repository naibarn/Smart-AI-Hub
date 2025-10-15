export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  status: WebhookStatus;
  statusCode?: number;
  response?: string;
  error?: string;
  attempt: number;
  maxAttempts: number;
  deliveredAt?: Date;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum WebhookStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
  description?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: string[];
  description?: string;
  isActive?: boolean;
}

export interface WebhookTestRequest {
  eventType: string;
  payload?: any;
}

export interface WebhookTriggerRequest {
  eventType: string;
  userId: string;
  data: any;
  metadata?: any;
}

export interface WebhookDeliveryPayload {
  id: string;
  eventType: string;
  timestamp: string;
  userId: string;
  data: any;
  metadata?: any;
}

export interface WebhookSignature {
  signature: string;
  timestamp: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
  attempt: number;
}

export interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
}

export interface WebhookEventTypes {
  USER_CREATED: 'user.created';
  CREDIT_DEPLETED: 'credit.depleted';
  CREDIT_LOW: 'credit.low';
  SERVICE_COMPLETED: 'service.completed';
  SERVICE_FAILED: 'service.failed';
}

export const WEBHOOK_EVENT_TYPES: WebhookEventTypes = {
  USER_CREATED: 'user.created',
  CREDIT_DEPLETED: 'credit.depleted',
  CREDIT_LOW: 'credit.low',
  SERVICE_COMPLETED: 'service.completed',
  SERVICE_FAILED: 'service.failed',
} as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[keyof typeof WEBHOOK_EVENT_TYPES];

export interface WebhookQueueJob {
  id: string;
  webhookId: string;
  eventType: string;
  payload: WebhookDeliveryPayload;
  attempt: number;
  maxAttempts: number;
  delay: number;
}

export interface WebhookRateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export interface WebhookErrorResponse {
  error: string;
  message: string;
  details?: any;
}

export interface WebhookSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}
