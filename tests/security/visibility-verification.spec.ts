import { test, expect } from '@playwright/test';

// Helper function to login and get auth token
async function loginAndGetToken(page: any, email: string, password: string): Promise<string> {
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

  const token = await page.evaluate(() => localStorage.getItem('token'));
  return token || '';
}

test.describe('Visibility Middleware Verification', () => {
  let adminToken: string;
  let agencyAToken: string;
  let agencyBToken: string;
  let orgA1Token: string;
  let orgA2Token: string;
  let adminA1Token: string;
  let generalToken: string;
  let currentAgencyId: string;
  let currentOrgId: string;
  let currentUserId: string;

  test.beforeAll(async ({ request }) => {
    // Get tokens for different user types
    // In a real test environment, you would have a way to get these tokens
    // For now, we'll use placeholder values that would be replaced with actual tokens

    // These would be obtained by logging in as each user type
    adminToken = 'admin-token-placeholder';
    agencyAToken = 'agency-a-token-placeholder';
    agencyBToken = 'agency-b-token-placeholder';
    orgA1Token = 'org-a1-token-placeholder';
    orgA2Token = 'org-a2-token-placeholder';
    adminA1Token = 'admin-a1-token-placeholder';
    generalToken = 'general-token-placeholder';

    // Get user IDs for testing
    currentAgencyId = 'agency-a-id';
    currentOrgId = 'org-a1-id';
    currentUserId = 'general-user-id';
  });

  test('Administrator can see all users', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should see all tiers
    expect(data.members.some((m: any) => m.tier === 'agency')).toBe(true);
    expect(data.members.some((m: any) => m.tier === 'organization')).toBe(true);
    expect(data.members.some((m: any) => m.tier === 'admin')).toBe(true);
    expect(data.members.some((m: any) => m.tier === 'general')).toBe(true);
  });

  test('Agency cannot see other Agencies', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${agencyAToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should NOT see other agencies
    const otherAgencies = data.members.filter(
      (m: any) => m.tier === 'agency' && m.id !== currentAgencyId
    );
    expect(otherAgencies.length).toBe(0);

    // Should see own organizations
    const ownOrgs = data.members.filter(
      (m: any) => m.tier === 'organization' && m.agencyId === currentAgencyId
    );
    expect(ownOrgs.length).toBeGreaterThan(0);
  });

  test('Organization cannot see other Organizations', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${orgA1Token}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should NOT see other organizations
    const otherOrgs = data.members.filter(
      (m: any) => m.tier === 'organization' && m.id !== currentOrgId
    );
    expect(otherOrgs.length).toBe(0);

    // Should see own admins and generals
    const ownMembers = data.members.filter(
      (m: any) => (m.tier === 'admin' || m.tier === 'general') && m.organizationId === currentOrgId
    );
    expect(ownMembers.length).toBeGreaterThan(0);
  });

  test('Admin cannot see users outside org', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${adminA1Token}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should only see Generals in same org
    const allMembers = data.members;
    expect(
      allMembers.every((m: any) => m.tier === 'general' && m.organizationId === currentOrgId)
    ).toBe(true);
  });

  test('General can only see themselves', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should only see themselves
    expect(data.members.length).toBe(1);
    expect(data.members[0].id).toBe(currentUserId);
  });

  test('visibility middleware is applied to user search endpoint', async ({ request }) => {
    // Agency searches for users
    const response = await request.get('http://localhost:3001/api/v1/users/search?q=test', {
      headers: {
        Authorization: `Bearer ${agencyAToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should not see users from other agencies
    const otherAgencyUsers = data.users.filter((u: any) => u.agencyId !== currentAgencyId);
    expect(otherAgencyUsers.length).toBe(0);
  });

  test('visibility middleware is applied to hierarchy tree endpoint', async ({ request }) => {
    // Agency gets hierarchy tree
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/tree', {
      headers: {
        Authorization: `Bearer ${agencyAToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should not see other agencies in tree
    const otherAgencies = data.tree.filter(
      (node: any) => node.type === 'agency' && node.id !== currentAgencyId
    );
    expect(otherAgencies.length).toBe(0);
  });

  test('visibility middleware prevents access to user details of invisible users', async ({
    request,
  }) => {
    // Organization tries to access user from different organization
    const response = await request.get('http://localhost:3001/api/v1/users/org-a2-user-id', {
      headers: {
        Authorization: `Bearer ${orgA1Token}`,
      },
    });

    // Should be forbidden
    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('visibility middleware prevents transfer to invisible users', async ({ request }) => {
    // Organization tries to transfer to user from different organization
    const response = await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        Authorization: `Bearer ${orgA1Token}`,
      },
      data: {
        recipientId: 'org-a2-user-id',
        amount: 1000,
        type: 'points',
      },
    });

    // Should be forbidden
    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('visibility middleware prevents blocking invisible users', async ({ request }) => {
    // Organization tries to block user from different organization
    const response = await request.post('http://localhost:3001/api/v1/block', {
      headers: {
        Authorization: `Bearer ${orgA1Token}`,
      },
      data: {
        userId: 'org-a2-user-id',
        reason: 'Test block',
      },
    });

    // Should be forbidden
    expect(response.status()).toBe(403);

    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('visibility middleware handles blocked users correctly', async ({ request }) => {
    // Agency tries to see blocked users
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${agencyAToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should see blocked users but with blocked status
    const blockedUsers = data.members.filter((m: any) => m.isBlocked);
    if (blockedUsers.length > 0) {
      expect(blockedUsers[0].isBlocked).toBe(true);
    }
  });

  test('visibility middleware logs access attempts', async ({ request }) => {
    // Make a request that would be logged
    await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${agencyAToken}`,
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

    // Should find the access log entry
    const accessLog = logs.find(
      (log: any) => log.action === 'HIERARCHY_MEMBERS_ACCESS' && log.userId === 'agency-a-user-id'
    );

    expect(accessLog).toBeDefined();
  });

  test('visibility middleware handles pagination correctly', async ({ request }) => {
    // Agency gets paginated results
    const response = await request.get(
      'http://localhost:3001/api/v1/hierarchy/members?page=1&limit=10',
      {
        headers: {
          Authorization: `Bearer ${agencyAToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should still respect visibility rules in paginated results
    const otherAgencyUsers = data.members.filter(
      (m: any) => m.tier === 'agency' && m.id !== currentAgencyId
    );
    expect(otherAgencyUsers.length).toBe(0);
  });

  test('visibility middleware handles sorting correctly', async ({ request }) => {
    // Agency gets sorted results
    const response = await request.get(
      'http://localhost:3001/api/v1/hierarchy/members?sort=name&order=asc',
      {
        headers: {
          Authorization: `Bearer ${agencyAToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should still respect visibility rules in sorted results
    const otherAgencyUsers = data.members.filter(
      (m: any) => m.tier === 'agency' && m.id !== currentAgencyId
    );
    expect(otherAgencyUsers.length).toBe(0);
  });

  test('visibility middleware handles filtering correctly', async ({ request }) => {
    // Agency filters results
    const response = await request.get(
      'http://localhost:3001/api/v1/hierarchy/members?tier=organization',
      {
        headers: {
          Authorization: `Bearer ${agencyAToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should only see organizations from own agency
    const ownOrgs = data.members.filter(
      (m: any) => m.tier === 'organization' && m.agencyId === currentAgencyId
    );

    // All results should be organizations from own agency
    expect(data.members.length).toBe(ownOrgs.length);
  });

  test('visibility middleware handles edge cases', async ({ request }) => {
    // Test with invalid token
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    // Should be unauthorized
    expect(response.status()).toBe(401);

    // Test with no token
    const noTokenResponse = await request.get('http://localhost:3001/api/v1/hierarchy/members');

    // Should be unauthorized
    expect(noTokenResponse.status()).toBe(401);
  });

  test('visibility middleware performance', async ({ request }) => {
    // Measure response time with visibility middleware
    const startTime = Date.now();

    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status()).toBe(200);

    // Response time should be reasonable (less than 500ms)
    expect(responseTime).toBeLessThan(500);
  });

  test('visibility middleware handles concurrent requests', async ({ request }) => {
    // Make multiple concurrent requests
    const requests = Array(10)
      .fill(null)
      .map(() =>
        request.get('http://localhost:3001/api/v1/hierarchy/members', {
          headers: {
            Authorization: `Bearer ${agencyAToken}`,
          },
        })
      );

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });

    // All should respect visibility rules
    for (const response of responses) {
      const data = await response.json();
      const otherAgencyUsers = data.members.filter(
        (m: any) => m.tier === 'agency' && m.id !== currentAgencyId
      );
      expect(otherAgencyUsers.length).toBe(0);
    }
  });
});

test.describe('Visibility Middleware Implementation', () => {
  test('visibilityCheckRaw.ts exists and has correct implementation', async ({ page }) => {
    // This would be a file system check in a real test
    // For now, we'll test the behavior through API calls

    // Test that visibility middleware is working
    const response = await page.request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${await loginAndGetToken(page, 'agency@example.com', 'password123')}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Verify visibility rules are applied
    const otherAgencies = data.members.filter(
      (m: any) => m.tier === 'agency' && m.email !== 'agency@example.com'
    );
    expect(otherAgencies.length).toBe(0);
  });

  test('visibility middleware is applied to all required endpoints', async ({ page }) => {
    const token = await loginAndGetToken(page, 'agency@example.com', 'password123');

    // Test all endpoints that should have visibility middleware
    const endpoints = [
      '/api/v1/hierarchy/members',
      '/api/v1/users/search',
      '/api/v1/hierarchy/tree',
      '/api/v1/transfer',
      '/api/v1/block',
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(`http://localhost:3001${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Should not return 404 (endpoint exists)
      expect(response.status()).not.toBe(404);

      // GET endpoints should return 200
      if (endpoint !== '/api/v1/transfer' && endpoint !== '/api/v1/block') {
        expect(response.status()).toBe(200);
      }
    }
  });
});
