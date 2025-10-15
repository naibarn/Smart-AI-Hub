/**
 * MCP Server Authentication & Authorization Middleware
 * Handles WebSocket authentication and role-based access control for AI services
 */

import { WebSocket } from 'ws';
import { UserInfo } from '../utils/jwt.util';
import { logger } from '../utils/logger';

// Extended connection metadata
export interface ConnectionMetadata {
  user: UserInfo;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  allowedModels: string[];
  maxTokens: number;
  allowedFeatures: string[];
}

// Role configuration interface
interface RoleConfiguration {
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  allowedModels: string[];
  maxTokens: number;
  allowedFeatures: string[];
}

// Role-based permissions configuration
const ROLE_PERMISSIONS: Record<string, RoleConfiguration> = {
  'superadmin': {
    permissions: ['*'], // All permissions
    rateLimit: {
      requestsPerMinute: 1000,
      tokensPerMinute: 1000000,
    },
    allowedModels: ['*'], // All models
    maxTokens: 32768,
    allowedFeatures: ['*'], // All features
  },
  'admin': {
    permissions: [
      'ai:chat',
      'ai:image',
      'ai:video',
      'credits:view',
      'credits:use',
      'analytics:view',
      'admin:users',
      'admin:system',
    ],
    rateLimit: {
      requestsPerMinute: 500,
      tokensPerMinute: 500000,
    },
    allowedModels: ['*'], // All models
    maxTokens: 16384,
    allowedFeatures: ['chat', 'image', 'video', 'analytics'],
  },
  'premium': {
    permissions: [
      'ai:chat',
      'ai:image',
      'credits:view',
      'credits:use',
      'analytics:view',
    ],
    rateLimit: {
      requestsPerMinute: 200,
      tokensPerMinute: 200000,
    },
    allowedModels: ['gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet'],
    maxTokens: 8192,
    allowedFeatures: ['chat', 'image'],
  },
  'pro': {
    permissions: [
      'ai:chat',
      'credits:view',
      'credits:use',
    ],
    rateLimit: {
      requestsPerMinute: 100,
      tokensPerMinute: 100000,
    },
    allowedModels: ['gpt-4', 'claude-3-sonnet', 'claude-3-haiku'],
    maxTokens: 4096,
    allowedFeatures: ['chat'],
  },
  'user': {
    permissions: [
      'ai:chat',
      'credits:view',
      'credits:use',
    ],
    rateLimit: {
      requestsPerMinute: 60,
      tokensPerMinute: 60000,
    },
    allowedModels: ['gpt-3.5-turbo', 'claude-3-haiku'],
    maxTokens: 2048,
    allowedFeatures: ['chat'],
  },
  'trial': {
    permissions: [
      'ai:chat',
      'credits:view',
      'credits:use',
    ],
    rateLimit: {
      requestsPerMinute: 20,
      tokensPerMinute: 20000,
    },
    allowedModels: ['gpt-3.5-turbo'],
    maxTokens: 1024,
    allowedFeatures: ['chat'],
  },
};

/**
 * Get role configuration for a user
 */
export const getRoleConfiguration = (role: string): RoleConfiguration => {
  const defaultConfig = ROLE_PERMISSIONS.trial;
  const roleConfig = ROLE_PERMISSIONS[role] || defaultConfig;
  
  return roleConfig;
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole: string, permission: string): boolean => {
  const config = getRoleConfiguration(userRole);
  
  // Wildcard permission means access to everything
  if (config.permissions.includes('*')) {
    return true;
  }
  
  // Exact match
  if (config.permissions.includes(permission)) {
    return true;
  }
  
  // Check for wildcard sub-permissions (e.g., 'ai:*' matches 'ai:chat')
  const [category] = permission.split(':');
  const wildcardPermission = `${category}:*`;
  
  return config.permissions.includes(wildcardPermission);
};

/**
 * Check if user can access specific model
 */
export const canAccessModel = (userRole: string, model: string): boolean => {
  const config = getRoleConfiguration(userRole);
  
  // Wildcard means access to all models
  if (config.allowedModels.includes('*')) {
    return true;
  }
  
  return config.allowedModels.includes(model);
};

/**
 * Check if user can use specific feature
 */
export const canUseFeature = (userRole: string, feature: string): boolean => {
  const config = getRoleConfiguration(userRole);
  
  // Wildcard means access to all features
  if (config.allowedFeatures.includes('*')) {
    return true;
  }
  
  return config.allowedFeatures.includes(feature);
};

/**
 * Get maximum tokens allowed for user's role
 */
export const getMaxTokens = (userRole: string): number => {
  const config = getRoleConfiguration(userRole);
  return config.maxTokens;
};

/**
 * Get rate limit for user's role
 */
export const getRateLimit = (userRole: string): ConnectionMetadata['rateLimit'] => {
  const config = getRoleConfiguration(userRole);
  return config.rateLimit;
};

/**
 * Validate request against user's permissions and limits
 */
export const validateRequest = (
  user: UserInfo,
  requestModel: string,
  requestedTokens: number,
  requestedFeature: string = 'chat'
): { valid: boolean; reason?: string } => {
  // Check model access
  if (!canAccessModel(user.role, requestModel)) {
    return {
      valid: false,
      reason: `Model '${requestModel}' is not available for your role (${user.role})`,
    };
  }
  
  // Check feature access
  if (!canUseFeature(user.role, requestedFeature)) {
    return {
      valid: false,
      reason: `Feature '${requestedFeature}' is not available for your role (${user.role})`,
    };
  }
  
  // Check token limit
  const maxTokens = getMaxTokens(user.role);
  if (requestedTokens > maxTokens) {
    return {
      valid: false,
      reason: `Requested ${requestedTokens} tokens exceeds maximum allowed (${maxTokens}) for your role (${user.role})`,
    };
  }
  
  return { valid: true };
};

/**
 * Create connection metadata for authenticated user
 */
export const createConnectionMetadata = (user: UserInfo): ConnectionMetadata => {
  const config = getRoleConfiguration(user.role);
  
  return {
    user,
    permissions: config.permissions,
    rateLimit: config.rateLimit,
    allowedModels: config.allowedModels,
    maxTokens: config.maxTokens,
    allowedFeatures: config.allowedFeatures,
  };
};

/**
 * WebSocket authorization middleware
 * Validates that the user has the required permissions for the requested operation
 */
export const authorizeWebSocket = (
  ws: WebSocket,
  metadata: ConnectionMetadata,
  requestModel: string,
  requestedTokens: number,
  requestedFeature: string = 'chat'
): { authorized: boolean; reason?: string } => {
  const validation = validateRequest(
    metadata.user,
    requestModel,
    requestedTokens,
    requestedFeature
  );
  
  if (!validation.valid) {
    logger.warn('WebSocket authorization failed', {
      userId: metadata.user.id,
      role: metadata.user.role,
      requestModel,
      requestedTokens,
      requestedFeature,
      reason: validation.reason,
    });
    
    return {
      authorized: false,
      reason: validation.reason,
    };
  }
  
  logger.debug('WebSocket authorization successful', {
    userId: metadata.user.id,
    role: metadata.user.role,
    requestModel,
    requestedTokens,
    requestedFeature,
  });
  
  return { authorized: true };
};

/**
 * Rate limiting check for WebSocket connections
 */
export const checkRateLimit = (
  metadata: ConnectionMetadata,
  currentUsage: { requests: number; tokens: number }
): { allowed: boolean; reason?: string; resetTime?: Date } => {
  const { requestsPerMinute, tokensPerMinute } = metadata.rateLimit;
  
  if (currentUsage.requests >= requestsPerMinute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${currentUsage.requests}/${requestsPerMinute} requests per minute`,
      resetTime: new Date(Date.now() + 60000), // 1 minute from now
    };
  }
  
  if (currentUsage.tokens >= tokensPerMinute) {
    return {
      allowed: false,
      reason: `Token limit exceeded: ${currentUsage.tokens}/${tokensPerMinute} tokens per minute`,
      resetTime: new Date(Date.now() + 60000), // 1 minute from now
    };
  }
  
  return { allowed: true };
};

/**
 * Get user's available models based on their role
 */
export const getAvailableModels = (userRole: string): string[] => {
  const config = getRoleConfiguration(userRole);
  
  if (config.allowedModels.includes('*')) {
    // Return all supported models
    return [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'claude-3-haiku',
      'claude-3-sonnet',
      'claude-3-opus',
    ];
  }
  
  return config.allowedModels;
};

/**
 * Get user's available features based on their role
 */
export const getAvailableFeatures = (userRole: string): string[] => {
  const config = getRoleConfiguration(userRole);
  
  if (config.allowedFeatures.includes('*')) {
    return ['chat', 'image', 'video', 'analytics'];
  }
  
  return config.allowedFeatures;
};