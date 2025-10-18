# Smart AI Hub Security Guidelines

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Table of Contents

- [Overview](#overview)
- [Security Principles](#security-principles)
- [Threat Model](#threat-model)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Application Security](#application-security)
- [Security Testing](#security-testing)
- [Incident Response](#incident-response)
- [Compliance](#compliance)
- [Security Checklist](#security-checklist)

## Overview

This document outlines the security guidelines and best practices for the Smart AI Hub platform. It provides comprehensive information about securing the application, infrastructure, and data against various security threats.

### Security Objectives

1. **Confidentiality**: Protect sensitive data from unauthorized access
2. **Integrity**: Ensure data and systems are not tampered with
3. **Availability**: Maintain system availability and resilience
4. **Privacy**: Protect user privacy and comply with regulations
5. **Accountability**: Track and audit system activities

## Security Principles

### 1. Defense in Depth

Implement multiple layers of security controls:

- Network security
- Application security
- Data security
- Infrastructure security

### 2. Principle of Least Privilege

Grant minimum necessary permissions:

- Users have only required permissions
- Services have minimal access rights
- Default deny policies

### 3. Secure by Default

Ensure secure configurations:

- Secure defaults for all settings
- No default passwords
- All communications encrypted

### 4. Fail Securely

Ensure failures don't compromise security:

- Secure error handling
- Fail closed, not open
- Minimal error information disclosure

### 5. Trust but Verify

Validate all inputs and assumptions:

- Input validation
- Output encoding
- Zero trust architecture

## Threat Model

### Potential Threats

#### External Threats

- **DDoS Attacks**: Overwhelming system resources
- **Injection Attacks**: SQL, NoSQL, command injection
- **Authentication Attacks**: Brute force, credential stuffing
- **Data Breaches**: Unauthorized data access
- **MITM Attacks**: Man-in-the-middle attacks

#### Internal Threats

- **Insider Threats**: Malicious or negligent employees
- **Privilege Escalation**: Gaining unauthorized access
- **Data Exfiltration**: Unauthorized data export

#### System Threats

- **Vulnerabilities**: Software vulnerabilities
- **Misconfigurations**: Insecure configurations
- **Zero-day Exploits**: Unknown vulnerabilities

### Attack Vectors

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │────│   API Gateway   │────│   Backend       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   XSS/CSRF      │    │  Auth Bypass    │    │  Injection      │
│   Clickjacking  │    │  Rate Limiting  │    │  Privilege Esc  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Authentication & Authorization

### Authentication

#### Password Policy

```typescript
// Password requirements
const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
};

// Password validation
function validatePassword(password: string, userInfo: UserInfo): ValidationResult {
  const errors: string[] = [];

  if (password.length < passwordPolicy.minLength) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > passwordPolicy.maxLength) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  if (isCommonPassword(password)) {
    errors.push('Password is too common. Please choose a more secure password');
  }

  // Check for user information in password
  if (containsUserInfo(password, userInfo)) {
    errors.push('Password cannot contain your personal information');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

#### Multi-Factor Authentication (MFA)

```typescript
// MFA implementation using TOTP
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Generate MFA secret
function generateMFASecret(userEmail: string): MFASecret {
  return speakeasy.generateSecret({
    name: `Smart AI Hub (${userEmail})`,
    issuer: 'Smart AI Hub',
    length: 32,
  });
}

// Generate QR code for MFA setup
async function generateMFAQRCode(secret: string): Promise<string> {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret,
    label: 'Smart AI Hub',
    issuer: 'Smart AI Hub',
  });

  return qrcode.toDataURL(otpauthUrl);
}

// Verify MFA token
function verifyMFAToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow 2 steps before and after
  });
}
```

#### Session Management

```typescript
// Secure session configuration
const sessionConfig = {
  name: 'smartaihub.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
};

// Session middleware
app.use(session(sessionConfig));

// Session validation middleware
function validateSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check session age
  const sessionAge = Date.now() - req.session.createdAt;
  const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

  if (sessionAge > maxSessionAge) {
    req.session.destroy();
    return res.status(401).json({ error: 'Session expired' });
  }

  next();
}
```

### Authorization

#### Role-Based Access Control (RBAC)

```typescript
// Role definitions
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

// Permission definitions
enum Permission {
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  DELETE_USERS = 'delete:users',
  READ_CREDITS = 'read:credits',
  WRITE_CREDITS = 'write:credits',
  ACCESS_AI_MODELS = 'access:ai_models',
  MANAGE_SYSTEM = 'manage:system',
}

// Role-Permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.DELETE_USERS,
    Permission.READ_CREDITS,
    Permission.WRITE_CREDITS,
    Permission.ACCESS_AI_MODELS,
    Permission.MANAGE_SYSTEM,
  ],
  [Role.MODERATOR]: [
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.READ_CREDITS,
    Permission.ACCESS_AI_MODELS,
  ],
  [Role.USER]: [Permission.READ_CREDITS, Permission.WRITE_CREDITS, Permission.ACCESS_AI_MODELS],
};

// Authorization middleware
function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role;
    const userPermissions = rolePermissions[userRole] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Usage example
app.get('/api/users', requirePermission(Permission.READ_USERS), getUserList);
app.post('/api/users', requirePermission(Permission.WRITE_USERS), createUser);
```

#### Resource-Based Access Control

```typescript
// Resource ownership check
function checkResourceOwnership(resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params.id;
    const userId = req.user?.id;

    try {
      const resource = await getResourceById(resourceType, resourceId);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Admin can access all resources
      if (req.user?.role === Role.ADMIN) {
        req.resource = resource;
        return next();
      }

      // Check ownership
      if (resource.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Usage example
app.get('/api/credits/:id', authenticate, checkResourceOwnership('credit'), getCreditDetails);
```

## Data Protection

### Encryption at Rest

```typescript
// Database encryption configuration
const encryptionConfig = {
  // Transparent Data Encryption (TDE)
  tde: {
    enabled: true,
    algorithm: 'AES-256',
  },

  // Column-level encryption
  columnEncryption: {
    sensitiveFields: ['email', 'phoneNumber', 'creditCard', 'ssn'],
    algorithm: 'AES-256-GCM',
    keyRotationPeriod: 90, // days
  },
};

// Field-level encryption
import crypto from 'crypto';

class FieldEncryption {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;

  static encrypt(text: string, key: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('smartaihub', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  static decrypt(encryptedData: EncryptedData, key: string): string {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('smartaihub', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Encryption in Transit

```typescript
// HTTPS configuration
const httpsConfig = {
  // TLS configuration
  tls: {
    version: 'TLSv1.3',
    ciphers: ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_128_GCM_SHA256'],
    honorCipherOrder: true,
  },

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Certificate configuration
  certificate: {
    autoRenew: true,
    renewalPeriod: 30, // days
    provider: 'letsencrypt',
  },
};

// Express HTTPS setup
import spdy from 'spdy';
import fs from 'fs';

const options = {
  key: fs.readFileSync('./ssl/private.key'),
  cert: fs.readFileSync('./ssl/certificate.crt'),
  ca: fs.readFileSync('./ssl/ca_bundle.crt'),

  // SPDY/HTTP2 configuration
  spdy: {
    protocols: ['h2', 'http/1.1'],
    plain: false,
  },
};

spdy.createServer(options, app).listen(443, () => {
  console.log('Secure server running on port 443');
});
```

### Data Masking

```typescript
// Data masking utilities
class DataMasker {
  static maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  }

  static maskPhoneNumber(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  static maskCreditCard(cardNumber: string): string {
    return cardNumber.replace(/\d(?=\d{4})/g, '*');
  }

  static maskSSN(ssn: string): string {
    return ssn.replace(/\d{3}-\d{2}-\d{4}/, '***-**-****');
  }
}

// Usage in API responses
function sanitizeUserData(user: User): SafeUser {
  return {
    id: user.id,
    email: DataMasker.maskEmail(user.email),
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  };
}
```

## API Security

### Input Validation

```typescript
// Comprehensive input validation
import Joi from 'joi';

// Validation schemas
const schemas = {
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
  }),

  userUpdate: Joi.object({
    firstName: Joi.string().min(1).max(50),
    lastName: Joi.string().min(1).max(50),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  }),

  creditPurchase: Joi.object({
    packageId: Joi.string().required(),
    paymentMethodId: Joi.string().required(),
    amount: Joi.number().positive().max(10000).required(),
  }),
};

// Validation middleware
function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    req.body = value;
    next();
  };
}

// Usage example
app.post('/api/users/register', validate(schemas.userRegistration), registerUser);
```

### Rate Limiting

```typescript
// Advanced rate limiting
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General rate limiter
const generalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiter
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});

// API-specific rate limiter
const createApiLimiter = (windowMs: number, max: number) =>
  rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs,
    max,
    keyGenerator: (req) => req.user?.id || req.ip,
  });

// Usage example
app.use('/api/', generalLimiter);
app.post('/api/auth/login', authLimiter, login);
app.use('/api/mcp/', createApiLimiter(60 * 1000, 60)); // 60 requests per minute
```

### API Key Management

```typescript
// API key management
import crypto from 'crypto';
import { ApiKey } from '../models/api-key';

class ApiKeyService {
  // Generate new API key
  static generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create API key for user
  static async createApiKey(userId: string, name: string): Promise<ApiKey> {
    const key = this.generateApiKey();
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    return ApiKey.create({
      userId,
      name,
      keyHash,
      permissions: ['read', 'write'],
      createdAt: new Date(),
    });
  }

  // Validate API key
  static async validateApiKey(key: string): Promise<ApiKey | null> {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    return ApiKey.findOne({
      where: { keyHash, active: true },
      include: [{ model: User, attributes: ['id', 'role'] }],
    });
  }

  // Revoke API key
  static async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await ApiKey.update({ active: false }, { where: { id: keyId, userId } });

    return result[0] > 0;
  }
}

// API key authentication middleware
async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const keyData = await ApiKeyService.validateApiKey(apiKey);

    if (!keyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await keyData.update({ lastUsedAt: new Date() });

    req.user = keyData.user;
    req.apiKey = keyData;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}
```

## Infrastructure Security

### Network Security

```yaml
# Docker network security configuration
version: '3.8'

networks:
  # Frontend network
  frontend:
    driver: bridge
    internal: false

  # Backend network (internal)
  backend:
    driver: bridge
    internal: true

  # Database network (isolated)
  database:
    driver: bridge
    internal: true

services:
  # Frontend service
  frontend:
    networks:
      - frontend

  # API Gateway
  api-gateway:
    networks:
      - frontend
      - backend

  # Backend services
  auth-service:
    networks:
      - backend

  core-service:
    networks:
      - backend

  # Database
  postgres:
    networks:
      - database

  # Redis
  redis:
    networks:
      - database
```

### Firewall Configuration

```bash
#!/bin/bash
# Firewall setup script

# Reset firewall rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X

# Set default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP and HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow application ports (internal)
iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
iptables -A INPUT -p tcp --dport 3002 -j ACCEPT
iptables -A INPUT -p tcp --dport 3003 -j ACCEPT
iptables -A INPUT -p tcp --dport 3004 -j ACCEPT

# Rate limiting
iptables -A INPUT -p tcp --dport 22 -m limit --limit 3/min --limit-burst 3 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j DROP

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "Dropped: "

# Save rules
iptables-save > /etc/iptables/rules.v4
```

### Container Security

```dockerfile
# Secure Dockerfile example
FROM node:18-alpine AS builder

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=nextjs:nodejs . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

## Application Security

### Secure Headers

```typescript
// Security headers middleware
import helmet from 'helmet';

const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-XSS-Protection
  xssFilter: true,
});

app.use(securityHeaders);
```

### Cross-Site Scripting (XSS) Prevention

```typescript
// XSS prevention utilities
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

class XSSProtection {
  // Sanitize HTML content
  static sanitizeHTML(html: string): string {
    return purify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: [],
    });
  }

  // Escape user input
  static escapeInput(input: string): string {
    return input
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;');
  }

  // Validate and sanitize user-generated content
  static processUserContent(content: string): string {
    // First escape the input
    const escaped = this.escapeInput(content);

    // Then sanitize if it's supposed to be HTML
    return this.sanitizeHTML(escaped);
  }
}

// Usage in API endpoints
app.post('/api/content', (req, res) => {
  const { content } = req.body;

  // Sanitize user content
  const sanitizedContent = XSSProtection.processUserContent(content);

  // Store sanitized content
  // ...
});
```

### SQL Injection Prevention

```typescript
// Secure database queries with parameterized statements
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class UserService {
  // Secure user lookup
  static async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  // Secure user search
  static async searchUsers(query: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }

  // Secure user update
  static async updateUser(userId: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}

// Avoid raw SQL queries when possible
// If raw SQL is necessary, use parameterized queries
class RawQueryService {
  static async getUserStats(): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT 
        role,
        COUNT(*) as count,
        AVG(credits) as avg_credits
      FROM users
      GROUP BY role
    `;

    return result;
  }
}
```

## Security Testing

### Penetration Testing

```typescript
// Security test examples
import request from 'supertest';
import { app } from '../src/app';

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should prevent brute force attacks', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Make multiple login attempts
      const attempts = [];
      for (let i = 0; i < 10; i++) {
        attempts.push(request(app).post('/api/auth/login').send(credentials));
      }

      const results = await Promise.allSettled(attempts);

      // Should be rate limited after several attempts
      const rateLimited = results.some(
        (result) => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimited).toBe(true);
    });

    it('should prevent SQL injection in login', async () => {
      const maliciousInput = {
        email: "'; DROP TABLE users; --",
        password: 'password',
      };

      const response = await request(app).post('/api/auth/login').send(maliciousInput);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('validation');
    });
  });

  describe('API Security', () => {
    it('should prevent XSS in API responses', async () => {
      const maliciousContent = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post('/api/content')
        .send({ content: maliciousContent })
        .set('Authorization', 'Bearer valid-token');

      expect(response.body.content).not.toContain('<script>');
    });

    it('should enforce rate limiting', async () => {
      const requests = Array(20)
        .fill(null)
        .map(() =>
          request(app).get('/api/credits/balance').set('Authorization', 'Bearer valid-token')
        );

      const results = await Promise.allSettled(requests);
      const rateLimited = results.some(
        (result) => result.status === 'fulfilled' && result.value.status === 429
      );

      expect(rateLimited).toBe(true);
    });
  });
});
```

### Vulnerability Scanning

```bash
#!/bin/bash
# Security scan script

echo "Running security scans..."

# npm audit
echo "Running npm audit..."
npm audit --audit-level moderate

# Snyk vulnerability scan
echo "Running Snyk scan..."
snyk test --severity-threshold=high

# OWASP ZAP baseline scan
echo "Running OWASP ZAP scan..."
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3001 \
  -J gl-sast-report.json

# Semgrep security scan
echo "Running Semgrep scan..."
semgrep --config=auto --severity=ERROR .

echo "Security scans completed."
```

## Incident Response

### Security Incident Response Plan

1. **Detection**
   - Monitoring alerts
   - Anomaly detection
   - User reports

2. **Analysis**
   - Incident classification
   - Impact assessment
   - Root cause analysis

3. **Containment**
   - Isolate affected systems
   - Block malicious IPs
   - Disable compromised accounts

4. **Eradication**
   - Remove malware
   - Patch vulnerabilities
   - Update security controls

5. **Recovery**
   - Restore systems
   - Monitor for re-infection
   - Post-incident review

### Incident Response Tools

```typescript
// Incident response automation
class IncidentResponse {
  // Block suspicious IP
  static async blockIP(ip: string): Promise<void> {
    // Add to firewall rules
    await this.addFirewallRule(ip);

    // Add to blocklist in Redis
    await redis.setex(`blocked:${ip}`, 86400, 'true');

    // Log the action
    logger.warn('IP blocked due to suspicious activity', { ip });
  }

  // Disable compromised account
  static async disableAccount(userId: string): Promise<void> {
    await User.update(
      {
        active: false,
        disabledAt: new Date(),
        disabledReason: 'Security incident',
      },
      { where: { id: userId } }
    );

    // Revoke all sessions
    await this.revokeAllSessions(userId);

    // Send notification
    await notificationService.sendSecurityAlert(userId);
  }

  // Create security incident
  static async createIncident(details: IncidentDetails): Promise<Incident> {
    return Incident.create({
      type: details.type,
      severity: details.severity,
      description: details.description,
      affectedUsers: details.affectedUsers,
      status: 'open',
      createdAt: new Date(),
    });
  }
}
```

## Compliance

### GDPR Compliance

```typescript
// GDPR compliance utilities
class GDPRService {
  // Right to access
  static async getUserData(userId: string): Promise<UserDataExport> {
    const user = await User.findByPk(userId);
    const credits = await CreditAccount.findAll({ where: { userId } });
    const usageLogs = await UsageLog.findAll({ where: { userId } });

    return {
      personalData: user,
      financialData: credits,
      usageData: usageLogs,
      exportDate: new Date(),
    };
  }

  // Right to erasure
  static async deleteUserData(userId: string): Promise<void> {
    // Anonymize user data instead of deleting for audit purposes
    await User.update(
      {
        email: `deleted-${userId}@deleted.com`,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        address: null,
      },
      { where: { id: userId } }
    );

    // Delete sensitive data
    await CreditAccount.destroy({ where: { userId } });
    await UsageLog.destroy({ where: { userId } });

    // Revoke all API keys
    await ApiKey.update({ active: false }, { where: { userId } });
  }

  // Data processing consent
  static async updateConsent(userId: string, consent: ConsentData): Promise<void> {
    await UserConsent.upsert({
      userId,
      ...consent,
      updatedAt: new Date(),
    });
  }
}
```

### SOC 2 Compliance

```typescript
// SOC 2 compliance logging
class ComplianceLogger {
  // Log data access
  static logDataAccess(userId: string, resource: string, action: string): void {
    logger.info('Data access', {
      userId,
      resource,
      action,
      timestamp: new Date(),
      compliance: 'SOC2',
    });
  }

  // Log security events
  static logSecurityEvent(event: SecurityEvent): void {
    logger.warn('Security event', {
      type: event.type,
      severity: event.severity,
      description: event.description,
      timestamp: new Date(),
      compliance: 'SOC2',
    });
  }

  // Log changes to sensitive data
  static logDataChange(userId: string, resource: string, changes: any): void {
    logger.info('Data change', {
      userId,
      resource,
      changes,
      timestamp: new Date(),
      compliance: 'SOC2',
    });
  }
}
```

## Security Checklist

### Development Phase

- [ ] Implement secure authentication and authorization
- [ ] Validate all inputs and sanitize outputs
- [ ] Use parameterized queries for database operations
- [ ] Implement proper error handling without information disclosure
- [ ] Use secure headers and CSP
- [ ] Implement rate limiting and throttling
- [ ] Secure API endpoints with proper authentication
- [ ] Implement secure session management
- [ ] Use HTTPS for all communications
- [ ] Log security events and monitor for anomalies

### Deployment Phase

- [ ] Configure secure network segmentation
- [ ] Set up firewall rules
- [ ] Implement SSL/TLS with strong ciphers
- [ ] Configure security headers
- [ ] Set up monitoring and alerting
- [ ] Implement backup and recovery procedures
- [ ] Configure intrusion detection systems
- [ ] Regularly scan for vulnerabilities
- [ ] Implement proper secret management
- [ ] Configure logging and audit trails

### Operational Phase

- [ ] Regular security audits and assessments
- [ ] Penetration testing
- [ ] Vulnerability scanning and patching
- [ ] Security training for development team
- [ ] Incident response planning and testing
- [ ] Review and update security policies
- [ ] Monitor for security threats
- [ ] Regular backup testing
- [ ] Access review and cleanup
- [ ] Compliance verification

---

For additional security information or to report security vulnerabilities, please contact the security team at security@smartaihub.com.
