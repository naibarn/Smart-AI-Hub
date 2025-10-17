import { test, expect } from '@playwright/test';

test.describe('Referral Flow', () => {
  let inviteCode: string;
  let inviteLink: string;

  test('user can generate and view invite code', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Go to invite page
    await page.goto('http://localhost:3000/invite');

    // Should see invite code
    const codeElement = page.locator('[data-testid="invite-code"]');
    await expect(codeElement).toBeVisible();
    inviteCode = (await codeElement.textContent()) || '';

    // Should see invite link
    const linkElement = page.locator('[data-testid="invite-link"]');
    await expect(linkElement).toBeVisible();
    inviteLink = (await linkElement.textContent()) || '';

    // Should see QR code
    const qrCode = page.locator('[data-testid="qr-code"]');
    await expect(qrCode).toBeVisible();

    // Verify invite code format (8 characters)
    expect(inviteCode.length).toBe(8);

    // Verify invite link format
    expect(inviteLink).toContain('http://localhost:3000/register?invite=');
    expect(inviteLink).toContain(inviteCode);
  });

  test('user can regenerate invite code', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Go to invite page
    await page.goto('http://localhost:3000/invite');

    // Get current invite code
    const currentCode = await page.locator('[data-testid="invite-code"]').textContent();

    // Click regenerate button
    await page.click('[data-testid="regenerate-code"]');

    // Confirm in dialog
    await page.click('[data-testid="confirm-regenerate"]');

    // Wait for success message
    const successMessage = page.locator('text=Invite code regenerated');
    await expect(successMessage).toBeVisible();

    // Get new invite code
    const newCode = await page.locator('[data-testid="invite-code"]').textContent();

    // Verify code has changed
    expect(newCode).not.toBe(currentCode);

    // Verify new code format
    expect(newCode?.length).toBe(8);
  });

  test('user can copy invite link', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/invite');

    // Click copy button
    await page.click('[data-testid="copy-link-button"]');

    // Should see success message
    const successMessage = page.locator('text=copied');
    await expect(successMessage).toBeVisible();
  });

  test('user can share invite code via social media', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/invite');

    // Click Facebook share button
    await page.click('[data-testid="share-facebook"]');

    // Should open Facebook share dialog (new window)
    const facebookWindow = await page.waitForEvent('popup');
    await facebookWindow.waitForURL(/facebook\.com/);
    await facebookWindow.close();

    // Click Twitter share button
    await page.click('[data-testid="share-twitter"]');

    // Should open Twitter share dialog (new window)
    const twitterWindow = await page.waitForEvent('popup');
    await twitterWindow.waitForURL(/twitter\.com/);
    await twitterWindow.close();

    // Click Email share button
    await page.click('[data-testid="share-email"]');

    // Should open email client
    // Note: Can't test actual email client opening in E2E test
  });

  test('new user can register with invite code', async ({ page, context }) => {
    // Get initial referral count
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/referrals');
    const initialCountText = await page.locator('[data-testid="total-referrals"]').textContent();
    const initialCount = parseInt(initialCountText || '0');

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Open new incognito context for new user
    const newPage = await context.newPage();

    // Go to register page
    await newPage.goto('http://localhost:3000/register');

    // Fill registration form
    await newPage.fill('[data-testid="name"]', 'New User');
    await newPage.fill('[data-testid="email"]', 'newuser@example.com');
    await newPage.fill('[data-testid="password"]', 'password123');
    await newPage.fill('[data-testid="confirm-password"]', 'password123');
    await newPage.fill('[data-testid="invite-code"]', inviteCode);

    // Submit
    await newPage.click('[data-testid="register-button"]');

    // Should be redirected to dashboard
    await newPage.waitForURL('http://localhost:3000/dashboard');

    // Should see success message
    const successMessage = newPage.locator('text=Registration successful');
    await expect(successMessage).toBeVisible();

    // Close new user page
    await newPage.close();

    // Login as original user again
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Check referral count increased
    await page.goto('http://localhost:3000/referrals');
    const newCountText = await page.locator('[data-testid="total-referrals"]').textContent();
    const newCount = parseInt(newCountText || '0');
    expect(newCount).toBe(initialCount + 1);

    // Should see new referral in list
    const newReferral = page.locator('[data-testid="referral-newuser@example.com"]');
    await expect(newReferral).toBeVisible();
  });

  test('referrer receives reward', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Get initial balance
    const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialPointsText?.replace(/,/g, '') || '0');

    // Go to referrals page
    await page.goto('http://localhost:3000/referrals');

    // Check rewards history
    const rewardsHistory = page.locator('[data-testid="rewards-history"]');
    await expect(rewardsHistory).toBeVisible();

    // Should see reward for newuser@example.com
    const reward = page.locator('[data-testid="reward-newuser@example.com"]');
    await expect(reward).toBeVisible();
    await expect(reward).toContainText('Points'); // Reward amount

    // Verify balance increased
    const newPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newPointsText?.replace(/,/g, '') || '0');
    expect(newPoints).toBeGreaterThan(initialPoints);
  });

  test('cannot use own invite code', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Get own invite code
    await page.goto('http://localhost:3000/invite');
    const codeElement = page.locator('[data-testid="invite-code"]');
    const ownCode = await codeElement.textContent();

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Try to register with own code
    await page.goto('http://localhost:3000/register');
    await page.fill('[data-testid="name"]', 'Test User');
    await page.selectOption('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.fill('[data-testid="invite-code"]', ownCode || '');
    await page.click('[data-testid="register-button"]');

    // Should see error
    const errorMessage = page.locator('text=cannot use your own invite code');
    await expect(errorMessage).toBeVisible();
  });

  test('cannot use invalid invite code', async ({ page }) => {
    // Go to register page
    await page.goto('http://localhost:3000/register');

    // Fill registration form with invalid code
    await page.fill('[data-testid="name"]', 'Test User');
    await page.selectOption('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.fill('[data-testid="invite-code"]', 'INVALID');
    await page.click('[data-testid="register-button"]');

    // Should see error
    const errorMessage = page.locator('text=Invalid invite code');
    await expect(errorMessage).toBeVisible();
  });

  test('cannot register without invite code if required', async ({ page }) => {
    // Go to register page
    await page.goto('http://localhost:3000/register');

    // Fill registration form without code
    await page.fill('[data-testid="name"]', 'Test User');
    await page.selectOption('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.click('[data-testid="register-button"]');

    // Should see error if invite code is required
    const errorMessage = page.locator('text=Invite code is required');
    await expect(errorMessage).toBeVisible();
  });
});

test.describe('Referral Statistics', () => {
  test('should display referral statistics', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Go to referrals page
    await page.goto('http://localhost:3000/referrals');

    // Should see statistics cards
    const totalReferrals = page.locator('[data-testid="total-referrals"]');
    await expect(totalReferrals).toBeVisible();

    const activeReferrals = page.locator('[data-testid="active-referrals"]');
    await expect(activeReferrals).toBeVisible();

    const totalRewards = page.locator('[data-testid="total-rewards"]');
    await expect(totalRewards).toBeVisible();

    const pendingRewards = page.locator('[data-testid="pending-rewards"]');
    await expect(pendingRewards).toBeVisible();
  });

  test('should display referral list', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Go to referrals page
    await page.goto('http://localhost:3000/referrals');

    // Should see referral list table
    const referralTable = page.locator('[data-testid="referral-table"]');
    await expect(referralTable).toBeVisible();

    // Should have table headers
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Reward')).toBeVisible();

    // Should see referral rows if any exist
    const referralRows = page.locator('[data-testid^="referral-"]');
    if ((await referralRows.count()) > 0) {
      const firstRow = referralRows.first();

      // Each row should have required fields
      await expect(firstRow.locator('[data-testid="referral-name"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="referral-email"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="referral-date"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="referral-status"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="referral-reward"]')).toBeVisible();
    }
  });

  test('should filter referrals by status', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Go to referrals page
    await page.goto('http://localhost:3000/referrals');

    // Filter by status
    await page.selectOption('[data-testid="filter-status"]', 'active');
    await page.click('[data-testid="apply-filter"]');

    // Should show only active referrals
    const referralRows = page.locator('[data-testid^="referral-"]');
    for (let i = 0; i < (await referralRows.count()); i++) {
      const row = referralRows.nth(i);
      await expect(row.locator('[data-testid="referral-status"]')).toContainText('Active');
    }
  });

  test('should export referral data', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Go to referrals page
    await page.goto('http://localhost:3000/referrals');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-referrals"]');
    const download = await downloadPromise;

    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('referrals');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});

test.describe('Agency Referral Configuration', () => {
  test('agency can configure referral rewards', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Go to agency settings
    await page.goto('http://localhost:3000/agency/settings');

    // Go to referral configuration tab
    await page.click('[data-testid="tab-referral"]');

    // Should see referral configuration form
    await expect(page.locator('[data-testid="org-signup-reward"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-signup-reward"]')).toBeVisible();
    await expect(page.locator('[data-testid="general-signup-reward"]')).toBeVisible();

    // Change reward amounts
    await page.fill('[data-testid="org-signup-reward"]', '500');
    await page.fill('[data-testid="admin-signup-reward"]', '300');
    await page.fill('[data-testid="general-signup-reward"]', '100');

    // Save configuration
    await page.click('[data-testid="save-referral-config"]');

    // Wait for success message
    const successMessage = page.locator('text=Configuration saved');
    await expect(successMessage).toBeVisible();
  });

  test('agency can enable/disable referral system', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    // Go to agency settings
    await page.goto('http://localhost:3000/agency/settings');

    // Go to referral configuration tab
    await page.click('[data-testid="tab-referral"]');

    // Toggle referral system off
    await page.uncheck('[data-testid="referral-enabled"]');
    await page.click('[data-testid="save-referral-config"]');

    // Wait for success message
    const successMessage = page.locator('text=Configuration saved');
    await expect(successMessage).toBeVisible();

    // Toggle referral system on
    await page.check('[data-testid="referral-enabled"]');
    await page.click('[data-testid="save-referral-config"]');

    // Wait for success message
    await expect(successMessage).toBeVisible();
  });
});

test.describe('Referral Link Tracking', () => {
  test('should track referral source', async ({ page, context }) => {
    // Get user's invite link
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/invite');
    const inviteLink = await page.locator('[data-testid="invite-link"]').textContent();

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Open new context and visit invite link directly
    const newPage = await context.newPage();
    await newPage.goto(inviteLink || '');

    // Should redirect to register page with pre-filled invite code
    await newPage.waitForURL('**/register');

    // Verify invite code is pre-filled
    const inviteCodeField = newPage.locator('[data-testid="invite-code"]');
    const preFilledCode = await inviteCodeField.inputValue();
    expect(preFilledCode).toBeTruthy();
    expect(preFilledCode.length).toBe(8);

    await newPage.close();
  });

  test('should track referral conversions', async ({ page, context }) => {
    // Get user's invite link
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/invite');
    const inviteLink = await page.locator('[data-testid="invite-link"]').textContent();

    // Get initial click count
    await page.goto('http://localhost:3000/referrals');
    const initialClicksText = await page.locator('[data-testid="link-clicks"]').textContent();
    const initialClicks = parseInt(initialClicksText || '0');

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Open new context and visit invite link
    const newPage = await context.newPage();
    await newPage.goto(inviteLink || '');
    await newPage.waitForURL('**/register');
    await newPage.close();

    // Login again and check click count
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');

    await page.goto('http://localhost:3000/referrals');
    const newClicksText = await page.locator('[data-testid="link-clicks"]').textContent();
    const newClicks = parseInt(newClicksText || '0');

    // Click count should have increased
    expect(newClicks).toBeGreaterThan(initialClicks);
  });
});
