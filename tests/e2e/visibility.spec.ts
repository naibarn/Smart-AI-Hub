import { test, expect } from '@playwright/test';

test.describe('Visibility - Agency User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Agency user (Agency A)
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see only Organizations under their Agency in member list', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should see Organization A1 (under Agency A)
    const org1 = page.locator('[data-testid="member-org-a1"]');
    await expect(org1).toBeVisible();

    // Should see Organization A2 (under Agency A)
    const org2 = page.locator('[data-testid="member-org-a2"]');
    await expect(org2).toBeVisible();

    // Should NOT see Organization B1 (under Agency B)
    const orgB1 = page.locator('[data-testid="member-org-b1"]');
    await expect(orgB1).not.toBeVisible();
  });

  test('should NOT see other Agencies in member list', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should NOT see Agency B
    const agencyB = page.locator('[data-testid="member-agency-b"]');
    await expect(agencyB).not.toBeVisible();
  });

  test('should see Admins and Generals under their Organizations', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Expand Organization A1
    await page.click('[data-testid="expand-org-a1"]');

    // Should see Admin under Org A1
    const admin1 = page.locator('[data-testid="member-admin-a1-1"]');
    await expect(admin1).toBeVisible();

    // Should see General under Org A1
    const general1 = page.locator('[data-testid="member-general-a1-1"]');
    await expect(general1).toBeVisible();
  });

  test('transfer form should show only visible users', async ({ page }) => {
    await page.goto('http://localhost:3000/transfer');

    // Search for users
    await page.fill('[data-testid="recipient-search"]', 'org');
    await page.waitForTimeout(500); // Wait for search results

    // Should see Organization A1
    const org1Option = page.locator('[data-testid="search-result-org-a1"]');
    await expect(org1Option).toBeVisible();

    // Should NOT see Organization B1
    const orgB1Option = page.locator('[data-testid="search-result-org-b1"]');
    await expect(orgB1Option).not.toBeVisible();
  });

  test('block form should show only visible users', async ({ page }) => {
    await page.goto('http://localhost:3000/block');

    // Search for users
    await page.fill('[data-testid="block-search"]', 'org');
    await page.waitForTimeout(500); // Wait for search results

    // Should see Organization A1
    const org1Option = page.locator('[data-testid="block-result-org-a1"]');
    await expect(org1Option).toBeVisible();

    // Should NOT see Organization B1
    const orgB1Option = page.locator('[data-testid="block-result-org-b1"]');
    await expect(orgB1Option).not.toBeVisible();
  });

  test('should see correct member count in dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Should see count of visible members only
    const memberCount = page.locator('[data-testid="member-count"]');
    await expect(memberCount).toBeVisible();

    const countText = await memberCount.textContent();
    const count = parseInt(countText || '0');

    // Count should be greater than 0 (has visible members)
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Visibility - Organization User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Organization user (Org A1)
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see only Admins and Generals in their Organization', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should see Admin in Org A1
    const admin1 = page.locator('[data-testid="member-admin-a1-1"]');
    await expect(admin1).toBeVisible();

    // Should see General in Org A1
    const general1 = page.locator('[data-testid="member-general-a1-1"]');
    await expect(general1).toBeVisible();

    // Should NOT see members from Org A2
    const adminA2 = page.locator('[data-testid="member-admin-a2-1"]');
    await expect(adminA2).not.toBeVisible();
  });

  test('should NOT see other Organizations', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should NOT see Organization A2
    const orgA2 = page.locator('[data-testid="member-org-a2"]');
    await expect(orgA2).not.toBeVisible();
  });

  test('should NOT see their parent Agency', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should NOT see Agency A
    const agencyA = page.locator('[data-testid="member-agency-a"]');
    await expect(agencyA).not.toBeVisible();
  });

  test('transfer form should show only visible users', async ({ page }) => {
    await page.goto('http://localhost:3000/transfer');

    // Search for users
    await page.fill('[data-testid="recipient-search"]', 'admin');
    await page.waitForTimeout(500); // Wait for search results

    // Should see Admin in same org
    const admin1Option = page.locator('[data-testid="search-result-admin-a1-1"]');
    await expect(admin1Option).toBeVisible();

    // Should NOT see Admin from other org
    const adminA2Option = page.locator('[data-testid="search-result-admin-a2-1"]');
    await expect(adminA2Option).not.toBeVisible();
  });

  test('block form should show only visible users', async ({ page }) => {
    await page.goto('http://localhost:3000/block');

    // Search for users
    await page.fill('[data-testid="block-search"]', 'admin');
    await page.waitForTimeout(500); // Wait for search results

    // Should see Admin in same org
    const admin1Option = page.locator('[data-testid="block-result-admin-a1-1"]');
    await expect(admin1Option).toBeVisible();

    // Should NOT see Admin from other org
    const adminA2Option = page.locator('[data-testid="block-result-admin-a2-1"]');
    await expect(adminA2Option).not.toBeVisible();
  });
});

test.describe('Visibility - Admin User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin user (Admin in Org A1)
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'admin-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see only Generals in same Organization', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should see General in same Org
    const general1 = page.locator('[data-testid="member-general-a1-1"]');
    await expect(general1).toBeVisible();

    // Should NOT see Generals from other Orgs
    const generalA2 = page.locator('[data-testid="member-general-a2-1"]');
    await expect(generalA2).not.toBeVisible();
  });

  test('should NOT see other Admins', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should NOT see other Admins
    const admin2 = page.locator('[data-testid="member-admin-a1-2"]');
    await expect(admin2).not.toBeVisible();
  });

  test('should NOT see Organization or Agency', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should NOT see Organization
    const org = page.locator('[data-testid="member-org-a1"]');
    await expect(org).not.toBeVisible();

    // Should NOT see Agency
    const agency = page.locator('[data-testid="member-agency-a"]');
    await expect(agency).not.toBeVisible();
  });

  test('transfer form should show only visible users', async ({ page }) => {
    await page.goto('http://localhost:3000/transfer');

    // Search for users
    await page.fill('[data-testid="recipient-search"]', 'general');
    await page.waitForTimeout(500); // Wait for search results

    // Should see General in same org
    const general1Option = page.locator('[data-testid="search-result-general-a1-1"]');
    await expect(general1Option).toBeVisible();

    // Should NOT see General from other org
    const generalA2Option = page.locator('[data-testid="search-result-general-a2-1"]');
    await expect(generalA2Option).not.toBeVisible();
  });

  test('block form should show only visible users', async ({ page }) => {
    await page.goto('http://localhost:3000/block');

    // Search for users
    await page.fill('[data-testid="block-search"]', 'general');
    await page.waitForTimeout(500); // Wait for search results

    // Should see General in same org
    const general1Option = page.locator('[data-testid="block-result-general-a1-1"]');
    await expect(general1Option).toBeVisible();

    // Should NOT see General from other org
    const generalA2Option = page.locator('[data-testid="block-result-general-a2-1"]');
    await expect(generalA2Option).not.toBeVisible();
  });
});

test.describe('Visibility - General User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as General user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'general-a1-1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see only themselves in member list', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should see themselves
    const self = page.locator('[data-testid="member-general-self"]');
    await expect(self).toBeVisible();

    // Should NOT see other users
    const otherUser = page.locator('[data-testid="member-general-other"]');
    await expect(otherUser).not.toBeVisible();
  });

  test('should NOT see transfer page', async ({ page }) => {
    // General users shouldn't have access to transfer
    await page.goto('http://localhost:3000/transfer');

    // Should be redirected or see access denied
    await expect(page).toHaveURL(/\/(dashboard|403)/);
  });

  test('should NOT see block page', async ({ page }) => {
    // General users shouldn't have access to block
    await page.goto('http://localhost:3000/block');

    // Should be redirected or see access denied
    await expect(page).toHaveURL(/\/(dashboard|403)/);
  });
});

test.describe('Visibility - Administrator User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Administrator user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'administrator@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see all users in system', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should see all user types
    const agencies = page.locator('[data-testid^="member-agency-"]');
    await expect(agencies.first()).toBeVisible();

    const organizations = page.locator('[data-testid^="member-org-"]');
    await expect(organizations.first()).toBeVisible();

    const admins = page.locator('[data-testid^="member-admin-"]');
    await expect(admins.first()).toBeVisible();

    const generals = page.locator('[data-testid^="member-general-"]');
    await expect(generals.first()).toBeVisible();
  });

  test('should see all agencies', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should see Agency A
    const agencyA = page.locator('[data-testid="member-agency-a"]');
    await expect(agencyA).toBeVisible();

    // Should see Agency B
    const agencyB = page.locator('[data-testid="member-agency-b"]');
    await expect(agencyB).toBeVisible();
  });

  test('transfer form should show all users', async ({ page }) => {
    await page.goto('http://localhost:3000/transfer');

    // Search for agencies
    await page.fill('[data-testid="recipient-search"]', 'agency');
    await page.waitForTimeout(500); // Wait for search results

    // Should see Agency A
    const agencyAOption = page.locator('[data-testid="search-result-agency-a"]');
    await expect(agencyAOption).toBeVisible();

    // Should see Agency B
    const agencyBOption = page.locator('[data-testid="search-result-agency-b"]');
    await expect(agencyBOption).toBeVisible();
  });

  test('block form should show all users', async ({ page }) => {
    await page.goto('http://localhost:3000/block');

    // Search for agencies
    await page.fill('[data-testid="block-search"]', 'agency');
    await page.waitForTimeout(500); // Wait for search results

    // Should see Agency A
    const agencyAOption = page.locator('[data-testid="block-result-agency-a"]');
    await expect(agencyAOption).toBeVisible();

    // Should see Agency B
    const agencyBOption = page.locator('[data-testid="block-result-agency-b"]');
    await expect(agencyBOption).toBeVisible();
  });
});

test.describe('Visibility - Edge Cases', () => {
  test('blocked users should not appear in member lists', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/members');

    // Blocked user should not be visible
    const blockedUser = page.locator('[data-testid="member-blocked-user"]');
    await expect(blockedUser).not.toBeVisible();
  });

  test('search results should respect visibility rules', async ({ page }) => {
    // Login as Organization A1
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/members');

    // Search for "admin" - should only show admins in same org
    await page.fill('[data-testid="member-search"]', 'admin');
    await page.waitForTimeout(500);

    // Should see admin in same org
    const admin1 = page.locator('[data-testid="member-admin-a1-1"]');
    await expect(admin1).toBeVisible();

    // Should NOT see admin from other org
    const adminA2 = page.locator('[data-testid="member-admin-a2-1"]');
    await expect(adminA2).not.toBeVisible();
  });

  test('pagination should respect visibility rules', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/members');

    // Go to page 2 if available
    const page2Button = page.locator('[data-testid="pagination-page-2"]');
    if (await page2Button.isVisible()) {
      await page2Button.click();

      // Page 2 should also only show visible users
      const org1 = page.locator('[data-testid="member-org-a1"]');
      await expect(org1).not.toBeVisible(); // Should be on page 1

      // Should NOT see users from other agencies
      const orgB1 = page.locator('[data-testid="member-org-b1"]');
      await expect(orgB1).not.toBeVisible();
    }
  });
});
