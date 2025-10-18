# E2E Test Documentation

## Overview

This directory contains end-to-end (E2E) tests for the Smart AI Hub Points System and Multi-tier Hierarchy. The tests are built using Playwright and cover all critical user flows, security aspects, and performance requirements.

## Test Structure

```
tests/
├── e2e/
│   ├── access-control.spec.ts      # Tests for route guards and access control
│   ├── visibility.spec.ts           # Tests for visibility rules enforcement
│   ├── transfer-flow.spec.ts        # Tests for transfer functionality
│   ├── block-flow.spec.ts           # Tests for block/unblock functionality
│   ├── referral-flow.spec.ts        # Tests for referral system
│   ├── points-system.spec.ts        # Tests for Points System features
│   └── README.md                    # This documentation file
├── security/
│   ├── visibility-verification.spec.ts    # Security tests for visibility middleware
│   ├── authorization-verification.spec.ts # Security tests for authorization checks
│   └── security-headers.spec.ts           # Security tests for HTTP headers
└── performance/
    └── load-test.js               # Performance and load testing
```

## Test Categories

### 1. Access Control Tests (`access-control.spec.ts`)

Tests the route guards and access control mechanisms for all user tiers:

- **Administrator**: Can access all routes and perform all operations
- **Agency**: Can access agency routes and manage organizations
- **Organization**: Can access organization routes and manage admins
- **Admin**: Can access admin routes and manage general users
- **General**: Can only access general routes

#### Key Test Cases:

- Route protection for each user tier
- Navigation menu visibility based on user tier
- API endpoint access control
- Redirect behavior for unauthorized access

### 2. Visibility Tests (`visibility.spec.ts`)

Tests the visibility rules that govern what users can see based on their tier:

- **Administrator**: Can see all users in the system
- **Agency**: Can see organizations and users within their agency
- **Organization**: Can see admins and general users within their organization
- **Admin**: Can see general users within their organization
- **General**: Can only see themselves

#### Key Test Cases:

- User list visibility based on hierarchy
- Transfer recipient visibility
- Search functionality respects visibility rules
- Referral code visibility

### 3. Transfer Flow Tests (`transfer-flow.spec.ts`)

Tests the transfer functionality for both points and credits:

- Points transfer between visible users
- Credits transfer between authorized tiers
- Balance updates after transfers
- Transfer history recording
- Transfer limit enforcement

#### Key Test Cases:

- Successful transfers
- Transfer to invisible users (should fail)
- Transfer with insufficient balance (should fail)
- Transfer to blocked users (should fail)
- Transfer between different tiers

### 4. Block Flow Tests (`block-flow.spec.ts`)

Tests the block/unblock functionality:

- Users with appropriate permissions can block lower-tier users
- Blocked users cannot receive transfers
- Blocked users are hidden from user lists
- Unblock functionality works correctly

#### Key Test Cases:

- Successful blocking
- Blocking higher-tier users (should fail)
- Blocking without permission (should fail)
- Unblock functionality
- Transfer attempts to blocked users

### 5. Referral Flow Tests (`referral-flow.spec.ts`)

Tests the referral system with invite codes:

- Users can generate referral codes
- New users can sign up with referral codes
- Rewards are distributed correctly
- Referral tracking works properly

#### Key Test Cases:

- Referral code generation
- Signup with referral code
- Reward distribution
- Referral history tracking

### 6. Points System Tests (`points-system.spec.ts`)

Tests the Points System features:

- Daily reward collection
- Points to credits exchange
- Points purchase
- Auto top-up functionality

#### Key Test Cases:

- Daily reward collection
- Exchange rate application
- Purchase process
- Auto top-up threshold
- Balance updates

## Security Tests

### 1. Visibility Verification (`visibility-verification.spec.ts`)

Security-focused tests for the visibility middleware:

- Verifies visibility rules are enforced at the API level
- Tests for potential visibility bypasses
- Ensures sensitive data is not exposed

### 2. Authorization Verification (`authorization-verification.spec.ts`)

Security-focused tests for authorization checks:

- Verifies users cannot perform actions beyond their permissions
- Tests for potential authorization bypasses
- Ensures audit logs capture unauthorized attempts

### 3. Security Headers (`security-headers.spec.ts`)

Tests for proper security headers implementation:

- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy
- Referrer-Policy
- Permissions-Policy

## Performance Tests

### Load Testing (`load-test.js`)

Performance testing under load:

- Simulates multiple concurrent users
- Tests response times under load
- Measures system throughput
- Identifies performance bottlenecks

#### Key Metrics:

- Requests per second
- Response time percentiles
- Error rates
- Success rates

## Running Tests

### Prerequisites

1. Ensure the application is running on `http://localhost:3000` (frontend) and `http://localhost:3001` (backend)
2. Install dependencies: `npm install`
3. Ensure test data is seeded in the database

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/access-control.spec.ts

# Run tests with UI mode (helpful for debugging)
npx playwright test --ui

# Run tests in headed mode (shows browser)
npx playwright test --headed
```

### Running Security Tests

```bash
# Run all security tests
npx playwright test tests/security/

# Run specific security test
npx playwright test tests/security/visibility-verification.spec.ts
```

### Running Performance Tests

```bash
# Run load test
node tests/performance/load-test.js
```

## Test Data

The tests expect a specific hierarchy of test users to be present in the database:

### User Hierarchy

```
Administrator (administrator@example.com)
└── Agency (agency@example.com)
    └── Organization A1 (org-a1@example.com)
        ├── Admin A1 (admin-a1@example.com)
        └── General (general@example.com)
    └── Organization A2 (org-a2@example.com)
        └── Admin A2 (admin-a2@example.com)
```

### Initial Balances

- All users start with 10,000 points
- Agency and Organization users start with 5,000 credits
- Admin and General users start with 1,000 credits

## Test Configuration

### Playwright Configuration

The Playwright configuration is defined in `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Performance Test Configuration

The load test configuration can be modified in `tests/performance/load-test.js`:

```javascript
const config = {
  baseUrl: 'http://localhost:3001',
  concurrentUsers: 50,
  duration: 30, // seconds
  rampUpTime: 10, // seconds
  endpoints: [
    // ... endpoint definitions
  ],
};
```

## Troubleshooting

### Common Issues

1. **Tests fail with connection refused**
   - Ensure the application is running on the correct ports
   - Check if the backend and frontend services are started

2. **Authentication failures**
   - Verify test data is properly seeded
   - Check if users exist with the expected email/password combinations

3. **Timeout errors**
   - Increase timeout values in the test configuration
   - Check for performance issues in the application

4. **Flaky tests**
   - Add proper waiting mechanisms for dynamic content
   - Ensure tests don't depend on exact timing

### Debugging Tips

1. Use the Playwright UI mode for interactive debugging:

   ```bash
   npx playwright test --ui
   ```

2. Run tests in headed mode to see the browser:

   ```bash
   npx playwright test --headed
   ```

3. Use the Playwright Inspector for step-by-step debugging:

   ```bash
   PWDEBUG=1 npx playwright test
   ```

4. Take screenshots on failure:
   ```typescript
   await page.screenshot({ path: 'failure.png' });
   ```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Data Cleanup**: Clean up any data created during tests
3. **Explicit Waits**: Use explicit waits instead of fixed timeouts
4. **Page Objects**: Use page object pattern for better maintainability
5. **Descriptive Tests**: Write clear, descriptive test names and comments
6. **Error Handling**: Handle errors gracefully and provide meaningful messages

## Continuous Integration

The tests are configured to run in CI environments with:

- Parallel execution for faster feedback
- Automatic retries for flaky tests
- HTML reporter for detailed test results
- Artifact collection for test reports

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Add appropriate test cases for both positive and negative scenarios
3. Update this documentation if adding new test categories
4. Ensure tests are reliable and not flaky
5. Add proper error handling and assertions

## References

- [Playwright Documentation](https://playwright.dev/)
- [Smart AI Hub Architecture](../../../specs/02_architecture/)
- [Points System Requirements](../../../specs/01_requirements/functional/)
