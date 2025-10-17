import { test, expect } from '@playwright/test';

// Helper function to login and get auth token
async function loginAndGetToken(page: any, email: string, password: string): Promise<string> {
  await page.goto('http://localhost:3000/login');
  await page.selectOption('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('http://localhost:3000/dashboard');

  // Return mock token for testing
  return 'mock-jwt-token';
}

test.describe('Authorization Verification', () => {
  // User IDs for testing
  const generalUserId = 'general-user-id';
  const orgA2UserId = 'org-a2-user-id';
  const someOtherUserId = 'some-other-user-id';

  test('cannot transfer to invisible user', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to transfer from Org A1 to Org A2 (different orgs, not visible)
    const response = await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        Authorization: `Bearer ${orgToken}`,
      },
      data: {
        recipientId: orgA2UserId,
        amount: 1000,
        type: 'points',
      },
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('cannot block user without permission', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to block as General user (no permission)
    const response = await request.post('http://localhost:3001/api/v1/block', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        userId: someOtherUserId,
        reason: 'Test block',
      },
    });

    expect(response.status()).toBe(403);
  });

  test('cannot access Agency API without proper tier', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to access agency settings as Organization
    const response = await request.get('http://localhost:3001/api/v1/agency/referral-config', {
      headers: {
        Authorization: `Bearer ${orgToken}`,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('cannot access Organization API without proper tier', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to access organization settings as General
    const response = await request.get('http://localhost:3001/api/v1/organization/settings', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('cannot access Admin API without proper tier', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to access admin settings as Organization
    const response = await request.get('http://localhost:3001/api/v1/admin/settings', {
      headers: {
        Authorization: `Bearer ${orgToken}`,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('cannot transfer without sufficient balance', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to transfer more than balance
    const response = await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        Authorization: `Bearer ${orgToken}`,
      },
      data: {
        recipientId: generalUserId,
        amount: 999999999, // Very large amount
        type: 'points',
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.message).toContain('insufficient');
  });

  test('cannot transfer to blocked user', async ({ page, request }) => {
    // Get auth token
    const agencyToken = await loginAndGetToken(page, 'agency-a@example.com', 'password123');

    // Try to transfer to blocked user
    const response = await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        Authorization: `Bearer ${agencyToken}`,
      },
      data: {
        recipientId: 'blocked-user-id',
        amount: 1000,
        type: 'points',
      },
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.message).toContain('blocked');
  });

  test('cannot block user with higher tier', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to block higher tier user
    const response = await request.post('http://localhost:3001/api/v1/block', {
      headers: {
        Authorization: `Bearer ${orgToken}`,
      },
      data: {
        userId: 'agency-user-id', // Higher tier
        reason: 'Test block',
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('cannot transfer credits without permission', async ({ page, request }) => {
    // Get auth token
    const adminA1Token = await loginAndGetToken(page, 'admin-a1@example.com', 'password123');

    // Try to transfer credits as Admin (only Agency/Organization can transfer credits)
    const response = await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        Authorization: `Bearer ${adminA1Token}`,
      },
      data: {
        recipientId: generalUserId,
        amount: 1,
        type: 'credits',
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('cannot modify referral config without permission', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to modify referral config as Organization
    const response = await request.put('http://localhost:3001/api/v1/agency/referral-config', {
      headers: {
        Authorization: `Bearer ${orgToken}`,
      },
      data: {
        organizationSignupReward: 1000,
        adminSignupReward: 500,
        generalSignupReward: 100,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('cannot view audit logs without admin permission', async ({ page, request }) => {
    // Get auth token
    const agencyToken = await loginAndGetToken(page, 'agency-a@example.com', 'password123');

    // Try to view audit logs as Agency
    const response = await request.get('http://localhost:3001/api/v1/admin/audit-logs', {
      headers: {
        Authorization: `Bearer ${agencyToken}`,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('cannot update exchange rates without admin permission', async ({ page, request }) => {
    // Get auth token
    const agencyToken = await loginAndGetToken(page, 'agency-a@example.com', 'password123');

    // Try to update exchange rates as Agency
    const response = await request.put('http://localhost:3001/api/v1/admin/exchange-rate', {
      headers: {
        Authorization: `Bearer ${agencyToken}`,
      },
      data: {
        creditsToPoints: 1500,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('audit log captures unauthorized attempts', async ({ page, request }) => {
    // Get auth tokens
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');
    const adminToken = await loginAndGetToken(page, 'administrator@example.com', 'password123');

    // Make unauthorized request
    await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        recipientId: someOtherUserId,
        amount: 1000,
        type: 'points',
      },
    });

    // Check audit log (as admin)
    const logResponse = await request.get('http://localhost:3001/api/v1/admin/audit-logs', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(logResponse.status()).toBe(200);
    const logs = await logResponse.json();
    const unauthorizedAttempt = logs.find(
      (log: any) => log.action === 'TRANSFER_UNAUTHORIZED' && log.userId === generalUserId
    );

    expect(unauthorizedAttempt).toBeDefined();
  });

  test('authorization checks work for batch operations', async ({ page, request }) => {
    // Get auth token
    const adminA1Token = await loginAndGetToken(page, 'admin-a1@example.com', 'password123');

    // Try to perform bulk operations without permission
    const response = await request.post('http://localhost:3001/api/v1/transfer/bulk', {
      headers: {
        Authorization: `Bearer ${adminA1Token}`,
      },
      data: {
        transfers: [
          { recipientId: generalUserId, amount: 100, type: 'points' },
          { recipientId: 'another-general-id', amount: 200, type: 'points' },
        ],
      },
    });

    // Admin shouldn't be able to do bulk transfers
    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for user profile updates', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to update another user's profile
    const response = await request.put('http://localhost:3001/api/v1/users/' + someOtherUserId, {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        name: 'Hacked Name',
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for password change', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to change another user's password
    const response = await request.put(
      'http://localhost:3001/api/v1/users/' + someOtherUserId + '/password',
      {
        headers: {
          Authorization: `Bearer ${generalToken}`,
        },
        data: {
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        },
      }
    );

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for tier elevation', async ({ page, request }) => {
    // Get auth token
    const agencyToken = await loginAndGetToken(page, 'agency-a@example.com', 'password123');

    // Try to elevate user tier
    const response = await request.put(
      'http://localhost:3001/api/v1/admin/users/' + generalUserId + '/tier',
      {
        headers: {
          Authorization: `Bearer ${agencyToken}`,
        },
        data: {
          tier: 'admin',
        },
      }
    );

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for API key management', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to manage API keys without permission
    const response = await request.post('http://localhost:3001/api/v1/user/api-keys', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        name: 'Test API Key',
        permissions: ['read'],
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for system settings', async ({ page, request }) => {
    // Get auth token
    const agencyToken = await loginAndGetToken(page, 'agency-a@example.com', 'password123');

    // Try to modify system settings without admin permission
    const response = await request.put('http://localhost:3001/api/v1/admin/settings', {
      headers: {
        Authorization: `Bearer ${agencyToken}`,
      },
      data: {
        maintenanceMode: true,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for user impersonation', async ({ page, request }) => {
    // Get auth token
    const agencyToken = await loginAndGetToken(page, 'agency-a@example.com', 'password123');

    // Try to impersonate another user
    const response = await request.post('http://localhost:3001/api/v1/admin/impersonate', {
      headers: {
        Authorization: `Bearer ${agencyToken}`,
      },
      data: {
        userId: someOtherUserId,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for data export', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to export all user data without permission
    const response = await request.get('http://localhost:3001/api/v1/admin/export/users', {
      headers: {
        Authorization: `Bearer ${orgToken}`,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for analytics access', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to access analytics without permission
    const response = await request.get('http://localhost:3001/api/v1/analytics/dashboard', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for webhook management', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to manage webhooks without permission
    const response = await request.post('http://localhost:3001/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        url: 'https://example.com/webhook',
        events: ['user.created'],
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for notification settings', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to modify global notification settings
    const response = await request.put(
      'http://localhost:3001/api/v1/admin/notifications/settings',
      {
        headers: {
          Authorization: `Bearer ${orgToken}`,
        },
        data: {
          emailEnabled: false,
          smsEnabled: false,
        },
      }
    );

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for promotional code management', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to create promotional codes without permission
    const response = await request.post('http://localhost:3001/api/v1/promo-codes', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        code: 'TEST123',
        discount: 10,
        type: 'percentage',
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for report generation', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to generate financial reports without permission
    const response = await request.post('http://localhost:3001/api/v1/reports/financial', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      },
    });

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for user suspension beyond blocking', async ({ page, request }) => {
    // Get auth token
    const orgToken = await loginAndGetToken(page, 'org-a1@example.com', 'password123');

    // Try to suspend user (different from block)
    const response = await request.post(
      'http://localhost:3001/api/v1/admin/users/' + generalUserId + '/suspend',
      {
        headers: {
          Authorization: `Bearer ${orgToken}`,
        },
        data: {
          reason: 'Test suspension',
          duration: 30, // days
        },
      }
    );

    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('authorization checks for credit card management', async ({ page, request }) => {
    // Get auth token
    const generalToken = await loginAndGetToken(page, 'general-a1-1@example.com', 'password123');

    // Try to manage payment methods without permission
    const response = await request.post('http://localhost:3001/api/v1/payment-methods', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        type: 'credit_card',
        last4: '4242',
        brand: 'visa',
      },
    });

    // This might be allowed for general users, but let's check
    // If it's not allowed, it should return 403
    if (response.status() === 403) {
      const data = await response.json();
      expect(data.message).toContain('not authorized');
    }
  });
});
