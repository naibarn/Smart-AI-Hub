# Security Headers Implementation Guide

This document provides a comprehensive guide to the security headers implementation in Smart AI Hub, including configuration, testing, and monitoring.

## Table of Contents

1. [Overview](#overview)
2. [Implemented Security Headers](#implemented-security-headers)
3. [NGINX Configuration](#nginx-configuration)
4. [Backend Security Configuration](#backend-security-configuration)
5. [Frontend Security Configuration](#frontend-security-configuration)
6. [Content Security Policy (CSP)](#content-security-policy-csp)
7. [Security Monitoring](#security-monitoring)
8. [Testing Security Headers](#testing-security-headers)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Overview

Smart AI Hub implements comprehensive security headers to protect against various web vulnerabilities including:

- Cross-Site Scripting (XSS)
- Clickjacking
- MIME-type sniffing
- Man-in-the-middle attacks
- Data leakage
- Unauthorized cross-origin requests

The security headers are implemented at multiple layers:

1. **NGINX反向代理** - Primary security headers enforcement
2. **Backend Services** - Additional API-specific security via Helmet.js
3. **Frontend** - Meta tags and CSP policies
4. **Monitoring** - Real-time violation tracking and reporting

## Implemented Security Headers

### Core Security Headers

| Header | Purpose | Value | Implementation |
|--------|---------|-------|----------------|
| `X-Content-Type-Options` | Prevents MIME-type sniffing | `nosniff` | NGINX + Helmet |
| `X-Frame-Options` | Prevents clickjacking | `DENY` | NGINX + Helmet |
| `X-XSS-Protection` | Enables XSS filtering | `1; mode=block` | NGINX + Helmet |
| `Referrer-Policy` | Controls referrer information | `strict-origin-when-cross-origin` | NGINX + Helmet |
| `X-DNS-Prefetch-Control` | Controls DNS prefetching | `off` | NGINX + Helmet |
| `X-Download-Options` | Prevents file download execution | `noopen` | NGINX + Helmet |
| `X-Permitted-Cross-Domain-Policies` | Restricts cross-domain policies | `none` | NGINX + Helmet |
| `Permissions-Policy` | Controls browser feature access | Restricted | NGINX + Helmet |

### HTTPS-Only Headers

| Header | Purpose | Value | Environment |
|--------|---------|-------|-------------|
| `Strict-Transport-Security` (HSTS) | Enforces HTTPS | `max-age=31536000; includeSubDomains; preload` | Production + Staging |

### Content Security Policy (CSP)

Environment-specific CSP policies are implemented:

#### Production CSP (Strict)
```
default-src 'self'; 
script-src 'self' 'nonce-{NONCE}'; 
style-src 'self' 'nonce-{NONCE}'; 
img-src 'self' data: https:; 
connect-src 'self' https://api.smart-ai-hub.com; 
font-src 'self'; 
object-src 'none'; 
frame-ancestors 'none'; 
base-uri 'self'; 
form-action 'self'; 
upgrade-insecure-requests;
report-uri /api/v1/security/csp-report;
report-to default;
```

#### Staging CSP (Relaxed)
```
default-src 'self' 'unsafe-inline' 'unsafe-eval'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* ws://localhost:*; 
connect-src 'self' localhost:* ws://localhost:*; 
report-uri /api/v1/security/csp-report;
```

#### Development CSP (Permissive)
```
default-src 'self' 'unsafe-inline' 'unsafe-eval' *; 
script-src 'self' 'unsafe-inline' 'unsafe-eval' *; 
connect-src 'self' *; 
report-uri /api/v1/security/csp-report;
```

## NGINX Configuration

### Production Configuration (`nginx.prod.conf`)

```nginx
server {
    listen 443 ssl http2;
    server_name smart-ai-hub.com www.smart-ai-hub.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/smart-ai-hub.com.crt;
    ssl_certificate_key /etc/ssl/private/smart-ai-hub.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-DNS-Prefetch-Control "off" always;
    add_header X-Download-Options "noopen" always;
    add_header X-Permitted-Cross-Domain-Policies "none" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=()" always;
    
    # Content Security Policy
    set $csp "";
    set $csp "${csp}default-src 'self'; ";
    set $csp "${csp}script-src 'self' 'nonce-$csp_nonce'; ";
    set $csp "${csp}style-src 'self' 'nonce-$csp_nonce'; ";
    set $csp "${csp}img-src 'self' data: https:; ";
    set $csp "${csp}connect-src 'self' https://api.smart-ai-hub.com; ";
    set $csp "${csp}font-src 'self'; ";
    set $csp "${csp}object-src 'none'; ";
    set $csp "${csp}frame-ancestors 'none'; ";
    set $csp "${csp}base-uri 'self'; ";
    set $csp "${csp}form-action 'self'; ";
    set $csp "${csp}upgrade-insecure-requests; ";
    set $csp "${csp}report-uri /api/v1/security/csp-report; ";
    add_header Content-Security-Policy $csp always;
    
    # Existing configuration...
}
```

### Staging Configuration (`staging/nginx.staging.conf`)

Similar to production but with relaxed CSP policies for development testing.

## Backend Security Configuration

### Shared Security Module (`packages/shared/security/headers.ts`)

The shared security module provides centralized security configuration for all backend services:

```typescript
import helmet from 'helmet';
import crypto from 'crypto';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NODE_ENV === 'staging';
const isDevelopment = process.env.NODE_ENV === 'development';

// CSP nonce generation
export const generateCspNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};

// Environment-specific CSP configuration
const getCspConfig = () => {
  if (isProduction) {
    return {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
      reportOnly: false,
    };
  }
  // ... other environments
};

// Helmet configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: getCspConfig(),
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
});
```

### Service Implementation

Each backend service applies the security headers as the first middleware:

```typescript
// Example: auth-service/src/app.js
const express = require('express');
const { securityHeaders, generateCspNonce } = require('@smart-ai-hub/shared/security/headers');

const app = express();

// Apply security headers FIRST
app.use(securityHeaders);

// CSP nonce middleware
app.use((req, res, next) => {
  res.locals.cspNonce = generateCspNonce();
  next();
});

// Other middleware and routes...
```

## Frontend Security Configuration

### HTML Meta Tags (`packages/frontend/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta http-equiv="X-DNS-Prefetch-Control" content="off">
  <meta http-equiv="X-Download-Options" content="noopen">
  <meta http-equiv="X-Permitted-Cross-Domain-Policies" content="none">
  <meta http-equiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=(), payment=(), usb=()">
  
  <!-- CSP Meta Tag (fallback) -->
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';">
  
  <title>Smart AI Hub</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

## Content Security Policy (CSP)

### CSP Nonce Implementation

CSP nonces are generated for each request and used for inline scripts and styles:

```typescript
// Backend middleware
app.use((req, res, next) => {
  res.locals.cspNonce = generateCspNonce();
  next();
});

// Frontend template usage
<script nonce="{{cspNonce}}">
  // Inline script content
</script>

<style nonce="{{cspNonce}}">
  /* Inline style content */
</style>
```

### CSP Violation Reporting

CSP violations are automatically reported to the monitoring endpoint:

```javascript
// CSP violation report endpoint
app.post('/api/v1/security/csp-report', (req, res) => {
  const violation = req.body;
  
  // Log violation
  console.warn('CSP Violation:', violation);
  
  // Store for monitoring
  securityMonitor.recordViolation(violation);
  
  // Respond with success
  res.status(204).send();
});
```

## Security Monitoring

### Admin Security Dashboard

Access the security monitoring dashboard at: `/admin/security/headers`

Features:
- Real-time security headers status
- CSP violation tracking
- Security score calculation
- Recommendations for improvement
- Header testing functionality

### Security Status API

```bash
GET /api/v1/security/status
```

Response:
```json
{
  "status": "success",
  "data": {
    "headers": {
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "x-xss-protection": "1; mode=block",
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
      "referrer-policy": "strict-origin-when-cross-origin",
      "content-security-policy": "default-src 'self'...",
      "permissions-policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
    },
    "score": "A+",
    "violations": [
      {
        "id": "viol_123456",
        "timestamp": "2023-10-15T10:30:00Z",
        "documentUri": "https://smart-ai-hub.com/",
        "violatedDirective": "script-src",
        "blockedUri": "https://evil.com/bad.js",
        "severity": "high"
      }
    ],
    "recommendations": [
      "Enable HSTS preload",
      "Remove unsafe-inline from CSP",
      "Add subresource integrity"
    ]
  }
}
```

## Testing Security Headers

### Automated Testing Script

Use the provided test scripts to verify security headers:

#### Linux/macOS
```bash
./scripts/test-security-headers.sh --help
./scripts/test-security-headers.sh --base-url https://api.smart-ai-hub.com --frontend-url https://smart-ai-hub.com --verbose
```

#### Windows
```cmd
scripts\test-security-headers.bat --help
scripts\test-security-headers.bat --base-url https://api.smart-ai-hub.com --frontend-url https://smart-ai-hub.com --verbose
```

### Manual Testing

#### 1. Browser Developer Tools

1. Open your browser's developer tools
2. Go to the "Network" tab
3. Refresh the page
4. Click on the main document request
5. Check the "Response Headers" section for security headers

#### 2. curl Command

```bash
curl -I https://smart-ai-hub.com
```

Expected headers should include all security headers listed in the implementation section.

#### 3. Online Security Testing

- **securityheaders.com** - Test for A+ rating
- **Mozilla Observatory** - Test for 90+ score
- **SSL Labs SSL Test** - Test for A+ SSL configuration

## Troubleshooting

### Common Issues and Solutions

#### 1. CSP Violations

**Problem**: Console shows CSP violation errors
**Solution**: 
1. Check the violation details in the security dashboard
2. Update CSP policy to allow the blocked resource
3. Use nonces instead of unsafe-inline where possible

#### 2. HSTS Not Applied

**Problem**: HSTS header not showing in development
**Solution**: HSTS is only enabled in production and staging environments for safety

#### 3. Mixed Content Errors

**Problem**: HTTPS site trying to load HTTP resources
**Solution**: 
1. Update all resource URLs to use HTTPS
2. Ensure `upgrade-insecure-requests` is in CSP

#### 4. Inline Scripts Blocked

**Problem**: Inline scripts not executing
**Solution**: 
1. Add CSP nonce to inline scripts: `<script nonce="{{nonce}}">`
2. Or move scripts to external files
3. Avoid `unsafe-inline` in production

#### 5. Font Loading Issues

**Problem**: Custom fonts not loading
**Solution**: 
1. Add font source to CSP: `font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com`
2. Check for mixed content issues

### Debug Mode

Enable debug mode for detailed security logging:

```bash
DEBUG=security:* npm start
```

## Best Practices

### 1. CSP Guidelines

- **Never use `unsafe-inline` in production**
- **Always use nonces for inline scripts/styles**
- **Be specific with allowed sources**
- **Enable CSP report-only during development**
- **Monitor CSP violations regularly**

### 2. HSTS Guidelines

- **Test HSTS in staging first**
- **Start with shorter max-age (e.g., 1 hour)**
- **Only enable preload after thorough testing**
- **Remember HSTS preload is permanent**

### 3. General Security

- **Regularly test with security scoring tools**
- **Keep all dependencies updated**
- **Monitor security advisories**
- **Implement security headers at all layers**
- **Use HTTPS everywhere**

### 4. Development Workflow

1. **Development**: Use relaxed CSP with `unsafe-inline`
2. **Staging**: Use production CSP in report-only mode
3. **Production**: Use strict CSP with enforcement

### 5. Monitoring

- **Set up alerts for high-severity CSP violations**
- **Regular security audits (monthly)**
- **Track security score trends**
- **Monitor for new security best practices**

## Security Score Calculation

The security score is calculated based on:

- **Headers Present** (60%): Each required header contributes points
- **CSP Strictness** (25%): Stricter CSP policies score higher
- **HSTS Configuration** (10%): Proper HSTS setup adds points
- **Violations** (-5% each): Recent violations reduce score

### Score Ratings

- **A+**: 95-100 points
- **A**: 90-94 points
- **B**: 80-89 points
- **C**: 70-79 points
- **D**: 60-69 points
- **F**: Below 60 points

## Maintenance

### Regular Tasks

1. **Weekly**: Check CSP violations
2. **Monthly**: Run security header tests
3. **Quarterly**: Review and update security policies
4. **Annually**: Complete security audit

### Update Process

1. Test changes in development
2. Deploy to staging with report-only CSP
3. Monitor for violations
4. Deploy to production with enforcement
5. Monitor for issues

## References

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/)
- [HTTP Strict Transport Security (HSTS)](https://tools.ietf.org/html/rfc6797)

---

For questions or issues with security headers implementation, please contact the security team or create an issue in the project repository.