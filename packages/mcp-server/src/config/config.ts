/**
 * MCP Server Configuration
 * Environment-based configuration management
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  PORT: parseInt(process.env.PORT || '3003', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // WebSocket configuration
  WS_HEARTBEAT_INTERVAL: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10), // 30 seconds
  WS_CONNECTION_TIMEOUT: parseInt(process.env.WS_CONNECTION_TIMEOUT || '120000', 10), // 2 minutes
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  
  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_TTL: parseInt(process.env.REDIS_TTL || '3600', 10), // 1 hour
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/smartaihub',
  
  // Credit configuration
  CREDIT_COST_PER_TOKEN: parseFloat(process.env.CREDIT_COST_PER_TOKEN || '0.0001'), // Credits per token
  MIN_CREDITS_REQUIRED: parseInt(process.env.MIN_CREDITS_REQUIRED || '1', 10),
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'json',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // AI Provider configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  
  // Service URLs
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  CREDIT_SERVICE_URL: process.env.CREDIT_SERVICE_URL || 'http://localhost:3002',
  
  // Model pricing (credits per 1K tokens)
  MODEL_PRICING: {
    'gpt-3.5-turbo': 0.002,
    'gpt-4': 0.03,
    'gpt-4-turbo': 0.01,
    'claude-3-haiku': 0.00025,
    'claude-3-sonnet': 0.003,
    'claude-3-opus': 0.015,
  },
  
  // Default models
  DEFAULT_OPENAI_MODEL: process.env.DEFAULT_OPENAI_MODEL || 'gpt-3.5-turbo',
  DEFAULT_CLAUDE_MODEL: process.env.DEFAULT_CLAUDE_MODEL || 'claude-3-haiku',
  
  // Request limits
  MAX_TOKENS_REQUEST: parseInt(process.env.MAX_TOKENS_REQUEST || '4096', 10),
  MAX_MESSAGES_IN_CONTEXT: parseInt(process.env.MAX_MESSAGES_IN_CONTEXT || '20', 10),
  MAX_TEMPERATURE: parseFloat(process.env.MAX_TEMPERATURE || '2.0'),
  MIN_TEMPERATURE: parseFloat(process.env.MIN_TEMPERATURE || '0.0'),
};

// Validation
export const validateConfig = (): void => {
  const requiredVars = [
    'JWT_SECRET',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate numeric values
  if (config.PORT < 1 || config.PORT > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }
  
  if (config.WS_HEARTBEAT_INTERVAL < 1000) {
    throw new Error('WS_HEARTBEAT_INTERVAL must be at least 1000ms');
  }
  
  if (config.CREDIT_COST_PER_TOKEN < 0) {
    throw new Error('CREDIT_COST_PER_TOKEN must be positive');
  }
};

// Export configuration type for type safety
export type Config = typeof config;