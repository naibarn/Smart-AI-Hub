/**
 * Service Authentication Utilities
 * Handles service-to-service authentication
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/config';

/**
 * Generate a service token for internal API calls
 */
export function generateServiceToken(): string {
  const payload = {
    sub: 'mcp-server', // Service ID
    name: 'mcp-server', // Service name
    type: 'service' as const, // Fixed type for service tokens
    iat: Math.floor(Date.now() / 1000), // Issued at (in seconds)
    jti: `mcp-${Date.now()}`, // JWT ID
  };

  return jwt.sign(payload, config.SERVICE_TOKEN_SECRET, {
    expiresIn: config.SERVICE_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Get the current service token (generate if needed)
 */
export function getServiceToken(): string {
  // For now, generate a new token each time
  // In production, you might want to cache and refresh tokens
  return generateServiceToken();
}