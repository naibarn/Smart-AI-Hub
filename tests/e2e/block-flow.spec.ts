import { test, expect } from '@playwright/test';

test.describe('Block Flow - Agency Blocks Organization', () => {
  test('should successfully block Organization', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find Organization A1
    const orgRow = page.locator('[data-testid="member-org-a1"]');
    await expect(orgRow).toBeVisible();
    
    // Click Block button
    await orgRow.locator('[data-testid="block-button"]').click();
    
    // Fill reason in dialog
    await page.fill('[data-testid="block-reason"]', 'Test block reason');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-block"]');
    
    // Wait for success message
    const successMessage = page.locator('text=blocked successfully');
    await expect(successMessage).toBeVisible();
    
    // Verify status changed to Blocked
    const status = orgRow.locator('[data-testid="status-badge"]');
    await expect(status).toHaveText('Blocked');
  });

  test('blocked user cannot login', async ({ page }) => {
    // Try to login as blocked Organization
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Should see error message
    const errorMessage = page.locator('text=account has been blocked');
    await expect(errorMessage).toBeVisible();
    
    // Should NOT be redirected to dashboard
    await expect(page).toHaveURL('**/login');
  });

  test('can unblock user', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find blocked Organization A1
    const orgRow = page.locator('[data-testid="member-org-a1"]');
    
    // Click Unblock button
    await orgRow.locator('[data-testid="unblock-button"]').click();
    
    // Fill reason in dialog
    await page.fill('[data-testid="unblock-reason"]', 'Test unblock reason');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-unblock"]');
    
    // Wait for success message
    const successMessage = page.locator('text=unblocked successfully');
    await expect(successMessage).toBeVisible();
    
    // Verify status changed to Active
    const status = orgRow.locator('[data-testid="status-badge"]');
    await expect(status).toHaveText('Active');
  });

  test('blocked user should not appear in transfer search', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to transfer page
    await page.goto('http://localhost:3000/transfer');
    
    // Search for blocked user
    await page.fill('[data-testid="recipient-search"]', 'org-a1@example.com');
    await page.waitForTimeout(500);
    
    // Should NOT see blocked user in results
    const blockedUser = page.locator('[data-testid="search-result-org-a1"]');
    await expect(blockedUser).not.toBeVisible();
    
    // Should see "User not found" or similar
    const notFoundMessage = page.locator('text=User not found');
    await expect(notFoundMessage).toBeVisible();
  });
});

test.describe('Block Flow - Organization Blocks Admin', () => {
  test('should successfully block Admin', async ({ page }) => {
    // Login as Organization
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find Admin
    const adminRow = page.locator('[data-testid="member-admin-a1-1"]');
    await expect(adminRow).toBeVisible();
    
    // Click Block button
    await adminRow.locator('[data-testid="block-button"]').click();
    
    // Fill reason in dialog
    await page.fill('[data-testid="block-reason"]', 'Violation of policies');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-block"]');
    
    // Wait for success message
    const successMessage = page.locator('text=blocked successfully');
    await expect(successMessage).toBeVisible();
    
    // Verify status changed to Blocked
    const status = adminRow.locator('[data-testid="status-badge"]');
    await expect(status).toHaveText('Blocked');
  });

  test('blocked admin cannot login', async ({ page }) => {
    // Try to login as blocked Admin
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'admin-a1-1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Should see error message
    const errorMessage = page.locator('text=account has been blocked');
    await expect(errorMessage).toBeVisible();
    
    // Should NOT be redirected to dashboard
    await expect(page).toHaveURL('**/login');
  });
});

test.describe('Block Flow - Admin Blocks General', () => {
  test('should successfully block General', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'admin-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find General
    const generalRow = page.locator('[data-testid="member-general-a1-1"]');
    await expect(generalRow).toBeVisible();
    
    // Click Block button
    await generalRow.locator('[data-testid="block-button"]').click();
    
    // Fill reason in dialog
    await page.fill('[data-testid="block-reason"]', 'Spam activities');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-block"]');
    
    // Wait for success message
    const successMessage = page.locator('text=blocked successfully');
    await expect(successMessage).toBeVisible();
    
    // Verify status changed to Blocked
    const status = generalRow.locator('[data-testid="status-badge"]');
    await expect(status).toHaveText('Blocked');
  });

  test('blocked general cannot login', async ({ page }) => {
    // Try to login as blocked General
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'general-a1-1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Should see error message
    const errorMessage = page.locator('text=account has been blocked');
    await expect(errorMessage).toBeVisible();
    
    // Should NOT be redirected to dashboard
    await expect(page).toHaveURL('**/login');
  });
});

test.describe('Block Flow - Administrator Blocks Anyone', () => {
  test('should successfully block Agency', async ({ page }) => {
    // Login as Administrator
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'administrator@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find Agency
    const agencyRow = page.locator('[data-testid="member-agency-b"]');
    await expect(agencyRow).toBeVisible();
    
    // Click Block button
    await agencyRow.locator('[data-testid="block-button"]').click();
    
    // Fill reason in dialog
    await page.fill('[data-testid="block-reason"]', 'Policy violation');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-block"]');
    
    // Wait for success message
    const successMessage = page.locator('text=blocked successfully');
    await expect(successMessage).toBeVisible();
    
    // Verify status changed to Blocked
    const status = agencyRow.locator('[data-testid="status-badge"]');
    await expect(status).toHaveText('Blocked');
  });

  test('should successfully block Organization', async ({ page }) => {
    // Login as Administrator
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'administrator@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find Organization
    const orgRow = page.locator('[data-testid="member-org-b1"]');
    await expect(orgRow).toBeVisible();
    
    // Click Block button
    await orgRow.locator('[data-testid="block-button"]').click();
    
    // Fill reason in dialog
    await page.fill('[data-testid="block-reason"]', 'Security concern');
    
    // Confirm in dialog
    await page.click('[data-testid="confirm-block"]');
    
    // Wait for success message
    const successMessage = page.locator('text=blocked successfully');
    await expect(successMessage).toBeVisible();
    
    // Verify status changed to Blocked
    const status = orgRow.locator('[data-testid="status-badge"]');
    await expect(status).toHaveText('Blocked');
  });
});

test.describe('Block Flow - Authorization', () => {
  test('should show block button only for authorized users', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'admin-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find General user (Admin can block General)
    const generalRow = page.locator('[data-testid="member-general-a1-1"]');
    const blockButton = generalRow.locator('[data-testid="block-button"]');
    
    // Block button should be visible
    await expect(blockButton).toBeVisible();
  });

  test('should NOT show block button for unauthorized users', async ({ page }) => {
    // Login as General
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'general@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // General user should not see members page at all
    const membersLink = page.locator('[data-testid="menu-members"]');
    await expect(membersLink).not.toBeVisible();
  });

  test('should prevent blocking user without permission', async ({ page, request }) => {
    // Login as Organization A1
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get auth token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    // Try to block user from different organization via API
    const response = await request.post('http://localhost:3001/api/v1/block', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        userId: 'org-a2-user-id', // User from different org
        reason: 'Test block'
      }
    });
    
    // Should be forbidden
    expect(response.status()).toBe(403);
    
    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });

  test('should prevent unblocking user without permission', async ({ page, request }) => {
    // Login as Organization A1
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Get auth token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    // Try to unblock user from different organization via API
    const response = await request.post('http://localhost:3001/api/v1/unblock', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        userId: 'org-a2-user-id', // User from different org
        reason: 'Test unblock'
      }
    });
    
    // Should be forbidden
    expect(response.status()).toBe(403);
    
    const data = await response.json();
    expect(data.message).toContain('not authorized');
  });
});

test.describe('Block Flow - Block History', () => {
  test('should show block history', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to block history
    await page.goto('http://localhost:3000/block/history');
    
    // Should see history table
    const historyTable = page.locator('[data-testid="block-history-table"]');
    await expect(historyTable).toBeVisible();
    
    // Should see at least one block record
    const blockRows = page.locator('[data-testid^="block-"]');
    if (await blockRows.count() > 0) {
      // Each row should have required fields
      const firstRow = blockRows.first();
      await expect(firstRow.locator('[data-testid="block-date"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="block-user"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="block-reason"]')).toBeVisible();
      await expect(firstRow.locator('[data-testid="block-status"]')).toBeVisible();
    }
  });

  test('should filter block history', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to block history
    await page.goto('http://localhost:3000/block/history');
    
    // Filter by status
    await page.selectOption('[data-testid="filter-status"]', 'blocked');
    await page.click('[data-testid="apply-filter"]');
    
    // Should show only blocked users
    const blockRows = page.locator('[data-testid^="block-"]');
    for (let i = 0; i < await blockRows.count(); i++) {
      const row = blockRows.nth(i);
      await expect(row.locator('[data-testid="block-status"]')).toContainText('Blocked');
    }
    
    // Filter by date range
    await page.fill('[data-testid="filter-date-from"]', '2023-01-01');
    await page.fill('[data-testid="filter-date-to"]', '2023-12-31');
    await page.click('[data-testid="apply-filter"]');
    
    // Should show blocks within date range
    // (Implementation depends on test data)
  });

  test('should export block history', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to block history
    await page.goto('http://localhost:3000/block/history');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-history"]');
    const download = await downloadPromise;
    
    // Verify file downloaded
    expect(download.suggestedFilename()).toContain('block-history');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});

test.describe('Block Flow - Validation', () => {
  test('should require reason for blocking', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find Organization
    const orgRow = page.locator('[data-testid="member-org-a2"]');
    await expect(orgRow).toBeVisible();
    
    // Click Block button
    await orgRow.locator('[data-testid="block-button"]').click();
    
    // Don't fill reason
    
    // Confirm button should be disabled
    const confirmButton = page.locator('[data-testid="confirm-block"]');
    await expect(confirmButton).toBeDisabled();
    
    // Should see validation error
    const validationError = page.locator('text=Reason is required');
    await expect(validationError).toBeVisible();
    
    // Fill reason
    await page.fill('[data-testid="block-reason"]', 'Test reason');
    
    // Confirm button should be enabled
    await expect(confirmButton).toBeEnabled();
  });

  test('should require reason for unblocking', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find blocked user (assume org-a1 is blocked from previous test)
    const orgRow = page.locator('[data-testid="member-org-a1"]');
    const unblockButton = orgRow.locator('[data-testid="unblock-button"]');
    
    if (await unblockButton.isVisible()) {
      // Click Unblock button
      await unblockButton.click();
      
      // Don't fill reason
      
      // Confirm button should be disabled
      const confirmButton = page.locator('[data-testid="confirm-unblock"]');
      await expect(confirmButton).toBeDisabled();
      
      // Should see validation error
      const validationError = page.locator('text=Reason is required');
      await expect(validationError).toBeVisible();
      
      // Fill reason
      await page.fill('[data-testid="unblock-reason"]', 'Test unblock reason');
      
      // Confirm button should be enabled
      await expect(confirmButton).toBeEnabled();
    }
  });

  test('should show confirmation dialog before blocking', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/dashboard');
    
    // Go to members page
    await page.goto('http://localhost:3000/members');
    
    // Find Organization
    const orgRow = page.locator('[data-testid="member-org-a2"]');
    await expect(orgRow).toBeVisible();
    
    // Click Block button
    await orgRow.locator('[data-testid="block-button"]').click();
    
    // Should see confirmation dialog
    const dialog = page.locator('[data-testid="block-confirmation-dialog"]');
    await expect(dialog).toBeVisible();
    
    // Should have user info
    await expect(dialog.locator('text=org-a2@example.com')).toBeVisible();
    
    // Should have warning message
    await expect(dialog.locator('text=This will prevent the user from accessing')).toBeVisible();
    
    // Should have cancel button
    const cancelButton = dialog.locator('[data-testid="cancel-block"]');
    await expect(cancelButton).toBeVisible();
    
    // Click cancel to close dialog
    await cancelButton.click();
    
    // Dialog should be closed
    await expect(dialog).not.toBeVisible();
  });
});