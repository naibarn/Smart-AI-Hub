/**
 * Logger Utility
 * Winston-based structured logging for MCP Server
 */

import winston from 'winston';
import { config } from '../config/config';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: 'mcp-server',
      ...meta,
    });
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: {
    service: 'mcp-server',
    version: '1.0.0',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),

    // File transport for production
    ...(config.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

// Create a stream object for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper functions for structured logging
export const logConnection = (
  userId: string,
  connectionId: string,
  event: string,
  details?: any
) => {
  logger.info('WebSocket connection event', {
    event,
    userId,
    connectionId,
    ...details,
  });
};

export const logRequest = (userId: string, requestId: string, request: any) => {
  logger.info('MCP request received', {
    userId,
    requestId,
    type: request.type,
    provider: request.provider,
    model: request.model,
    stream: request.stream,
    messageCount: request.messages?.length,
  });
};

export const logResponse = (userId: string, requestId: string, response: any, duration: number) => {
  logger.info('MCP response sent', {
    userId,
    requestId,
    responseType: response.type,
    duration,
    usage: response.usage,
    hasError: !!response.error,
  });
};

export const logCreditCheck = (
  userId: string,
  requestId: string,
  balance: number,
  required: number,
  approved: boolean
) => {
  logger.info('Credit check performed', {
    userId,
    requestId,
    balance,
    required,
    approved,
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

export const logUsage = (usageLog: any) => {
  logger.info('Usage logged', {
    userId: usageLog.userId,
    requestId: usageLog.requestId,
    provider: usageLog.provider,
    model: usageLog.model,
    creditsUsed: usageLog.creditsUsed,
    duration: usageLog.duration,
    success: usageLog.success,
  });
};

// Development logger with pretty formatting
if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    })
  );
}

export default logger;
