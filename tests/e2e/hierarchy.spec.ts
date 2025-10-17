import { test, expect } from '@playwright/test';

test.describe('User Hierarchy E2E', () => {
  test('General user cannot access members page', async ({ page }) => {
    // Login as General user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'general@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Try to navigate to members page
    await page.goto('/members');

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('Agency can see and block Organization', async ({ page }) => {
    // Login as Agency
    await page.goto('/login');
    await page.fill('input[name="email"]', 'agency@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to members page
    await page.goto('/members');

    // Should see members table
    await expect(page.locator('table')).toBeVisible();

    // Should see Block button for Organization users
    const blockButton = page.locator('button:has-text("Block")').first();
    await expect(blockButton).toBeVisible();

    // Click block button
    await blockButton.click();

    // Should see success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('Transfer flow works correctly', async ({ page }) => {
    // Login as Agency
    await page.goto('/login');
    await page.fill('input[name="email"]', 'agency@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to transfer page
    await page.goto('/transfer');

    // Fill transfer form
    await page.selectOption('select[name="toUserId"]', 'organization@example.com');
    await page.fill('input[name="amount"]', '1000');
    await page.fill('textarea[name="note"]', 'Test transfer');

    // Submit form
    await page.click('button[type="submit"]');

    // Should see success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('Points dashboard displays correctly', async ({ page }) => {
    // Login as any user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Should see points and credits balance
    await expect(page.locator('text=Points Balance')).toBeVisible();
    await expect(page.locator('text=Credits Balance')).toBeVisible();

    // Should see action buttons
    await expect(page.locator('button:has-text("Exchange Credits to Points")')).toBeVisible();
    await expect(page.locator('button:has-text("Purchase Points")')).toBeVisible();
    await expect(page.locator('button:has-text("Claim Daily Reward")')).toBeVisible();
  });

  test('Referral card displays correctly', async ({ page }) => {
    // Login as any user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to referral page
    await page.goto('/referral');

    // Should see referral stats
    await expect(page.locator('text=Total Referrals')).toBeVisible();
    await expect(page.locator('text=Total Rewards')).toBeVisible();

    // Should see invite code and link
    await expect(page.locator('text=Your Invite Code:')).toBeVisible();
    await expect(page.locator('text=Invite Link:')).toBeVisible();

    // Should see copy and QR code buttons
    await expect(page.locator('button:has-text("Copy Link")')).toBeVisible();
    await expect(page.locator('button:has-text("Show QR Code")')).toBeVisible();
  });
});
