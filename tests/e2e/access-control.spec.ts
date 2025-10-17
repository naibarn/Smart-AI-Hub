import { test, expect } from '@playwright/test';

test.describe('Access Control - General User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as General user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'general-a1-1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should not see Members menu item', async ({ page }) => {
    const membersLink = page.locator('[data-testid="menu-members"]');
    await expect(membersLink).not.toBeVisible();
  });

  test('should be redirected when accessing /members directly', async ({ page }) => {
    await page.goto('http://localhost:3000/members');

    // Should be redirected to dashboard or show 403
    await expect(page).toHaveURL(/\/(dashboard|403)/);

    // Or should see access denied message
    const accessDenied = page.locator('text=Access Denied');
    await expect(accessDenied).toBeVisible();
  });

  test('should not see Agency Settings menu item', async ({ page }) => {
    const agencySettingsLink = page.locator('[data-testid="menu-agency-settings"]');
    await expect(agencySettingsLink).not.toBeVisible();
  });

  test('should not see Transfer menu item', async ({ page }) => {
    const transferLink = page.locator('[data-testid="menu-transfer"]');
    await expect(transferLink).not.toBeVisible();
  });

  test('should not see Block Users menu item', async ({ page }) => {
    const blockUsersLink = page.locator('[data-testid="menu-block-users"]');
    await expect(blockUsersLink).not.toBeVisible();
  });

  test('should not see Organization Settings menu item', async ({ page }) => {
    const orgSettingsLink = page.locator('[data-testid="menu-org-settings"]');
    await expect(orgSettingsLink).not.toBeVisible();
  });

  test('should see only allowed menu items', async ({ page }) => {
    // Should see Dashboard
    const dashboardLink = page.locator('[data-testid="menu-dashboard"]');
    await expect(dashboardLink).toBeVisible();

    // Should see Profile
    const profileLink = page.locator('[data-testid="menu-profile"]');
    await expect(profileLink).toBeVisible();

    // Should see Points
    const pointsLink = page.locator('[data-testid="menu-points"]');
    await expect(pointsLink).toBeVisible();

    // Should see Referrals
    const referralsLink = page.locator('[data-testid="menu-referrals"]');
    await expect(referralsLink).toBeVisible();
  });
});

test.describe('Access Control - Agency User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Agency user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see Members menu item', async ({ page }) => {
    const membersLink = page.locator('[data-testid="menu-members"]');
    await expect(membersLink).toBeVisible();
  });

  test('should access /members page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/members');
    await expect(page).toHaveURL('http://localhost:3000/members');

    const pageTitle = page.locator('h1:has-text("Members")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Agency Settings menu item', async ({ page }) => {
    const agencySettingsLink = page.locator('[data-testid="menu-agency-settings"]');
    await expect(agencySettingsLink).toBeVisible();
  });

  test('should access /agency/settings page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/agency/settings');
    await expect(page).toHaveURL('http://localhost:3000/agency/settings');

    const pageTitle = page.locator('h1:has-text("Agency Settings")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Transfer menu item', async ({ page }) => {
    const transferLink = page.locator('[data-testid="menu-transfer"]');
    await expect(transferLink).toBeVisible();
  });

  test('should access /transfer page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/transfer');
    await expect(page).toHaveURL('http://localhost:3000/transfer');

    const pageTitle = page.locator('h1:has-text("Transfer")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Block Users menu item', async ({ page }) => {
    const blockUsersLink = page.locator('[data-testid="menu-block-users"]');
    await expect(blockUsersLink).toBeVisible();
  });

  test('should access /block page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/block');
    await expect(page).toHaveURL('http://localhost:3000/block');

    const pageTitle = page.locator('h1:has-text("Block Users")');
    await expect(pageTitle).toBeVisible();
  });

  test('should not see Organization Settings menu item', async ({ page }) => {
    const orgSettingsLink = page.locator('[data-testid="menu-org-settings"]');
    await expect(orgSettingsLink).not.toBeVisible();
  });
});

test.describe('Access Control - Organization User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Organization user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see Members menu item', async ({ page }) => {
    const membersLink = page.locator('[data-testid="menu-members"]');
    await expect(membersLink).toBeVisible();
  });

  test('should access /members page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/members');
    await expect(page).toHaveURL('http://localhost:3000/members');

    const pageTitle = page.locator('h1:has-text("Members")');
    await expect(pageTitle).toBeVisible();
  });

  test('should NOT see Agency Settings menu item', async ({ page }) => {
    const agencySettingsLink = page.locator('[data-testid="menu-agency-settings"]');
    await expect(agencySettingsLink).not.toBeVisible();
  });

  test('should be denied when accessing /agency/settings directly', async ({ page }) => {
    await page.goto('http://localhost:3000/agency/settings');

    // Should be redirected or show 403
    await expect(page).toHaveURL(/\/(dashboard|403)/);
  });

  test('should see Transfer menu item', async ({ page }) => {
    const transferLink = page.locator('[data-testid="menu-transfer"]');
    await expect(transferLink).toBeVisible();
  });

  test('should access /transfer page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/transfer');
    await expect(page).toHaveURL('http://localhost:3000/transfer');

    const pageTitle = page.locator('h1:has-text("Transfer")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Block Users menu item', async ({ page }) => {
    const blockUsersLink = page.locator('[data-testid="menu-block-users"]');
    await expect(blockUsersLink).toBeVisible();
  });

  test('should access /block page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/block');
    await expect(page).toHaveURL('http://localhost:3000/block');

    const pageTitle = page.locator('h1:has-text("Block Users")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Organization Settings menu item', async ({ page }) => {
    const orgSettingsLink = page.locator('[data-testid="menu-org-settings"]');
    await expect(orgSettingsLink).toBeVisible();
  });

  test('should access /organization/settings page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/organization/settings');
    await expect(page).toHaveURL('http://localhost:3000/organization/settings');

    const pageTitle = page.locator('h1:has-text("Organization Settings")');
    await expect(pageTitle).toBeVisible();
  });
});

test.describe('Access Control - Admin User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'admin-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see Members menu item', async ({ page }) => {
    const membersLink = page.locator('[data-testid="menu-members"]');
    await expect(membersLink).toBeVisible();
  });

  test('should access /members page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/members');
    await expect(page).toHaveURL('http://localhost:3000/members');

    const pageTitle = page.locator('h1:has-text("Members")');
    await expect(pageTitle).toBeVisible();
  });

  test('should NOT see Agency Settings menu item', async ({ page }) => {
    const agencySettingsLink = page.locator('[data-testid="menu-agency-settings"]');
    await expect(agencySettingsLink).not.toBeVisible();
  });

  test('should be denied when accessing /agency/settings directly', async ({ page }) => {
    await page.goto('http://localhost:3000/agency/settings');

    // Should be redirected or show 403
    await expect(page).toHaveURL(/\/(dashboard|403)/);
  });

  test('should see Transfer menu item', async ({ page }) => {
    const transferLink = page.locator('[data-testid="menu-transfer"]');
    await expect(transferLink).toBeVisible();
  });

  test('should access /transfer page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/transfer');
    await expect(page).toHaveURL('http://localhost:3000/transfer');

    const pageTitle = page.locator('h1:has-text("Transfer")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Block Users menu item', async ({ page }) => {
    const blockUsersLink = page.locator('[data-testid="menu-block-users"]');
    await expect(blockUsersLink).toBeVisible();
  });

  test('should access /block page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/block');
    await expect(page).toHaveURL('http://localhost:3000/block');

    const pageTitle = page.locator('h1:has-text("Block Users")');
    await expect(pageTitle).toBeVisible();
  });

  test('should NOT see Organization Settings menu item', async ({ page }) => {
    const orgSettingsLink = page.locator('[data-testid="menu-org-settings"]');
    await expect(orgSettingsLink).not.toBeVisible();
  });

  test('should be denied when accessing /organization/settings directly', async ({ page }) => {
    await page.goto('http://localhost:3000/organization/settings');

    // Should be redirected or show 403
    await expect(page).toHaveURL(/\/(dashboard|403)/);
  });
});

test.describe('Access Control - Administrator User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Administrator user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'administrator@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should see Members menu item', async ({ page }) => {
    const membersLink = page.locator('[data-testid="menu-members"]');
    await expect(membersLink).toBeVisible();
  });

  test('should access /members page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/members');
    await expect(page).toHaveURL('http://localhost:3000/members');

    const pageTitle = page.locator('h1:has-text("Members")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Agency Settings menu item', async ({ page }) => {
    const agencySettingsLink = page.locator('[data-testid="menu-agency-settings"]');
    await expect(agencySettingsLink).toBeVisible();
  });

  test('should access /agency/settings page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/agency/settings');
    await expect(page).toHaveURL('http://localhost:3000/agency/settings');

    const pageTitle = page.locator('h1:has-text("Agency Settings")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Transfer menu item', async ({ page }) => {
    const transferLink = page.locator('[data-testid="menu-transfer"]');
    await expect(transferLink).toBeVisible();
  });

  test('should access /transfer page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/transfer');
    await expect(page).toHaveURL('http://localhost:3000/transfer');

    const pageTitle = page.locator('h1:has-text("Transfer")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Block Users menu item', async ({ page }) => {
    const blockUsersLink = page.locator('[data-testid="menu-block-users"]');
    await expect(blockUsersLink).toBeVisible();
  });

  test('should access /block page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/block');
    await expect(page).toHaveURL('http://localhost:3000/block');

    const pageTitle = page.locator('h1:has-text("Block Users")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Organization Settings menu item', async ({ page }) => {
    const orgSettingsLink = page.locator('[data-testid="menu-org-settings"]');
    await expect(orgSettingsLink).toBeVisible();
  });

  test('should access /organization/settings page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/organization/settings');
    await expect(page).toHaveURL('http://localhost:3000/organization/settings');

    const pageTitle = page.locator('h1:has-text("Organization Settings")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Admin Settings menu item', async ({ page }) => {
    const adminSettingsLink = page.locator('[data-testid="menu-admin-settings"]');
    await expect(adminSettingsLink).toBeVisible();
  });

  test('should access /admin/settings page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/settings');
    await expect(page).toHaveURL('http://localhost:3000/admin/settings');

    const pageTitle = page.locator('h1:has-text("Admin Settings")');
    await expect(pageTitle).toBeVisible();
  });
});
