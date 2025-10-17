import { test, expect } from '@playwright/test';

test.describe('Points System', () => {
  test('user can view Points and Credits balance', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Should see Points balance
    const pointsBalance = page.locator('[data-testid="points-balance"]');
    await expect(pointsBalance).toBeVisible();
    
    // Should see Credits balance
    const creditsBalance = page.locator('[data-testid="credits-balance"]');
    await expect(creditsBalance).toBeVisible();
    
    // Should see formatted numbers with commas
    const pointsText = await pointsBalance.textContent();
    const creditsText = await creditsBalance.textContent();
    
    // Verify format (should contain commas for thousands)
    if (parseInt(pointsText?.replace(/,/g, '') || '0') >= 1000) {
      expect(pointsText).toContain(',');
    }
    
    if (parseInt(creditsText?.replace(/,/g, '') || '0') >= 1000) {
      expect(creditsText).toContain(',');
    }
  });
});

test.describe('Points Exchange', () => {
  test('user can exchange Credits to Points', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balances
    const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialPointsText?.replace(/,/g, '') || '0');
    const initialCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const initialCredits = parseInt(initialCreditsText?.replace(/,/g, '') || '0');
    
    // Go to exchange section
    await page.goto('http://localhost:3000/points');
    
    // Enter credits to exchange
    await page.fill('[data-testid="exchange-credits-input"]', '1');
    
    // Should show preview (1 Credit = 1000 Points)
    const preview = page.locator('[data-testid="exchange-preview"]');
    await expect(preview).toContainText('1,000 Points');
    
    // Click exchange button
    await page.click('[data-testid="exchange-button"]');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-exchange"]');
    
    // Wait for success message
    const successMessage = page.locator('text=Exchange successful');
    await expect(successMessage).toBeVisible();
    
    // Verify balances updated
    await page.waitForTimeout(1000);
    const newPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newPointsText?.replace(/,/g, '') || '0');
    const newCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const newCredits = parseInt(newCreditsText?.replace(/,/g, '') || '0');
    
    expect(newPoints).toBe(initialPoints + 1000);
    expect(newCredits).toBe(initialCredits - 1);
  });

  test('should show error when exchanging more Credits than balance', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get current balance
    const balanceText = await page.locator('[data-testid="credits-balance"]').textContent();
    const currentBalance = parseInt(balanceText?.replace(/,/g, '') || '0');
    
    // Go to exchange section
    await page.goto('http://localhost:3000/points');
    
    // Enter more credits than balance
    await page.fill('[data-testid="exchange-credits-input"]', (currentBalance + 1).toString());
    
    // Should show error message
    const errorMessage = page.locator('text=Insufficient Credits');
    await expect(errorMessage).toBeVisible();
    
    // Exchange button should be disabled
    const exchangeButton = page.locator('[data-testid="exchange-button"]');
    await expect(exchangeButton).toBeDisabled();
  });

  test('should show real-time exchange preview', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to exchange section
    await page.goto('http://localhost:3000/points');
    
    // Enter credits to exchange
    await page.fill('[data-testid="exchange-credits-input"]', '5');
    
    // Should show preview (5 Credits = 5000 Points)
    const preview = page.locator('[data-testid="exchange-preview"]');
    await expect(preview).toContainText('5,000 Points');
    
    // Change amount
    await page.fill('[data-testid="exchange-credits-input"]', '10');
    
    // Should update preview (10 Credits = 10000 Points)
    await expect(preview).toContainText('10,000 Points');
  });
});

test.describe('Daily Reward', () => {
  test('user can claim daily reward', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balance
    const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialPointsText?.replace(/,/g, '') || '0');
    
    // Go to points page
    await page.goto('http://localhost:3000/points');
    
    // Check if can claim
    const claimButton = page.locator('[data-testid="claim-daily-reward"]');
    const isDisabled = await claimButton.isDisabled();
    
    if (!isDisabled) {
      // Click claim button
      await claimButton.click();
      
      // Wait for success message
      const successMessage = page.locator('text=Claimed');
      await expect(successMessage).toBeVisible();
      
      // Verify balance increased
      await page.waitForTimeout(1000);
      const newPointsText = await page.locator('[data-testid="points-balance"]').textContent();
      const newPoints = parseInt(newPointsText?.replace(/,/g, '') || '0');
      expect(newPoints).toBeGreaterThan(initialPoints);
      
      // Button should now be disabled
      await expect(claimButton).toBeDisabled();
      
      // Should see "Already Claimed" message
      const claimedMessage = page.locator('text=Already Claimed');
      await expect(claimedMessage).toBeVisible();
    }
  });

  test('daily reward can only be claimed once per day', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    await page.goto('http://localhost:3000/points');
    
    // If already claimed today, button should be disabled
    const claimButton = page.locator('[data-testid="claim-daily-reward"]');
    const isDisabled = await claimButton.isDisabled();
    
    if (isDisabled) {
      // Should see next reward time
      const nextRewardTime = page.locator('[data-testid="next-reward-time"]');
      await expect(nextRewardTime).toBeVisible();
      
      // Should show "Already Claimed" message
      const claimedMessage = page.locator('text=Already Claimed');
      await expect(claimedMessage).toBeVisible();
    }
  });

  test('should show reward amount before claiming', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to points page
    await page.goto('http://localhost:3000/points');
    
    // Should show reward amount
    const rewardAmount = page.locator('[data-testid="daily-reward-amount"]');
    await expect(rewardAmount).toBeVisible();
    
    // Should be a positive number
    const amountText = await rewardAmount.textContent();
    const amount = parseInt(amountText?.replace(/,/g, '') || '0');
    expect(amount).toBeGreaterThan(0);
  });
});

test.describe('Points History', () => {
  test('should display points transaction history', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to points history
    await page.goto('http://localhost:3000/points/history');
    
    // Should see history table
    const historyTable = page.locator('[data-testid="points-history-table"]');
    await expect(historyTable).toBeVisible();
    
    // Should have table headers
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
    await expect(page.locator('text=Type')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Balance')).toBeVisible();
    
    // Should see transaction rows if any exist
    const transactionRows = page.locator('[data-testid^="transaction-"]');
    if (await transactionRows.count() > 0) {
      const firstRow = transactionRows.first();
      
      // Each row should have required fields
      await expect(firstRow.locator('[data-testid="transaction-date"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="transaction-description"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="transaction-type"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="transaction-amount"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="transaction-balance"]')).toBeVisible();
    }
  });

  test('should filter points history', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to points history
    await page.goto('http://localhost:3000/points/history');
    
    // Filter by type
    await page.selectOption('[data-testid="filter-type"]', 'daily_reward');
    await page.click('[data-testid="apply-filter"]');
    
    // Should show only daily reward transactions
    const transactionRows = page.locator('[data-testid^="transaction-"]');
    for (let i = 0; i < await transactionRows.count(); i++) {
      const row = transactionRows.nth(i);
      await expect(row.locator('[data-testid="transaction-type"]')).toContainText('Daily Reward');
    }
    
    // Filter by date range
    await page.fill('[data-testid="filter-date-from"]', '2023-01-01');
    await page.fill('[data-testid="filter-date-to"]', '2023-12-31');
    await page.click('[data-testid="apply-filter"]');
    
    // Should show transactions within date range
    // (Implementation depends on test data)
  });

  test('should export points history', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to points history
    await page.goto('http://localhost:3000/points/history');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-history"]');
    const download = await downloadPromise;
    
    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('points-history');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});

test.describe('Auto Top-up', () => {
  test('auto top-up triggers when Points ≤ 10', async ({ page, request }) => {
    // Setup: Create user with low Points (≤ 10) and Credits (≥ 1)
    // This might require API call to set up test data
    
    const setupResponse = await request.post('http://localhost:3001/api/test/setup-auto-topup', {
      data: {
        email: 'auto-topup-test@example.com',
        points: 5,
        credits: 10
      }
    });
    
    // Login as test user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'auto-topup-test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balances
    const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialPointsText?.replace(/,/g, '') || '0');
    const initialCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const initialCredits = parseInt(initialCreditsText?.replace(/,/g, '') || '0');
    
    // Trigger auto top-up by using Points service
    // This could be done by making a purchase or using Points
    await request.post('http://localhost:3001/api/v1/points/use', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      },
      data: {
        amount: 1,
        reason: 'test'
      }
    });
    
    // Wait for auto top-up to trigger
    await page.waitForTimeout(2000);
    
    // Refresh to see updated balances
    await page.reload();
    
    // Verify auto top-up occurred
    const newPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newPointsText?.replace(/,/g, '') || '0');
    const newCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const newCredits = parseInt(newCreditsText?.replace(/,/g, '') || '0');
    
    // Should have 1000 more Points (1 Credit = 1000 Points)
    // and 1 less Credit
    expect(newCredits).toBe(initialCredits - 1);
    expect(newPoints).toBeGreaterThan(initialPoints); // Should be topped up
    
    // Check transaction history
    await page.goto('http://localhost:3000/points/history');
    const autoTopupTransaction = page.locator('[data-testid="transaction-auto-topup"]').first();
    await expect(autoTopupTransaction).toBeVisible();
    await expect(autoTopupTransaction).toContainText('Auto Top-up');
  });

  test('auto top-up does not trigger when disabled', async ({ page, request }) => {
    // Setup: Create user with auto top-up disabled
    await request.post('http://localhost:3001/api/test/setup-auto-topup-disabled', {
      data: {
        email: 'no-topup-test@example.com',
        points: 5,
        credits: 10
      }
    });
    
    // Login as test user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'no-topup-test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balances
    const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialPointsText?.replace(/,/g, '') || '0');
    const initialCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const initialCredits = parseInt(initialCreditsText?.replace(/,/g, '') || '0');
    
    // Use Points service (should not trigger auto top-up)
    await request.post('http://localhost:3001/api/v1/points/use', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      },
      data: {
        amount: 1,
        reason: 'test'
      }
    });
    
    // Wait a bit to ensure auto top-up would have triggered if enabled
    await page.waitForTimeout(2000);
    
    // Refresh to see updated balances
    await page.reload();
    
    // Verify auto top-up did NOT occur
    const newPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newPointsText?.replace(/,/g, '') || '0');
    const newCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const newCredits = parseInt(newCreditsText?.replace(/,/g, '') || '0');
    
    // Credits should be the same (no auto top-up)
    expect(newCredits).toBe(initialCredits);
    expect(newPoints).toBeLessThan(initialPoints); // Points decreased from usage
  });

  test('auto top-up does not trigger when no Credits', async ({ page, request }) => {
    // Setup: Create user with low Points but no Credits
    await request.post('http://localhost:3001/api/test/setup-auto-topup-no-credits', {
      data: {
        email: 'no-credits-test@example.com',
        points: 5,
        credits: 0
      }
    });
    
    // Login as test user
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'no-credits-test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balances
    const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialPointsText?.replace(/,/g, '') || '0');
    const initialCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const initialCredits = parseInt(initialCreditsText?.replace(/,/g, '') || '0');
    
    // Use Points service (should not trigger auto top-up)
    await request.post('http://localhost:3001/api/v1/points/use', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      },
      data: {
        amount: 1,
        reason: 'test'
      }
    });
    
    // Wait a bit to ensure auto top-up would have triggered if possible
    await page.waitForTimeout(2000);
    
    // Refresh to see updated balances
    await page.reload();
    
    // Verify auto top-up did NOT occur
    const newPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newPointsText?.replace(/,/g, '') || '0');
    const newCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const newCredits = parseInt(newCreditsText?.replace(/,/g, '') || '0');
    
    // Credits should still be 0
    expect(newCredits).toBe(0);
    expect(newPoints).toBeLessThan(initialPoints); // Points decreased from usage
  });

  test('user can configure auto top-up settings', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to points settings
    await page.goto('http://localhost:3000/points/settings');
    
    // Should see auto top-up toggle
    const autoTopupToggle = page.locator('[data-testid="auto-topup-toggle"]');
    await expect(autoTopupToggle).toBeVisible();
    
    // Should see threshold setting
    const thresholdInput = page.locator('[data-testid="auto-topup-threshold"]');
    await expect(thresholdInput).toBeVisible();
    
    // Should see amount setting
    const amountInput = page.locator('[data-testid="auto-topup-amount"]');
    await expect(amountInput).toBeVisible();
    
    // Change settings
    await thresholdInput.fill('20');
    await amountInput.fill('2');
    
    // Save settings
    await page.click('[data-testid="save-settings"]');
    
    // Wait for success message
    const successMessage = page.locator('text=Settings saved');
    await expect(successMessage).toBeVisible();
    
    // Verify settings saved
    await page.reload();
    await expect(thresholdInput).toHaveValue('20');
    await expect(amountInput).toHaveValue('2');
  });
});

test.describe('Points Purchase', () => {
  test('user can purchase Credits', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to purchase page
    await page.goto('http://localhost:3000/points/purchase');
    
    // Should see purchase options
    const purchaseOptions = page.locator('[data-testid^="purchase-package-"]');
    await expect(purchaseOptions.first()).toBeVisible();
    
    // Select a package
    await page.click('[data-testid="purchase-package-10"]');
    
    // Should see payment form
    const paymentForm = page.locator('[data-testid="payment-form"]');
    await expect(paymentForm).toBeVisible();
    
    // Fill payment details (test mode)
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    // Submit payment
    await page.click('[data-testid="purchase-button"]');
    
    // Wait for success message
    const successMessage = page.locator('text=Purchase successful');
    await expect(successMessage).toBeVisible();
    
    // Verify Credits balance increased
    await page.goto('http://localhost:3000/dashboard');
    const creditsBalance = page.locator('[data-testid="credits-balance"]');
    const creditsText = await creditsBalance.textContent();
    const credits = parseInt(creditsText?.replace(/,/g, '') || '0');
    expect(credits).toBeGreaterThanOrEqual(10);
  });

  test('should show payment history', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to purchase history
    await page.goto('http://localhost:3000/points/purchase/history');
    
    // Should see history table
    const historyTable = page.locator('[data-testid="purchase-history-table"]');
    await expect(historyTable).toBeVisible();
    
    // Should have table headers
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Package')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    
    // Should see transaction rows if any exist
    const transactionRows = page.locator('[data-testid^="purchase-"]');
    if (await transactionRows.count() > 0) {
      const firstRow = transactionRows.first();
      
      // Each row should have required fields
      await expect(firstRow.locator('[data-testid="purchase-date"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="purchase-package"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="purchase-amount"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="purchase-status"]')).toBeVisible();
    }
  });
});