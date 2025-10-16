/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import { recordUsage } from '../services/analytics.service';
import { AuthenticatedRequest } from './auth.middleware';

// Extend Request interface to include startTime
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

/**
 * Middleware to track API usage for analytics
 * This middleware extracts usage data from requests and logs it asynchronously
 */
export const trackUsage = (
  service: string,
  options: {
    extractModel?: (req: Request) => string | undefined;
    extractTokens?: (req: Request) => number | undefined;
    extractCredits?: (req: Request) => number | undefined;
    extractMetadata?: (req: Request) => any;
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture response data
    let responseData: any;
    res.end = function (chunk?: any, encoding?: any): Response {
      if (chunk) {
        try {
          responseData = JSON.parse(chunk.toString());
        } catch (error) {
          // If parsing fails, store raw chunk
          responseData = chunk;
        }
      }
      return originalEnd.call(this, chunk, encoding);
    };

    // Continue with request processing
    res.on('finish', async () => {
      try {
        // Only track successful requests (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const authReq = req as AuthenticatedRequest;
          const userId = authReq.user?.id;

          // Skip if no authenticated user
          if (!userId) {
            return;
          }

          // Extract usage data using provided functions or defaults
          const model = options.extractModel
            ? options.extractModel(req)
            : extractModelFromRequest(req);
          const tokens = options.extractTokens
            ? options.extractTokens(req)
            : extractTokensFromRequest(req, responseData);
          const credits = options.extractCredits
            ? options.extractCredits(req)
            : extractCreditsFromRequest(req, responseData);
          const metadata = options.extractMetadata
            ? options.extractMetadata(req)
            : extractMetadataFromRequest(req, res, responseData);

          // Record usage asynchronously (don't wait for completion)
          recordUsage(userId, service, model, tokens, credits || 0, metadata).catch((error) => {
            console.error('Error recording usage:', error);
          });
        }
      } catch (error) {
        console.error('Error in analytics middleware:', error);
      }
    });

    next();
  };
};

/**
 * Default function to extract model from request
 */
function extractModelFromRequest(req: Request): string | undefined {
  // Try to extract from request body
  if (req.body && typeof req.body === 'object') {
    return req.body.model || req.body.model_name || req.body.aiModel;
  }

  // Try to extract from query parameters
  if (req.query.model || req.query.model_name) {
    return (req.query.model as string) || (req.query.model_name as string);
  }

  // Try to extract from URL path
  const pathSegments = req.path.split('/');
  const modelIndex = pathSegments.findIndex((segment) => segment === 'models');
  if (modelIndex !== -1 && pathSegments[modelIndex + 1]) {
    return pathSegments[modelIndex + 1];
  }

  return undefined;
}

/**
 * Default function to extract tokens from request/response
 */
function extractTokensFromRequest(req: Request, responseData: any): number | undefined {
  // Try to extract from response data
  if (responseData && typeof responseData === 'object') {
    // Check common token usage fields
    if (responseData.usage) {
      return responseData.usage.total_tokens || responseData.usage.tokens;
    }
    if (responseData.tokenUsage) {
      return responseData.tokenUsage.total || responseData.tokenUsage.used;
    }
    if (responseData.tokens) {
      return responseData.tokens;
    }
  }

  // Try to extract from request body
  if (req.body && typeof req.body === 'object') {
    if (req.body.max_tokens) {
      return req.body.max_tokens;
    }
    if (req.body.tokens) {
      return req.body.tokens;
    }
  }

  return undefined;
}

/**
 * Default function to extract credits from request/response
 */
function extractCreditsFromRequest(req: Request, responseData: any): number | undefined {
  // Try to extract from response data
  if (responseData && typeof responseData === 'object') {
    if (responseData.credits_used || responseData.creditsUsed) {
      return responseData.credits_used || responseData.creditsUsed;
    }
    if (responseData.cost) {
      return responseData.cost;
    }
  }

  // Try to extract from request body
  if (req.body && typeof req.body === 'object') {
    if (req.body.credits) {
      return req.body.credits;
    }
    if (req.body.cost) {
      return req.body.cost;
    }
  }

  // Default to 1 if no specific credit information found
  return 1;
}

/**
 * Default function to extract metadata from request/response
 */
function extractMetadataFromRequest(req: Request, res: Response, responseData: any): any {
  const metadata: any = {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
  };

  // Add response time if available
  if (req.startTime) {
    metadata.responseTime = Date.now() - req.startTime;
  }

  // Add request size
  if (req.headers['content-length']) {
    metadata.requestSize = parseInt(req.headers['content-length']);
  }

  // Add response size
  const contentLength = res.get('content-length');
  if (contentLength) {
    metadata.responseSize = parseInt(contentLength);
  }

  // Add error information if available
  if (responseData && typeof responseData === 'object' && responseData.error) {
    metadata.error = {
      message: responseData.error.message || responseData.error,
      code: responseData.error.code,
    };
  }

  // Add request ID if available
  if ((req as any).requestId) {
    metadata.requestId = (req as any).requestId;
  }

  return metadata;
}

/**
 * Middleware to add request start time for performance tracking
 */
export const addRequestStartTime = (req: Request, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();
  next();
};

/**
 * Predefined middleware for common services
 */
export const trackMCPUsage = trackUsage('mcp', {
  extractModel: (req) => req.body.model,
  extractTokens: (req) => req.body.max_tokens,
  extractCredits: (req) => req.body.credits || 1,
  extractMetadata: (req) => ({
    endpoint: req.path,
    provider: req.body.provider,
    tool: req.body.tool,
  }),
});

export const trackCreditUsage = trackUsage('credits', {
  extractCredits: (req) => {
    if (req.body.amount) return req.body.amount;
    if (req.body.credits) return req.body.credits;
    // For credit operations, use the amount as credits
    return 1;
  },
  extractMetadata: (req) => ({
    operation: req.path.includes('deduct')
      ? 'deduct'
      : req.path.includes('redeem')
        ? 'redeem'
        : req.path.includes('adjust')
          ? 'adjust'
          : 'check',
    reason: req.body.reason,
  }),
});

export const trackAuthUsage = trackUsage('auth', {
  extractMetadata: (req) => ({
    operation: req.path.includes('login')
      ? 'login'
      : req.path.includes('register')
        ? 'register'
        : req.path.includes('logout')
          ? 'logout'
          : req.path.includes('refresh')
            ? 'refresh'
            : 'other',
    provider: req.body.provider || 'email',
  }),
});
