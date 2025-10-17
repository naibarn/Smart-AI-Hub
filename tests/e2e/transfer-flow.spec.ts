import { test, expect } from '@playwright/test';

test.describe('Transfer Flow - Agency to Organization', () => {
  test('should successfully transfer Points from Agency to Organization', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balance
    const initialBalance = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialBalance?.replace(/,/g, '') || '0');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for Organization
    await page.fill('[data-testid="recipient-search"]', 'org-a1@example.com');
    await page.waitForTimeout(500);
    await page.click('[data-testid="search-result-org-a1"]');
    
    // Select Points
    await page.click('[data-testid="transfer-type-points"]');
    
    // Enter amount
    await page.fill('[data-testid="transfer-amount"]', '1000');
    
    // Submit
    await page.click('[data-testid="transfer-submit"]');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-transfer"]');
    
    // Wait for success message
    const successMessage = page.locator('text=Transfer Successful');
    await expect(successMessage).toBeVisible();
    
    // Verify balance updated
    await page.waitForTimeout(1000); // Wait for balance update
    const newBalance = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newBalance?.replace(/,/g, '') || '0');
    expect(newPoints).toBe(initialPoints - 1000);
    
    // Verify transfer appears in history
    await page.goto('http://localhost:3000/transfer/history');
    const latestTransfer = page.locator('[data-testid="transfer-0"]');
    await expect(latestTransfer).toContainText('1000 Points');
    await expect(latestTransfer).toContainText('org-a1@example.com');
  });

  test('should successfully transfer Credits from Agency to Organization', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balance
    const initialBalance = await page.locator('[data-testid="credits-balance"]').textContent();
    const initialCredits = parseInt(initialBalance?.replace(/,/g, '') || '0');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for Organization
    await page.fill('[data-testid="recipient-search"]', 'org-a1@example.com');
    await page.waitForTimeout(500);
    await page.click('[data-testid="search-result-org-a1"]');
    
    // Select Credits
    await page.click('[data-testid="transfer-type-credits"]');
    
    // Enter amount
    await page.fill('[data-testid="transfer-amount"]', '5');
    
    // Submit
    await page.click('[data-testid="transfer-submit"]');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-transfer"]');
    
    // Wait for success message
    const successMessage = page.locator('text=Transfer Successful');
    await expect(successMessage).toBeVisible();
    
    // Verify balance updated
    await page.waitForTimeout(1000); // Wait for balance update
    const newBalance = await page.locator('[data-testid="credits-balance"]').textContent();
    const newCredits = parseInt(newBalance?.replace(/,/g, '') || '0');
    expect(newCredits).toBe(initialCredits - 5);
    
    // Verify transfer appears in history
    await page.goto('http://localhost:3000/transfer/history');
    const latestTransfer = page.locator('[data-testid="transfer-0"]');
    await expect(latestTransfer).toContainText('5 Credits');
    await expect(latestTransfer).toContainText('org-a1@example.com');
  });

  test('should successfully transfer combined Points and Credits', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balances
    const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialPointsText?.replace(/,/g, '') || '0');
    const initialCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const initialCredits = parseInt(initialCreditsText?.replace(/,/g, '') || '0');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for Organization
    await page.fill('[data-testid="recipient-search"]', 'org-a1@example.com');
    await page.waitForTimeout(500);
    await page.click('[data-testid="search-result-org-a1"]');
    
    // Select Both
    await page.click('[data-testid="transfer-type-both"]');
    
    // Enter amounts
    await page.fill('[data-testid="transfer-points-amount"]', '500');
    await page.fill('[data-testid="transfer-credits-amount"]', '2');
    
    // Submit
    await page.click('[data-testid="transfer-submit"]');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-transfer"]');
    
    // Wait for success message
    const successMessage = page.locator('text=Transfer Successful');
    await expect(successMessage).toBeVisible();
    
    // Verify balances updated
    await page.waitForTimeout(1000); // Wait for balance update
    const newPointsText = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newPointsText?.replace(/,/g, '') || '0');
    const newCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
    const newCredits = parseInt(newCreditsText?.replace(/,/g, '') || '0');
    
    expect(newPoints).toBe(initialPoints - 500);
    expect(newCredits).toBe(initialCredits - 2);
  });
});

test.describe('Transfer Flow - Organization to Admin', () => {
  test('should successfully transfer Points from Organization to Admin', async ({ page }) => {
    // Login as Organization
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balance
    const initialBalance = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialBalance?.replace(/,/g, '') || '0');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for Admin
    await page.fill('[data-testid="recipient-search"]', 'admin-a1@example.com');
    await page.waitForTimeout(500);
    await page.click('[data-testid="search-result-admin-a1"]');
    
    // Select Points
    await page.click('[data-testid="transfer-type-points"]');
    
    // Enter amount
    await page.fill('[data-testid="transfer-amount"]', '500');
    
    // Submit
    await page.click('[data-testid="transfer-submit"]');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-transfer"]');
    
    // Wait for success message
    const successMessage = page.locator('text=Transfer Successful');
    await expect(successMessage).toBeVisible();
    
    // Verify balance updated
    await page.waitForTimeout(1000); // Wait for balance update
    const newBalance = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newBalance?.replace(/,/g, '') || '0');
    expect(newPoints).toBe(initialPoints - 500);
  });
});

test.describe('Transfer Flow - Admin to General', () => {
  test('should successfully transfer Points from Admin to General', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'admin-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get initial balance
    const initialBalance = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialBalance?.replace(/,/g, '') || '0');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for General
    await page.fill('[data-testid="recipient-search"]', 'general-a1@example.com');
    await page.waitForTimeout(500);
    await page.click('[data-testid="search-result-general-a1"]');
    
    // Select Points
    await page.click('[data-testid="transfer-type-points"]');
    
    // Enter amount
    await page.fill('[data-testid="transfer-amount"]', '200');
    
    // Submit
    await page.click('[data-testid="transfer-submit"]');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-transfer"]');
    
    // Wait for success message
    const successMessage = page.locator('text=Transfer Successful');
    await expect(successMessage).toBeVisible();
    
    // Verify balance updated
    await page.waitForTimeout(1000); // Wait for balance update
    const newBalance = await page.locator('[data-testid="points-balance"]').textContent();
    const newPoints = parseInt(newBalance?.replace(/,/g, '') || '0');
    expect(newPoints).toBe(initialPoints - 200);
  });
});

test.describe('Transfer Flow - Error Cases', () => {
  test('should show error when transferring more than balance', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get current balance
    const balanceText = await page.locator('[data-testid="points-balance"]').textContent();
    const currentBalance = parseInt(balanceText?.replace(/,/g, '') || '0');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for Organization
    await page.fill('[data-testid="recipient-search"]', 'org-a1@example.com');
    await page.waitForTimeout(500);
    await page.click('[data-testid="search-result-org-a1"]');
    
    // Select Points
    await page.click('[data-testid="transfer-type-points"]');
    
    // Enter amount MORE than balance
    await page.fill('[data-testid="transfer-amount"]', (currentBalance + 1000).toString());
    
    // Submit
    await page.click('[data-testid="transfer-submit"]');
    
    // Should see error message
    const errorMessage = page.locator('text=Insufficient');
    await expect(errorMessage).toBeVisible();
    
    // Transfer button should be disabled or error shown
    const confirmButton = page.locator('[data-testid="confirm-transfer"]');
    await expect(confirmButton).not.toBeVisible(); // Dialog shouldn't open
  });

  test('should show error when transferring to blocked user', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for blocked user
    await page.fill('[data-testid="recipient-search"]', 'blocked-user@example.com');
    await page.waitForTimeout(500);
    
    // Should see "User not found" or similar message
    const notFoundMessage = page.locator('text=User not found');
    await expect(notFoundMessage).toBeVisible();
  });

  test('should show error when transferring with invalid amount', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for Organization
    await page.fill('[data-testid="recipient-search"]', 'org-a1@example.com');
    await page.waitForTimeout(500);
    await page.click('[data-testid="search-result-org-a1"]');
    
    // Select Points
    await page.click('[data-testid="transfer-type-points"]');
    
    // Enter invalid amount (zero)
    await page.fill('[data-testid="transfer-amount"]', '0');
    
    // Submit button should be disabled
    const submitButton = page.locator('[data-testid="transfer-submit"]');
    await expect(submitButton).toBeDisabled();
    
    // Enter invalid amount (negative)
    await page.fill('[data-testid="transfer-amount"]', '-100');
    
    // Submit button should still be disabled
    await expect(submitButton).toBeDisabled();
    
    // Should see validation error
    const validationError = page.locator('text=Amount must be greater than 0');
    await expect(validationError).toBeVisible();
  });

  test('should show error when transferring without selecting recipient', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Don't select recipient
    
    // Enter amount
    await page.fill('[data-testid="transfer-amount"]', '100');
    
    // Submit button should be disabled
    const submitButton = page.locator('[data-testid="transfer-submit"]');
    await expect(submitButton).toBeDisabled();
    
    // Should see validation error
    const validationError = page.locator('text=Please select a recipient');
    await expect(validationError).toBeVisible();
  });
});

test.describe('Transfer Flow - Authorization', () => {
  test('should not show invisible users in search results', async ({ page }) => {
    // Login as Organization A1
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for user from different Organization (should not appear)
    await page.fill('[data-testid="recipient-search"]', 'org-a2@example.com');
    await page.waitForTimeout(500);
    
    // Should NOT see Organization A2 in results
    const orgA2Result = page.locator('[data-testid="search-result-org-a2"]');
    await expect(orgA2Result).not.toBeVisible();
    
    // Should see "No results" or empty state
    const noResults = page.locator('text=No users found');
    await expect(noResults).toBeVisible();
  });

  test('should prevent transfer to invisible user via direct API', async ({ page, request }) => {
    // Login as Organization A1
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get auth token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    // Try to transfer to invisible user via API
    const response = await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        recipientId: 'org-a2-user-id', // Invisible user
        amount: 1000,
        type: 'points'
      }
    });
    
    // Should be forbidden
    expect(response.status()).toBe(403);
    
    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('should prevent transfer from General user', async ({ page }) => {
    // Login as General
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'general@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Try to access transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Should be redirected or see access denied
    await expect(page).toHaveURL(/\/(dashboard|403)/);
    
    // Should see access denied message
    const accessDenied = page.locator('text=Access Denied');
    await expect(accessDenied).toBeVisible();
  });
});

test.describe('Transfer Flow - History', () => {
  test('should show transfer history', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to transfer history
    await page.goto('http://localhost:3000/transfer/history');
    
    // Should see history table
    const historyTable = page.locator('[data-testid="transfer-history-table"]');
    await expect(historyTable).toBeVisible();
    
    // Should see at least one transfer
    const transferRows = page.locator('[data-testid^="transfer-"]');
    await expect(transferRows.first()).toBeVisible();
    
    // Each row should have required fields
    const firstRow = transferRows.first();
    await expect(firstRow.locator('[data-testid="transfer-date"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="transfer-recipient"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="transfer-amount"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="transfer-type"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="transfer-status"]')).toBeVisible();
  });

  test('should filter transfer history', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to transfer history
    await page.goto('http://localhost:3000/transfer/history');
    
    // Filter by type
    await page.selectOption('[data-testid="filter-type"]', 'points');
    await page.click('[data-testid="apply-filter"]');
    
    // Should show only Points transfers
    const transferRows = page.locator('[data-testid^="transfer-"]');
    for (let i = 0; i < await transferRows.count(); i++) {
      const row = transferRows.nth(i);
      await expect(row.locator('[data-testid="transfer-type"]')).toContainText('Points');
    }
    
    // Filter by date range
    await page.fill('[data-testid="filter-date-from"]', '2023-01-01');
    await page.fill('[data-testid="filter-date-to"]', '2023-12-31');
    await page.click('[data-testid="apply-filter"]');
    
    // Should show transfers within date range
    // (Implementation depends on test data)
  });

  test('should export transfer history', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to transfer history
    await page.goto('http://localhost:3000/transfer/history');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-history"]');
    const download = await downloadPromise;
    
    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('transfer-history');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});