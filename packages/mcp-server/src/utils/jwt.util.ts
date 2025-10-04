/**
 * JWT Utilities for WebSocket Authentication
 * Handles JWT token extraction and validation for WebSocket connections
 */

import jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { config } from '../config/config';
import { logger } from './logger';

// JWT Payload interface (matching shared package)
export interface JWTPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // User role
  iat: number; // Issued at
  exp: number; // Expiration time
  jti: string; // JWT ID (for blacklist)
}

// User info extracted from JWT
export interface UserInfo {
  id: string;
  email: string;
  role: string;
}

/**
 * Extract JWT token from WebSocket connection request
 * Supports both query parameter and Authorization header
 */
export const extractJWTFromRequest = (req: IncomingMessage): string | null => {
  try {
    // Method 1: Extract from query parameter
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');
    
    if (tokenFromQuery) {
      logger.debug('JWT extracted from query parameter');
      return tokenFromQuery;
    }
    
    // Method 2: Extract from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenFromHeader = authHeader.substring(7);
      logger.debug('JWT extracted from Authorization header');
      return tokenFromHeader;
    }
    
    // Method 3: Extract from protocol header (some WebSocket clients use this)
    const protocolHeader = req.headers['sec-websocket-protocol'];
    if (protocolHeader && typeof protocolHeader === 'string') {
      const protocols = protocolHeader.split(',').map(p => p.trim());
      const tokenFromProtocol = protocols.find(p => p.startsWith('Bearer '));
      if (tokenFromProtocol) {
        logger.debug('JWT extracted from WebSocket protocol');
        return tokenFromProtocol.substring(7);
      }
    }
    
    logger.warn('No JWT token found in WebSocket request');
    return null;
  } catch (error) {
    logger.error('Error extracting JWT from request', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
};

/**
 * Verify JWT token and return payload
 */
export const verifyJWT = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Extract user info from JWT token
 */
export const extractUserInfo = (token: string): UserInfo => {
  try {
    const payload = verifyJWT(token);
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    logger.error('Failed to extract user info from JWT', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

/**
 * Check if token is blacklisted (Redis check)
 * Note: This would require Redis client setup in actual implementation
 */
export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  try {
    // TODO: Implement Redis blacklist check
    // const redisClient = getRedisClient();
    // const blacklistKey = `blacklist:${jti}`;
    // const isBlacklisted = await redisClient.get(blacklistKey);
    // return !!isBlacklisted;
    
    // For now, return false (not blacklisted)
    return false;
  } catch (error) {
    logger.error('Error checking token blacklist', { jti, error: error instanceof Error ? error.message : String(error) });
    // Fail open - allow connection if Redis is down
    return false;
  }
};

/**
 * Complete WebSocket authentication flow
 */
export const authenticateWebSocket = async (req: IncomingMessage): Promise<{ user: UserInfo; jti: string } | null> => {
  try {
    // Extract token from request
    const token = extractJWTFromRequest(req);
    if (!token) {
      logger.warn('WebSocket authentication failed: No token provided');
      return null;
    }
    
    // Verify token
    const payload = verifyJWT(token);
    
    // Check blacklist
    const isBlacklisted = await isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      logger.warn('WebSocket authentication failed: Token is blacklisted', { jti: payload.jti });
      return null;
    }
    
    // Extract user info
    const user = extractUserInfo(token);
    
    logger.info('WebSocket authentication successful', {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti: payload.jti,
    });
    
    return {
      user,
      jti: payload.jti,
    };
  } catch (error) {
    logger.error('WebSocket authentication error', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
};

/**
 * Generate WebSocket connection URL with token
 */
export const generateWebSocketURL = (baseUrl: string, token: string): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
};

/**
 * Validate token format before processing
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token) {
    return false;
  }
  // Basic JWT format check: header.payload.signature
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};