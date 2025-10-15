/**
 * Service Authentication Utilities
 * Handles service-to-service authentication
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/config';

/**
 * Generate a service token for inter-service communication
 */
export function getServiceToken(): string {
  const payload = {
    type: 'service',
    service: 'mcp-server',
    timestamp: Date.now(),
  };

  return jwt.sign(payload, config.SERVICE_TOKEN_SECRET, {
    expiresIn: '24h',
  });
}

/**
 * Verify a service token from another service
 */
export function verifyServiceToken(token: string): any {
  try {
    return jwt.verify(token, config.SERVICE_TOKEN_SECRET);
  } catch (error) {
    throw new Error('Invalid service token');
  }
}
