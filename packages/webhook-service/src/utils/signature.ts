import crypto from 'crypto';
import { WebhookSignature } from '../types/webhook.types';

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export const generateSignature = (payload: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
};

/**
 * Generate signature with timestamp for webhook
 */
export const generateSignatureWithTimestamp = (
  payload: string,
  secret: string,
  timestamp: number
): WebhookSignature => {
  const signature = generateSignature(payload, secret);
  return {
    signature: `sha256=${signature}`,
    timestamp: timestamp.toString(),
  };
};

/**
 * Verify webhook signature
 */
export const verifySignature = (payload: string, signature: string, secret: string): boolean => {
  const expectedSignature = generateSignature(payload, secret);
  const expectedSignatureWithPrefix = `sha256=${expectedSignature}`;

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignatureWithPrefix));
};

/**
 * Verify signature with timestamp (checks for replay attacks)
 */
export const verifySignatureWithTimestamp = (
  payload: string,
  signature: string,
  timestamp: string,
  secret: string,
  maxAge: number = 300 // 5 minutes default
): { valid: boolean; error?: string } => {
  // Check timestamp age
  const now = Math.floor(Date.now() / 1000);
  const timestampNum = parseInt(timestamp, 10);

  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Invalid timestamp format' };
  }

  if (Math.abs(now - timestampNum) > maxAge) {
    return { valid: false, error: 'Timestamp too old' };
  }

  // Verify signature
  const isValid = verifySignature(payload, signature, secret);
  if (!isValid) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
};

/**
 * Create a webhook secret
 */
export const createWebhookSecret = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Extract signature from headers
 */
export const extractSignatureFromHeaders = (headers: {
  [key: string]: string | string[] | undefined;
}): { signature?: string; timestamp?: string; error?: string } => {
  const signatureHeader = headers['x-webhook-signature'];
  const timestampHeader = headers['x-webhook-timestamp'];

  if (!signatureHeader) {
    return { error: 'Missing X-Webhook-Signature header' };
  }

  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

  const timestamp = timestampHeader
    ? Array.isArray(timestampHeader)
      ? timestampHeader[0]
      : timestampHeader
    : undefined;

  return { signature, timestamp };
};

/**
 * Add signature headers to webhook request
 */
export const addSignatureHeaders = (payload: string, secret: string): { [key: string]: string } => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureData = generateSignatureWithTimestamp(payload, secret, timestamp);

  return {
    'X-Webhook-Signature': signatureData.signature,
    'X-Webhook-Timestamp': signatureData.timestamp,
    'Content-Type': 'application/json',
  };
};
