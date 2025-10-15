/**
 * Simple Logger Implementation for MCP Server
 * Basic logging without external dependencies
 */

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

export class SimpleLogger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: string, message: string, meta?: any): void {
    const logEntry: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...meta,
    };

    // Format for console output
    const { timestamp, service, ...rest } = logEntry;
    const metaString = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
    console.log(`${timestamp} [${level.toUpperCase()}] ${service}: ${message}${metaString}`);
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const errorMeta = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
    } : { error };
    
    this.log('error', message, { ...errorMeta, ...meta });
  }

  debug(message: string, meta?: any): void {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('debug', message, meta);
    }
  }
}

export const logger = new SimpleLogger('mcp-server');

export function logCreditCheck(
  userId: string,
  requestId: string,
  balance: number,
  required: number,
  hasSufficient: boolean
): void {
  logger.info('Credit check', {
    userId,
    requestId,
    balance,
    required,
    hasSufficient,
    deficit: hasSufficient ? 0 : required - balance,
  });
}

export function logConnection(
  userId: string,
  connectionId: string,
  action: 'connected' | 'disconnected',
  meta?: any
): void {
  logger.info(`WebSocket connection ${action}`, {
    userId,
    connectionId,
    action,
    ...meta,
  });
}

export function logUsage(
  userId: string,
  requestId: string,
  provider: string,
  model: string,
  tokens: number,
  credits: number,
  duration: number
): void {
  logger.info('API usage logged', {
    userId,
    requestId,
    provider,
    model,
    tokens,
    credits,
    duration,
  });
}
