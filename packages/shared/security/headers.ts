import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';

// Extend Request interface to include locals
declare global {
  namespace Express {
    interface Request {
      locals?: any;
    }
  }
}

/**
 * Environment-specific security configurations
 */
export const SecurityConfig = {
  production: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        blockAllMixedContent: [],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },
  
  development: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        styleSrc: ["'self'", "'unsafe-inline'", 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        imgSrc: ["'self'", 'data:', 'https:', 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        fontSrc: ["'self'", 'data:', 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        frameAncestors: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        reportUri: ['/api/v1/security/csp-report'],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 3600,
      includeSubDomains: true,
      preload: false,
    },
  },

  staging: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        styleSrc: ["'self'", "'unsafe-inline'", 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        imgSrc: ["'self'", 'data:', 'https:', 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        fontSrc: ["'self'", 'data:', 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'localhost:3000', 'localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:8080'],
        frameAncestors: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        reportUri: ['/api/v1/security/csp-report'],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 3600,
      includeSubDomains: true,
      preload: false,
    },
  },
};

/**
 * CSP nonce generation middleware
 */
export const cspNonceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const crypto = require('crypto');
  req.locals = req.locals || {};
  req.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  res.locals.cspNonce = req.locals.cspNonce;
  next();
};

/**
 * Get environment-specific security configuration
 */
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return SecurityConfig.production;
    case 'staging':
      return SecurityConfig.staging;
    default:
      return SecurityConfig.development;
  }
};

/**
 * Helmet middleware with environment-specific configuration
 */
export const securityHeaders = helmet(getSecurityConfig());

/**
 * Complete security middleware stack (should be applied FIRST)
 */
export const applySecurityHeaders = [
  cspNonceMiddleware,
  securityHeaders,
];

/**
 * Security headers for API endpoints (no CSP needed)
 */
export const apiSecurityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: process.env.NODE_ENV === 'production',
  },
});

/**
 * Generate CSP nonce for templates
 */
export const generateCspNonce = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Validate CSP violation report
 */
export const validateCspReport = (report: any): boolean => {
  return (
    report &&
    typeof report === 'object' &&
    report['csp-report'] &&
    typeof report['csp-report'] === 'object'
  );
};

/**
 * CSP violation report format
 */
export interface CspViolationReport {
  'csp-report': {
    'document-uri'?: string;
    'referrer'?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'disposition'?: string;
    'blocked-uri'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code'?: number;
    'script-sample'?: string;
  };
}

/**
 * Security headers status interface
 */
export interface SecurityHeadersStatus {
  [key: string]: {
    enabled: boolean;
    value?: string;
    description: string;
  };
}

/**
 * Get security headers status for monitoring
 */
export const getSecurityHeadersStatus = (): SecurityHeadersStatus => {
  return {
    'X-Frame-Options': {
      enabled: true,
      value: process.env.NODE_ENV === 'production' ? 'DENY' : 'SAMEORIGIN',
      description: 'Prevents clickjacking attacks',
    },
    'X-Content-Type-Options': {
      enabled: true,
      value: 'nosniff',
      description: 'Prevents MIME-type sniffing',
    },
    'X-XSS-Protection': {
      enabled: true,
      value: '1; mode=block',
      description: 'Enables XSS filtering',
    },
    'Strict-Transport-Security': {
      enabled: true,
      value: process.env.NODE_ENV === 'production' 
        ? 'max-age=31536000; includeSubDomains; preload'
        : 'max-age=3600; includeSubDomains',
      description: 'Enforces HTTPS connections',
    },
    'Referrer-Policy': {
      enabled: true,
      value: 'strict-origin-when-cross-origin',
      description: 'Controls referrer information',
    },
    'X-DNS-Prefetch-Control': {
      enabled: true,
      value: 'off',
      description: 'Controls DNS prefetching',
    },
    'X-Download-Options': {
      enabled: true,
      value: 'noopen',
      description: 'Prevents automatic file downloads',
    },
    'X-Permitted-Cross-Domain-Policies': {
      enabled: true,
      value: 'none',
      description: 'Restricts cross-domain policies',
    },
    'Permissions-Policy': {
      enabled: true,
      value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()',
      description: 'Controls browser feature access',
    },
    'Content-Security-Policy': {
      enabled: true,
      description: 'Prevents various injection attacks',
    },
  };
};