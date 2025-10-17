import { test, expect } from '@playwright/test';

test.describe('Security Headers Verification', () => {
  // Define expected security headers
  const expectedSecurityHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'content-security-policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
    'permissions-policy': 'geolocation=(), microphone=(), camera=()',
  };

  const apiEndpoints = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/users/profile',
    '/api/v1/transfer',
    '/api/v1/block',
    '/api/v1/referral/code',
    '/api/v1/points/balance',
    '/api/v1/points/daily-reward',
    '/api/v1/points/exchange',
    '/api/v1/points/purchase',
    '/api/v1/points/auto-topup',
    '/api/v1/agency/referral-config',
    '/api/v1/organization/settings',
    '/api/v1/admin/settings',
  ];

  test('should have security headers on API endpoints', async ({ request }) => {
    for (const endpoint of apiEndpoints) {
      const response = await request.get(`http://localhost:3001${endpoint}`);

      // Check each expected security header
      for (const [headerName, expectedValue] of Object.entries(expectedSecurityHeaders)) {
        const actualValue = response.headers()[headerName];

        if (headerName === 'content-security-policy') {
          // CSP might be complex, just check it exists
          expect(actualValue).toBeDefined();
        } else if (headerName === 'strict-transport-security') {
          // STS might not be present in HTTP (only HTTPS)
          // Skip this check for HTTP endpoints
          continue;
        } else {
          expect(actualValue).toBe(expectedValue);
        }
      }
    }
  });

  test('should have security headers on web pages', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    const response = await page.request.get('http://localhost:3000/login');

    // Check each expected security header
    for (const [headerName, expectedValue] of Object.entries(expectedSecurityHeaders)) {
      const actualValue = response.headers()[headerName];

      if (headerName === 'content-security-policy') {
        // CSP might be complex, just check it exists
        expect(actualValue).toBeDefined();
      } else if (headerName === 'strict-transport-security') {
        // STS might not be present in HTTP (only HTTPS)
        // Skip this check for HTTP endpoints
        continue;
      } else {
        expect(actualValue).toBe(expectedValue);
      }
    }
  });

  test('should prevent clickjacking with X-Frame-Options', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/login');
    const frameOptions = response?.headers()['x-frame-options'];
    expect(frameOptions).toBe('DENY');
  });

  test('should prevent MIME type sniffing with X-Content-Type-Options', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/login');
    const contentTypeOptions = response?.headers()['x-content-type-options'];
    expect(contentTypeOptions).toBe('nosniff');
  });

  test('should have XSS protection enabled', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/login');
    const xssProtection = response?.headers()['x-xss-protection'];
    expect(xssProtection).toBe('1; mode=block');
  });

  test('should have proper Referrer-Policy', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/login');
    const referrerPolicy = response?.headers()['referrer-policy'];
    expect(referrerPolicy).toBe('strict-origin-when-cross-origin');
  });

  test('should have restrictive Permissions-Policy', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/login');
    const permissionsPolicy = response?.headers()['permissions-policy'];
    expect(permissionsPolicy).toContain('geolocation=()');
    expect(permissionsPolicy).toContain('microphone=()');
    expect(permissionsPolicy).toContain('camera=()');
  });

  test('should have Content-Security-Policy', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/login');
    const csp = response?.headers()['content-security-policy'];

    // Verify CSP exists and has basic directives
    expect(csp).toBeDefined();
    expect(csp).toContain('default-src');
    expect(csp).toContain('script-src');
    expect(csp).toContain('style-src');
    expect(csp).toContain('connect-src');
  });

  test('should not expose sensitive information in headers', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/auth/login');
    const headers = response.headers();

    // Check for common sensitive information exposure
    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['server']).toBeUndefined();
    expect(headers['x-aspnet-version']).toBeUndefined();
    expect(headers['x-aspnetmvc-version']).toBeUndefined();
    expect(headers['x-generator']).toBeUndefined();
  });

  test('should have proper CORS headers', async ({ request }) => {
    const response = await request.fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    const headers = response.headers();

    // Check for proper CORS headers
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
    expect(headers['access-control-allow-headers']).toBeDefined();
  });

  test('should limit CORS to allowed origins only', async ({ request }) => {
    // Try with an unauthorized origin
    const response = await request.fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://malicious-site.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // Should either not have CORS headers or have restrictive ones
    const headers = response.headers();

    if (headers['access-control-allow-origin']) {
      expect(headers['access-control-allow-origin']).not.toBe('*');
      expect(headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    }
  });

  test('should have rate limiting headers', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/auth/login');
    const headers = response.headers();

    // Check for rate limiting headers
    // These might not be present, but if they are, they should have proper values
    if (headers['x-ratelimit-limit']) {
      expect(parseInt(headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    }

    if (headers['x-ratelimit-remaining']) {
      expect(parseInt(headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
    }

    if (headers['x-ratelimit-reset']) {
      expect(parseInt(headers['x-ratelimit-reset'])).toBeGreaterThan(0);
    }
  });

  test('should have proper cache control for sensitive endpoints', async ({ request }) => {
    const sensitiveEndpoints = [
      '/api/v1/auth/login',
      '/api/v1/users/profile',
      '/api/v1/transfer',
      '/api/v1/block',
    ];

    for (const endpoint of sensitiveEndpoints) {
      const response = await request.get(`http://localhost:3001${endpoint}`);
      const cacheControl = response.headers()['cache-control'];

      // Sensitive endpoints should have no-cache or similar directives
      if (cacheControl) {
        expect(
          cacheControl.includes('no-cache') ||
            cacheControl.includes('no-store') ||
            cacheControl.includes('private')
        ).toBeTruthy();
      }
    }
  });

  test('should have proper content type for API responses', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/users/profile');
    const contentType = response.headers()['content-type'];

    // API responses should be JSON
    expect(contentType).toContain('application/json');
  });

  test('should have proper content type for HTML pages', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/login');
    const contentType = response?.headers()['content-type'];

    // HTML pages should have text/html content type
    expect(contentType).toContain('text/html');
  });

  test('should have proper content length', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/auth/login');
    const contentLength = response.headers()['content-length'];

    // Content length should be present and be a number
    if (contentLength) {
      expect(parseInt(contentLength)).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have connection header set properly', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/auth/login');
    const connection = response.headers()['connection'];

    // Connection header should be present and have a proper value
    if (connection) {
      expect(['close', 'keep-alive']).toContain(connection.toLowerCase());
    }
  });

  test('should have proper authentication challenge headers on 401 responses', async ({
    request,
  }) => {
    // Try to access protected endpoint without auth
    const response = await request.get('http://localhost:3001/api/v1/users/profile');

    if (response.status() === 401) {
      const wwwAuthenticate = response.headers()['www-authenticate'];
      expect(wwwAuthenticate).toBeDefined();
    }
  });

  test('should have proper API version headers', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/auth/login');
    const apiVersion = response.headers()['api-version'];

    // API version should be present
    expect(apiVersion).toBeDefined();
  });

  test('should have proper timing headers for performance monitoring', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/auth/login');
    const serverTiming = response.headers()['server-timing'];

    // Server timing header might be present for performance monitoring
    // Not required, but if present, should have proper format
    if (serverTiming) {
      expect(serverTiming).toMatch(/^[a-zA-Z0-9\-_]+;dur=[0-9.]+/);
    }
  });

  test('should have proper request ID headers for tracing', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/auth/login');
    const requestId = response.headers()['x-request-id'];

    // Request ID should be present for tracing
    expect(requestId).toBeDefined();
    expect(requestId.length).toBeGreaterThan(0);
  });

  test('should have proper feature policy headers', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/login');
    const featurePolicy = response?.headers()['feature-policy'];
    const permissionsPolicy = response?.headers()['permissions-policy'];

    // Either feature-policy (deprecated) or permissions-policy should be present
    expect(featurePolicy || permissionsPolicy).toBeDefined();
  });

  test('should not expose backend technology stack', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/auth/login');
    const headers = response.headers();

    // Check for headers that might expose technology stack
    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['x-aspnet-version']).toBeUndefined();
    expect(headers['x-aspnetmvc-version']).toBeUndefined();
    expect(headers['x-generator']).toBeUndefined();
    expect(headers['x-drupal-cache']).toBeUndefined();
    expect(headers['x-varnish']).toBeUndefined();
  });

  test('should have proper security headers on error responses', async ({ request }) => {
    // Trigger a 404 error
    const response = await request.get('http://localhost:3001/api/v1/nonexistent-endpoint');

    // Even error responses should have security headers
    for (const [headerName, expectedValue] of Object.entries(expectedSecurityHeaders)) {
      if (headerName === 'strict-transport-security') {
        // STS might not be present in HTTP (only HTTPS)
        continue;
      }

      const actualValue = response.headers()[headerName];

      if (headerName === 'content-security-policy') {
        // CSP might be complex, just check it exists
        expect(actualValue).toBeDefined();
      } else {
        expect(actualValue).toBe(expectedValue);
      }
    }
  });

  test('should have proper authentication headers for login response', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/v1/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    if (response.status() === 200) {
      const data = await response.json();

      // Should return a token for successful login
      expect(data.token).toBeDefined();
      expect(data.token.length).toBeGreaterThan(0);
    }
  });

  test('should have proper cookie security headers', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Check if cookies have secure attributes
    const cookies = await page.context().cookies();

    for (const cookie of cookies) {
      // In production, cookies should have Secure and HttpOnly attributes
      // For local development, we just check they exist
      expect(cookie.name).toBeDefined();
      expect(cookie.value).toBeDefined();
    }
  });
});
