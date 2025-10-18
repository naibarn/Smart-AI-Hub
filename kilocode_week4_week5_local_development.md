Create comprehensive E2E tests, perform security audit, and final validation for Smart AI Hub's Points System and Multi-tier Hierarchy (Local Development Only).

# Task: Week 4 & 5 - E2E Tests, Security Audit & Final Validation (Local Development)

## Objective

Create comprehensive End-to-End (E2E) tests covering all user flows, perform thorough security audit focusing on visibility rules and authorization, and conduct final validation to ensure the system is production-ready. This task covers local development and testing only, NOT deployment to production.

## Context

Smart AI Hub has completed backend implementation and frontend UI for Points System and Multi-tier User Hierarchy. Now we need to ensure everything works correctly through comprehensive E2E testing and security verification before production deployment.

## Technology Stack

- **Testing Framework:** Playwright or Cypress
- **Language:** TypeScript
- **Test Runner:** Jest or Mocha
- **Assertion Library:** Chai or Jest Expect
- **Coverage Tool:** Istanbul/nyc
- **Security Testing:** OWASP ZAP, manual testing
- **Performance Testing:** k6 or Artillery

---

# Week 4: E2E Tests (4 Days)

## Day 1: Access Control & Visibility Tests

### Task 1: Access Control Tests

**File:** `tests/e2e/access-control.spec.ts`

**Objective:** Verify that route guards and access control work correctly for all user tiers.

#### Test Cases

##### TC1: General User Cannot Access /members Page

```typescript
import { test, expect } from '@playwright/test';

test.describe('Access Control - General User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as General user
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'general@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
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
});
```

---

##### TC2: Agency Can Access All Pages

```typescript
test.describe('Access Control - Agency User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Agency user
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'agency@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should see Members menu item', async ({ page }) => {
    const membersLink = page.locator('[data-testid="menu-members"]');
    await expect(membersLink).toBeVisible();
  });

  test('should access /members page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/members');
    await expect(page).toHaveURL('**/members');

    const pageTitle = page.locator('h1:has-text("Members")');
    await expect(pageTitle).toBeVisible();
  });

  test('should see Agency Settings menu item', async ({ page }) => {
    const agencySettingsLink = page.locator('[data-testid="menu-agency-settings"]');
    await expect(agencySettingsLink).toBeVisible();
  });

  test('should access /agency/settings page successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/agency/settings');
    await expect(page).toHaveURL('**/agency/settings');

    const pageTitle = page.locator('h1:has-text("Agency Settings")');
    await expect(pageTitle).toBeVisible();
  });
});
```

---

##### TC3: Organization Cannot Access Agency Settings

```typescript
test.describe('Access Control - Organization User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Organization user
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'org@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should see Members menu item', async ({ page }) => {
    const membersLink = page.locator('[data-testid="menu-members"]');
    await expect(membersLink).toBeVisible();
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
});
```

**Deliverable:**

- ✅ `tests/e2e/access-control.spec.ts` with all test cases
- ✅ All access control tests passing

---

### Task 2: Visibility Tests

**File:** `tests/e2e/visibility.spec.ts`

**Objective:** Verify that visibility rules are enforced correctly - users can only see other users they are authorized to see.

#### Test Cases

##### TC1: Agency Sees Only Their Organizations

```typescript
test.describe('Visibility - Agency User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Agency user (Agency A)
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
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
});
```

---

##### TC2: Organization Sees Only Their Members

```typescript
test.describe('Visibility - Organization User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Organization user (Org A1)
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'org-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
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
});
```

---

##### TC3: Admin Sees Only Generals in Same Org

```typescript
test.describe('Visibility - Admin User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin user (Admin in Org A1)
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'admin-a1@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
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
});
```

**Deliverable:**

- ✅ `tests/e2e/visibility.spec.ts` with all test cases
- ✅ All visibility tests passing
- ✅ Verified visibility rules enforced correctly

---

## Day 2: Transfer & Block Flow Tests

### Task 3: Transfer Flow Tests

**File:** `tests/e2e/transfer-flow.spec.ts`

**Objective:** Verify that transfer functionality works correctly with proper authorization and balance updates.

#### Test Cases

##### TC1: Agency Can Transfer to Organization

```typescript
test.describe('Transfer Flow - Agency to Organization', () => {
  test('should successfully transfer Points from Agency to Organization', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    // Get initial balance
    const initialBalance = await page.locator('[data-testid="points-balance"]').textContent();
    const initialPoints = parseInt(initialBalance.replace(/,/g, ''));

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
    const newPoints = parseInt(newBalance.replace(/,/g, ''));
    expect(newPoints).toBe(initialPoints - 1000);

    // Verify transfer appears in history
    await page.goto('http://localhost:3000/transfer/history');
    const latestTransfer = page.locator('[data-testid="transfer-0"]');
    await expect(latestTransfer).toContainText('1000 Points');
    await expect(latestTransfer).toContainText('org-a1@example.com');
  });

  test('should successfully transfer Credits from Agency to Organization', async ({ page }) => {
    // Similar to above but with Credits
    // ... implementation
  });
});
```

---

##### TC2: Cannot Transfer with Insufficient Balance

```typescript
test('should show error when transferring more than balance', async ({ page }) => {
  // Login as Agency
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', 'agency-a@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

  // Get current balance
  const balanceText = await page.locator('[data-testid="points-balance"]').textContent();
  const currentBalance = parseInt(balanceText.replace(/,/g, ''));

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
```

---

##### TC3: Cannot Transfer to Invisible User

```typescript
test('should not show invisible users in search results', async ({ page }) => {
  // Login as Organization A1
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', 'org-a1@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

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
```

**Deliverable:**

- ✅ `tests/e2e/transfer-flow.spec.ts` with all test cases
- ✅ All transfer flow tests passing
- ✅ Verified authorization and balance updates

---

### Task 4: Block Flow Tests

**File:** `tests/e2e/block-flow.spec.ts`

**Objective:** Verify that block/unblock functionality works correctly with proper authorization.

#### Test Cases

##### TC1: Agency Can Block Organization

```typescript
test.describe('Block Flow - Agency Blocks Organization', () => {
  test('should successfully block Organization', async ({ page }) => {
    // Login as Agency
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    // Go to members page
    await page.goto('http://localhost:3000/members');

    // Find Organization A1
    const orgRow = page.locator('[data-testid="member-org-a1"]');
    await expect(orgRow).toBeVisible();

    // Click Block button
    await orgRow.locator('[data-testid="block-button"]').click();

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
    await page.fill('[data-testid="email"]', 'org-a1@example.com');
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
    await page.fill('[data-testid="email"]', 'agency-a@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    // Go to members page
    await page.goto('http://localhost:3000/members');

    // Find blocked Organization A1
    const orgRow = page.locator('[data-testid="member-org-a1"]');

    // Click Unblock button
    await orgRow.locator('[data-testid="unblock-button"]').click();

    // Confirm in dialog
    await page.click('[data-testid="confirm-unblock"]');

    // Wait for success message
    const successMessage = page.locator('text=unblocked successfully');
    await expect(successMessage).toBeVisible();

    // Verify status changed to Active
    const status = orgRow.locator('[data-testid="status-badge"]');
    await expect(status).toHaveText('Active');
  });
});
```

---

##### TC2: Block Button Visibility Based on Authorization

```typescript
test('should show block button only for authorized users', async ({ page }) => {
  // Login as Admin
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', 'admin-a1@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

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
  await page.fill('[data-testid="email"]', 'general@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

  // General user should not see members page at all
  const membersLink = page.locator('[data-testid="menu-members"]');
  await expect(membersLink).not.toBeVisible();
});
```

**Deliverable:**

- ✅ `tests/e2e/block-flow.spec.ts` with all test cases
- ✅ All block flow tests passing
- ✅ Verified authorization for block/unblock

---

## Day 3: Referral & Points Flow Tests

### Task 5: Referral Flow Tests

**File:** `tests/e2e/referral-flow.spec.ts`

**Objective:** Verify that referral system works correctly with invite codes and rewards.

#### Test Cases

##### TC1: Complete Referral Flow

```typescript
test.describe('Referral Flow', () => {
  let inviteCode: string;
  let inviteLink: string;

  test('user can generate and view invite code', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    // Go to invite page
    await page.goto('http://localhost:3000/invite');

    // Should see invite code
    const codeElement = page.locator('[data-testid="invite-code"]');
    await expect(codeElement).toBeVisible();
    inviteCode = await codeElement.textContent();

    // Should see invite link
    const linkElement = page.locator('[data-testid="invite-link"]');
    await expect(linkElement).toBeVisible();
    inviteLink = await linkElement.textContent();

    // Should see QR code
    const qrCode = page.locator('[data-testid="qr-code"]');
    await expect(qrCode).toBeVisible();
  });

  test('user can copy invite link', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/invite');

    // Click copy button
    await page.click('[data-testid="copy-link-button"]');

    // Should see success message
    const successMessage = page.locator('text=copied');
    await expect(successMessage).toBeVisible();
  });

  test('new user can register with invite code', async ({ page, context }) => {
    // Get initial referral count
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/referrals');
    const initialCountText = await page.locator('[data-testid="total-referrals"]').textContent();
    const initialCount = parseInt(initialCountText);

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
    await newPage.fill('[data-testid="invite-code"]', inviteCode);

    // Submit
    await newPage.click('[data-testid="register-button"]');

    // Should be redirected to dashboard
    await newPage.waitForURL('**/dashboard');

    // Close new user page
    await newPage.close();

    // Login as original user again
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    // Check referral count increased
    await page.goto('http://localhost:3000/referrals');
    const newCountText = await page.locator('[data-testid="total-referrals"]').textContent();
    const newCount = parseInt(newCountText);
    expect(newCount).toBe(initialCount + 1);

    // Should see new referral in list
    const newReferral = page.locator('[data-testid="referral-newuser@example.com"]');
    await expect(newReferral).toBeVisible();
  });

  test('referrer receives reward', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    // Go to referrals page
    await page.goto('http://localhost:3000/referrals');

    // Check rewards history
    const rewardsHistory = page.locator('[data-testid="rewards-history"]');
    await expect(rewardsHistory).toBeVisible();

    // Should see reward for newuser@example.com
    const reward = page.locator('[data-testid="reward-newuser@example.com"]');
    await expect(reward).toBeVisible();
    await expect(reward).toContainText('Points'); // Reward amount
  });

  test('cannot use own invite code', async ({ page }) => {
    // Login as user
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    // Get own invite code
    await page.goto('http://localhost:3000/invite');
    const codeElement = page.locator('[data-testid="invite-code"]');
    const ownCode = await codeElement.textContent();

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Try to register with own code
    await page.goto('http://localhost:3000/register');
    await page.fill('[data-testid="name"]', 'Test User');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="invite-code"]', ownCode);
    await page.click('[data-testid="register-button"]');

    // Should see error
    const errorMessage = page.locator('text=cannot use your own invite code');
    await expect(errorMessage).toBeVisible();
  });
});
```

**Deliverable:**

- ✅ `tests/e2e/referral-flow.spec.ts` with all test cases
- ✅ All referral flow tests passing
- ✅ Verified invite codes and rewards work correctly

---

### Task 6: Points System Tests

**File:** `tests/e2e/points-system.spec.ts`

**Objective:** Verify that Points System features work correctly including daily rewards, exchange, purchase, and auto top-up.

#### Test Cases

##### TC1: View Balances

```typescript
test.describe('Points System', () => {
  test('user can view Points and Credits balance', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');

    // Should see Points balance
    const pointsBalance = page.locator('[data-testid="points-balance"]');
    await expect(pointsBalance).toBeVisible();

    // Should see Credits balance
    const creditsBalance = page.locator('[data-testid="credits-balance"]');
    await expect(creditsBalance).toBeVisible();
  });
});
```

---

##### TC2: Exchange Credits to Points

```typescript
test('user can exchange Credits to Points', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

  // Get initial balances
  const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
  const initialPoints = parseInt(initialPointsText.replace(/,/g, ''));
  const initialCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
  const initialCredits = parseInt(initialCreditsText.replace(/,/g, ''));

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
  const newPoints = parseInt(newPointsText.replace(/,/g, ''));
  const newCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
  const newCredits = parseInt(newCreditsText.replace(/,/g, ''));

  expect(newPoints).toBe(initialPoints + 1000);
  expect(newCredits).toBe(initialCredits - 1);
});
```

---

##### TC3: Daily Reward

```typescript
test('user can claim daily reward', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

  // Get initial balance
  const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
  const initialPoints = parseInt(initialPointsText.replace(/,/g, ''));

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
    const newPoints = parseInt(newPointsText.replace(/,/g, ''));
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
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

  await page.goto('http://localhost:3000/points');

  // If already claimed today, button should be disabled
  const claimButton = page.locator('[data-testid="claim-daily-reward"]');
  const isDisabled = await claimButton.isDisabled();

  if (isDisabled) {
    // Should see next reward time
    const nextRewardTime = page.locator('[data-testid="next-reward-time"]');
    await expect(nextRewardTime).toBeVisible();
  }
});
```

---

##### TC4: Auto Top-up

```typescript
test('auto top-up triggers when Points ≤ 10', async ({ page, request }) => {
  // Setup: Create user with low Points (≤ 10) and Credits (≥ 1)
  // This might require API call to set up test data

  const setupResponse = await request.post('http://localhost:3001/api/test/setup-auto-topup', {
    data: {
      email: 'auto-topup-test@example.com',
      points: 5,
      credits: 10,
    },
  });

  // Login as test user
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', 'auto-topup-test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');

  // Get initial balances
  const initialPointsText = await page.locator('[data-testid="points-balance"]').textContent();
  const initialPoints = parseInt(initialPointsText.replace(/,/g, ''));
  const initialCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
  const initialCredits = parseInt(initialCreditsText.replace(/,/g, ''));

  // Trigger auto top-up by using Points service
  // This could be done by making a purchase or using Points
  await request.post('http://localhost:3001/api/v1/points/use', {
    headers: {
      Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`,
    },
    data: {
      amount: 1,
      reason: 'test',
    },
  });

  // Wait for auto top-up to trigger
  await page.waitForTimeout(2000);

  // Refresh to see updated balances
  await page.reload();

  // Verify auto top-up occurred
  const newPointsText = await page.locator('[data-testid="points-balance"]').textContent();
  const newPoints = parseInt(newPointsText.replace(/,/g, ''));
  const newCreditsText = await page.locator('[data-testid="credits-balance"]').textContent();
  const newCredits = parseInt(newCreditsText.replace(/,/g, ''));

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
```

**Deliverable:**

- ✅ `tests/e2e/points-system.spec.ts` with all test cases
- ✅ All points system tests passing
- ✅ Verified daily rewards, exchange, and auto top-up

---

## Day 4: Integration & Cleanup

### Tasks

1. **Run All E2E Tests**

   ```bash
   npm run test:e2e
   ```

2. **Fix Failing Tests**
   - Debug and fix any failing tests
   - Ensure all tests pass consistently

3. **Improve Test Coverage**
   - Add missing test cases
   - Cover edge cases
   - Target: ≥ 80% coverage

4. **Add Test Documentation**
   - Create `tests/e2e/README.md`
   - Document test setup
   - Document how to run tests
   - Document test data requirements

**Deliverable:**

- ✅ All E2E tests passing
- ✅ Test coverage ≥ 80%
- ✅ Test documentation complete

---

# Week 5: Security Audit & Final Validation (Local Development)

## Day 1: Security Audit

### Task 1: Visibility Middleware Verification

**Objective:** Verify that visibility middleware is correctly implemented and applied to all relevant APIs.

#### Verification Steps

1. **Code Review: visibilityCheckRaw.ts**

```bash
# Check if file exists
ls packages/core-service/src/middleware/visibilityCheckRaw.ts

# Review implementation
cat packages/core-service/src/middleware/visibilityCheckRaw.ts
```

**Checklist:**

- ✅ Middleware exists
- ✅ Implements all tier visibility rules
- ✅ Returns filtered results
- ✅ Handles errors properly
- ✅ Logs access attempts

---

2. **Verify Middleware Applied to APIs**

```bash
# Check which routes use visibility middleware
grep -r "visibilityCheck" packages/core-service/src/routes/
```

**APIs that MUST have visibility middleware:**

- ✅ `GET /api/v1/hierarchy/members`
- ✅ `GET /api/v1/users/search`
- ✅ `GET /api/v1/hierarchy/tree`
- ✅ `POST /api/v1/transfer` (check recipient visibility)
- ✅ `POST /api/v1/block` (check target visibility)

---

3. **Test All Tier Combinations**

Create test file: `tests/security/visibility-verification.spec.ts`

```typescript
test.describe('Visibility Middleware Verification', () => {
  test('Administrator can see all users', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();

    // Should see all tiers
    expect(data.members.some((m) => m.tier === 'agency')).toBe(true);
    expect(data.members.some((m) => m.tier === 'organization')).toBe(true);
    expect(data.members.some((m) => m.tier === 'admin')).toBe(true);
    expect(data.members.some((m) => m.tier === 'general')).toBe(true);
  });

  test('Agency cannot see other Agencies', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${agencyAToken}`,
      },
    });

    const data = await response.json();

    // Should NOT see other agencies
    const otherAgencies = data.members.filter(
      (m) => m.tier === 'agency' && m.id !== currentAgencyId
    );
    expect(otherAgencies.length).toBe(0);
  });

  test('Organization cannot see other Organizations', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${orgA1Token}`,
      },
    });

    const data = await response.json();

    // Should NOT see other organizations
    const otherOrgs = data.members.filter(
      (m) => m.tier === 'organization' && m.id !== currentOrgId
    );
    expect(otherOrgs.length).toBe(0);
  });

  test('Admin cannot see users outside org', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${adminA1Token}`,
      },
    });

    const data = await response.json();

    // Should only see Generals in same org
    const allMembers = data.members;
    expect(allMembers.every((m) => m.tier === 'general' && m.organizationId === currentOrgId)).toBe(
      true
    );
  });

  test('General can only see themselves', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/v1/hierarchy/members', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
    });

    const data = await response.json();

    // Should only see themselves
    expect(data.members.length).toBe(1);
    expect(data.members[0].id).toBe(currentUserId);
  });
});
```

**Deliverable:**

- ✅ Visibility middleware verified
- ✅ All tier combinations tested
- ✅ Edge cases covered

---

### Task 2: Authorization Checks Verification

**Objective:** Verify that authorization checks are properly implemented for all sensitive operations.

#### Test Cases

Create test file: `tests/security/authorization-verification.spec.ts`

```typescript
test.describe('Authorization Verification', () => {
  test('cannot transfer to invisible user', async ({ request }) => {
    // Try to transfer from Org A1 to Org A2 (different orgs, not visible)
    const response = await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        Authorization: `Bearer ${orgA1Token}`,
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

  test('cannot block user without permission', async ({ request }) => {
    // Try to block as General user (no permission)
    const response = await request.post('http://localhost:3001/api/v1/block', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        userId: someOtherUserId,
      },
    });

    expect(response.status()).toBe(403);
  });

  test('cannot access Agency API without proper tier', async ({ request }) => {
    // Try to access agency settings as Organization
    const response = await request.get('http://localhost:3001/api/v1/agency/referral-config', {
      headers: {
        Authorization: `Bearer ${orgToken}`,
      },
    });

    expect(response.status()).toBe(403);
  });

  test('audit log captures unauthorized attempts', async ({ request }) => {
    // Make unauthorized request
    await request.post('http://localhost:3001/api/v1/transfer', {
      headers: {
        Authorization: `Bearer ${generalToken}`,
      },
      data: {
        recipientId: someUserId,
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

    const logs = await logResponse.json();
    const unauthorizedAttempt = logs.find(
      (log) => log.action === 'TRANSFER_UNAUTHORIZED' && log.userId === generalUserId
    );

    expect(unauthorizedAttempt).toBeDefined();
  });
});
```

**Deliverable:**

- ✅ Authorization checks verified
- ✅ Unauthorized access blocked
- ✅ Audit logging working

---

### Task 3: Rate Limiting & Security Headers

**Objective:** Verify rate limiting and security headers are properly configured.

#### Verification Steps

1. **Test Rate Limiting**

```typescript
test('rate limiting works', async ({ request }) => {
  const endpoint = 'http://localhost:3001/api/v1/points/balance';
  const headers = { Authorization: `Bearer ${userToken}` };

  // Make 100 requests quickly
  const requests = Array(100)
    .fill(null)
    .map(() => request.get(endpoint, { headers }));

  const responses = await Promise.all(requests);

  // Some should be rate limited (429)
  const rateLimited = responses.filter((r) => r.status() === 429);
  expect(rateLimited.length).toBeGreaterThan(0);
});
```

---

2. **Check Security Headers**

```typescript
test('security headers present', async ({ request }) => {
  const response = await request.get('http://localhost:3001/api/v1/health');

  const headers = response.headers();

  // Check security headers
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-xss-protection']).toBe('1; mode=block');
  expect(headers['strict-transport-security']).toBeDefined();
});
```

---

3. **Verify CORS Configuration**

```typescript
test('CORS configured correctly', async ({ request }) => {
  const response = await request.options('http://localhost:3001/api/v1/health', {
    headers: {
      Origin: 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET',
    },
  });

  const headers = response.headers();
  expect(headers['access-control-allow-origin']).toBe('http://localhost:3000');
  expect(headers['access-control-allow-credentials']).toBe('true');
});
```

**Deliverable:**

- ✅ Rate limiting verified
- ✅ Security headers present
- ✅ CORS configured correctly

---

## Day 2: Final Validation

### Task 1: Run Spec Kit Validation

**Objective:** Run comprehensive validation to check compliance with specifications.

#### Steps

1. **Run Validation Script**

```bash
# Use the validation prompt created earlier
kilocode implement "$(cat kilocode_spec_validation_prompt.txt)"
```

2. **Review Validation Report**

Expected output:

```
Spec Kit Validation Report
==========================

Overall Compliance: 92%

Specification Documents:
✅ Points System Spec: 95%
✅ Hierarchy & Referral Spec: 90%
✅ Visibility Rules Addendum: 88%
✅ Auto Top-up Feature: 94%

Implementation Status:
✅ Backend: 100%
✅ Frontend: 95%
✅ Tests: 85%

Critical Issues: 0
High Priority Issues: 2
Medium Priority Issues: 5
Low Priority Issues: 8
```

3. **Fix Remaining Issues**

Address any issues found in validation report.

**Target:**

- ✅ Overall Compliance ≥ 90%
- ✅ No Critical Issues
- ✅ All components validated

---

### Task 2: Performance Testing (Local)

**Objective:** Verify system performance under load in local environment.

#### Test Scenarios

1. **Load Testing**

Create test file: `tests/performance/load-test.js` (using k6)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
  },
};

export default function () {
  const token = 'your-test-token';

  // Test Points balance endpoint
  const balanceRes = http.get('http://localhost:3001/api/v1/points/balance', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(balanceRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

Run test:

```bash
k6 run tests/performance/load-test.js
```

---

2. **Database Query Optimization**

```bash
# Check slow queries in development
# Enable query logging in Prisma
```

Review and optimize slow queries.

---

3. **Frontend Performance**

```bash
# Build production bundle
npm run build

# Analyze bundle size
npm run analyze

# Run Lighthouse
lighthouse http://localhost:3000 --view
```

**Targets:**

- ✅ API response time < 200ms (p95)
- ✅ Frontend loading time < 2s
- ✅ Lighthouse score > 90

**Deliverable:**

- ✅ Performance tests completed
- ✅ Performance targets met
- ✅ Optimizations documented

---

### Task 3: Documentation Review

**Objective:** Ensure all documentation is complete and up-to-date.

#### Documents to Review

1. **Specification Documents**
   - ✅ Points System Spec
   - ✅ Hierarchy & Referral Spec
   - ✅ Visibility Rules Addendum
   - ✅ Auto Top-up Feature Spec

2. **API Documentation**
   - ✅ All endpoints documented
   - ✅ Request/response examples
   - ✅ Error codes documented
   - ✅ Authentication documented

3. **User Guide**

Create: `docs/USER_GUIDE.md`

**Contents:**

- Getting started
- How to use Points System
- How to transfer Points/Credits
- How to use Referral System
- How to manage members (for Agency/Org/Admin)
- FAQ

4. **Developer Guide**

Create: `docs/DEVELOPER_GUIDE.md`

**Contents:**

- Project structure
- Setup instructions
- Running tests
- Code conventions
- API architecture
- Security considerations

**Deliverable:**

- ✅ All documentation reviewed
- ✅ User Guide created
- ✅ Developer Guide created

---

## Success Criteria

### Week 4 (E2E Tests)

- ✅ 6 E2E test files created
- ✅ All test cases passing
- ✅ Test coverage ≥ 80%
- ✅ Test documentation complete

### Week 5 (Security & Validation)

- ✅ Security audit passed
- ✅ Visibility rules verified
- ✅ Authorization checks verified
- ✅ Spec Kit Compliance ≥ 90%
- ✅ Performance tests passed (local)
- ✅ Documentation complete

### Overall

- ✅ No critical security issues
- ✅ All tests passing
- ✅ System ready for production deployment
- ✅ Documentation complete

---

## Deliverables Summary

### Test Files (6)

1. ✅ `tests/e2e/access-control.spec.ts`
2. ✅ `tests/e2e/visibility.spec.ts`
3. ✅ `tests/e2e/transfer-flow.spec.ts`
4. ✅ `tests/e2e/block-flow.spec.ts`
5. ✅ `tests/e2e/referral-flow.spec.ts`
6. ✅ `tests/e2e/points-system.spec.ts`

### Security Tests (3)

1. ✅ `tests/security/visibility-verification.spec.ts`
2. ✅ `tests/security/authorization-verification.spec.ts`
3. ✅ `tests/security/security-headers.spec.ts`

### Performance Tests (1)

1. ✅ `tests/performance/load-test.js`

### Documentation (4)

1. ✅ `tests/e2e/README.md`
2. ✅ `docs/USER_GUIDE.md`
3. ✅ `docs/DEVELOPER_GUIDE.md`
4. ✅ `docs/SECURITY.md`

---

## Instructions for Kilo Code

1. **Setup Testing Environment**
   - Install Playwright or Cypress
   - Configure test database
   - Create test users for each tier

2. **Create E2E Tests**
   - Follow test cases specified
   - Use data-testid attributes in frontend
   - Ensure tests are independent

3. **Create Security Tests**
   - Test all visibility rules
   - Test authorization checks
   - Verify security headers

4. **Run Performance Tests**
   - Use k6 or Artillery
   - Test under load (local)
   - Optimize slow queries

5. **Create Documentation**
   - User-friendly guides
   - Developer documentation
   - Security documentation

6. **Run Validation**
   - Use Spec Kit validation prompt
   - Fix all critical issues
   - Achieve ≥ 90% compliance

---

## Notes

- This task covers LOCAL DEVELOPMENT ONLY
- Does NOT include production deployment
- Does NOT include environment setup (staging/production)
- Does NOT include monitoring setup (Grafana, Prometheus)
- Does NOT include actual database migration to production

---

## Expected Timeline

- **Week 4 (E2E Tests):** 4 days
  - Day 1: Access Control & Visibility Tests (6-8 hours)
  - Day 2: Transfer & Block Flow Tests (6-8 hours)
  - Day 3: Referral & Points Flow Tests (6-8 hours)
  - Day 4: Integration & Cleanup (4-6 hours)

- **Week 5 (Security & Validation):** 3 days
  - Day 1: Security Audit (6-8 hours)
  - Day 2: Final Validation (6-8 hours)
  - Day 3: Documentation (4-6 hours)

**Total:** ~40-54 hours of work

---

## Output

Please create all test files, security tests, performance tests, and documentation as specified. Ensure all tests pass and compliance score ≥ 90%. Confirm when complete and ready for production deployment planning.
