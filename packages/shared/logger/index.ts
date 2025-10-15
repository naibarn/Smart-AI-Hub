import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from 'express';

export interface LogContext {
  timestamp?: string;
  level: string;
  service: string;
  message: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  [key: string]: any;
}

export interface LoggerOptions {
  service: string;
  level?: string;
  logDir?: string;
}

class Logger {
  private logger: winston.Logger;
  private serviceName: string;

  constructor(options: LoggerOptions) {
    this.serviceName = options.service;
    
    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info) => {
        const logEntry: LogContext = {
          timestamp: info.timestamp,
          level: info.level,
          service: this.serviceName,
          message: info.message,
          ...info
        };
        return JSON.stringify(logEntry);
      })
    );

    // Define console format with colors
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf((info) => {
        const { timestamp, level, message, service, userId, requestId, duration, ...meta } = info;
        let log = `${timestamp} [${level}] ${service}: ${message}`;
        
        if (userId) log += ` (user: ${userId})`;
        if (requestId) log += ` (req: ${requestId})`;
        if (duration) log += ` (${duration}ms)`;
        
        const keys = Object.keys(meta);
        if (keys.length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        
        return log;
      })
    );

    // Create transports
    const transports: winston.transport[] = [
      // Console transport with colors
      new winston.transports.Console({
        format: consoleFormat,
        level: options.level || 'info'
      })
    ];

    // Add file transports if logDir is specified
    if (options.logDir) {
      // Combined logs
      transports.push(
        new DailyRotateFile({
          filename: `${options.logDir}/combined-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat
        })
      );

      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: `${options.logDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: logFormat
        })
      );
    }

    this.logger = winston.createLogger({
      level: options.level || 'info',
      format: logFormat,
      transports,
      exitOnError: false
    });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: Error | any, meta?: any): void {
    if (error instanceof Error) {
      this.logger.error(message, { 
        error: error.message, 
        stack: error.stack,
        ...meta 
      });
    } else {
      this.logger.error(message, { error, ...meta });
    }
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  // HTTP request logging
  logRequest(req: Request, res: any, duration: number): void {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;
    
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent: headers['user-agent'],
      userId: req.user?.id,
      requestId: req.headers['x-request-id']
    });
  }

  // Error logging with context
  logError(message: string, error: Error, context?: any): void {
    this.error(message, error, {
      userId: context?.userId,
      requestId: context?.requestId,
      service: this.serviceName,
      ...context
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: any): void {
    this.info(`Performance: ${operation}`, {
      operation,
      duration,
      userId: context?.userId,
      requestId: context?.requestId,
      ...context
    });
  }

  // Business event logging
  logEvent(event: string, data: any, context?: any): void {
    this.info(`Event: ${event}`, {
      event,
      data,
      userId: context?.userId,
      requestId: context?.requestId,
      ...context
    });
  }

  // Security event logging
  logSecurity(event: string, data: any, context?: any): void {
    this.warn(`Security: ${event}`, {
      event,
      data,
      userId: context?.userId,
      requestId: context?.requestId,
      service: this.serviceName,
      ...context
    });
  }

  // Get the underlying winston logger
  getLogger(): winston.Logger {
    return this.logger;
  }
}

// Factory function to create loggers
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

// Default logger instance
export const logger = createLogger({
  service: 'smart-ai-hub',
  level: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || '/var/log/smart-ai-hub'
});

// Request logging middleware factory
export function createRequestLoggingMiddleware(logger: Logger) {
  return (req: Request, res: any, next: any) => {
    const start = Date.now();
    
    // Add request ID if not present
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Log request
    logger.info('Request started', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'],
      userId: req.user?.id
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - start;
      
      logger.logRequest(req, res, duration);
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
}

// Error logging middleware factory
export function createErrorLoggingMiddleware(logger: Logger) {
  return (error: Error, req: Request, res: any, next: any) => {
    logger.logError('Request error', error, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'],
      userId: req.user?.id
    });
    
    next(error);
  };
}

export default Logger;