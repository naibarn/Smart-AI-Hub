# Smart AI Hub Testing Strategy

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Testing Pyramid](#testing-pyramid)
- [Test Types](#test-types)
- [Testing Tools and Frameworks](#testing-tools-and-frameworks)
- [Test Environment Setup](#test-environment-setup)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [API Testing](#api-testing)
- [Frontend Testing](#frontend-testing)
- [Database Testing](#database-testing)
- [Test Data Management](#test-data-management)
- [Continuous Testing](#continuous-testing)
- [Test Reporting and Metrics](#test-reporting-and-metrics)
- [Best Practices](#best-practices)

## Overview

This document outlines the comprehensive testing strategy for the Smart AI Hub platform. It defines the testing approach, methodologies, tools, and best practices to ensure the quality, reliability, and security of our software.

### Testing Goals

1. **Quality Assurance**: Ensure software meets requirements and expectations
2. **Defect Prevention**: Identify and fix issues early in development
3. **Risk Mitigation**: Reduce the risk of production failures
4. **Performance Validation**: Ensure system performs under load
5. **Security Verification**: Identify and address security vulnerabilities
6. **Regression Prevention**: Ensure new changes don't break existing functionality

## Testing Philosophy

### Shift-Left Testing

We believe in testing early and often in the development lifecycle:

- **Test-Driven Development (TDD)**: Write tests before writing code
- **Behavior-Driven Development (BDD)**: Define behavior through examples
- **Continuous Testing**: Integrate testing throughout the CI/CD pipeline
- **Developer Ownership**: Developers are responsible for testing their code

### Quality Gates

Implement quality gates at each stage of development:

1. **Pre-commit**: Local tests and linting
2. **Pre-merge**: Automated test suite in CI
3. **Pre-release**: Comprehensive testing in staging
4. **Production**: Monitoring and health checks

## Testing Pyramid

```
        /\
       /  \
      / E2E \     <- Few, slow, expensive tests
     /______\
    /        \
   /Integration\ <- Moderate number, medium speed
  /____________\
 /              \
/   Unit Tests   \ <- Many, fast, cheap tests
/________________\
```

### Unit Tests (70%)
- Fast, isolated tests for individual functions and components
- Mock external dependencies
- Run on every commit
- Provide immediate feedback

### Integration Tests (20%)
- Test interactions between components
- Use real databases and services
- Verify data flow and communication
- Run in CI/CD pipeline

### End-to-End Tests (10%)
- Test complete user workflows
- Use real browsers and environments
- Simulate real user behavior
- Run before releases

## Test Types

### Functional Testing

Verify that the application functions according to requirements:

- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test component interactions
- **API Tests**: Test API endpoints and contracts
- **UI Tests**: Test user interface interactions
- **E2E Tests**: Test complete user journeys

### Non-Functional Testing

Verify quality attributes of the system:

- **Performance Testing**: Load, stress, and scalability testing
- **Security Testing**: Vulnerability scanning and penetration testing
- **Usability Testing**: User experience and accessibility
- **Compatibility Testing**: Cross-browser and cross-platform testing
- **Reliability Testing**: Failover and recovery testing

## Testing Tools and Frameworks

### Backend Testing

| Tool | Purpose | Version |
|------|---------|---------|
| Jest | Unit testing framework | 29.x |
| Supertest | HTTP assertions | 6.x |
| Prisma Test Client | Database testing | 5.x |
| Sinon | Spies and mocks | 15.x |
| Faker | Test data generation | 6.x |
| Artillery | Performance testing | 2.x |

### Frontend Testing

| Tool | Purpose | Version |
|------|---------|---------|
| Jest | Unit testing framework | 29.x |
| React Testing Library | Component testing | 13.x |
| Cypress | E2E testing | 12.x |
| Playwright | E2E testing | 1.x |
| Storybook | Component testing | 7.x |
| Lighthouse | Performance testing | 10.x |

### Security Testing

| Tool | Purpose | Version |
|------|---------|---------|
| OWASP ZAP | Security scanning | 2.x |
| Snyk | Vulnerability scanning | 1.x |
| Semgrep | Static analysis | 1.x |
| Burp Suite | Penetration testing | 2023.x |

## Test Environment Setup

### Test Database Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Database Setup

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Set test database URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  
  // Reset database
  execSync('npx prisma migrate reset --force --skip-seed', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
  });
  
  // Run migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
  });
  
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up database before each test
  await prisma.user.deleteMany();
  await prisma.creditAccount.deleteMany();
  await prisma.usageLog.deleteMany();
});
```

## Unit Testing

### Example: Service Unit Test

```typescript
// tests/unit/services/user.service.test.ts
import { UserService } from '../../../src/services/user.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { CreditService } from '../../../src/services/credit.service';
import { User } from '../../../src/models/user';

// Mock dependencies
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/services/credit.service');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockCreditService: jest.Mocked<CreditService>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockCreditService = new CreditService() as jest.Mocked<CreditService>;
    userService = new UserService(mockUserRepository, mockCreditService);
  });

  describe('createUser', () => {
    it('should create a new user with initial credits', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const expectedUser = {
        id: 'user-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
        createdAt: new Date()
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(expectedUser);
      mockCreditService.createAccount.mockResolvedValue({} as any);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        password: expect.any(String), // Hashed password
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user'
      });
      expect(mockCreditService.createAccount).toHaveBeenCalledWith(expectedUser.id);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const existingUser = { id: 'user-456', email: userData.email };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser as User);

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow('Email already exists');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });
});
```

### Example: Controller Unit Test

```typescript
// tests/unit/controllers/auth.controller.test.ts
import request from 'supertest';
import { AuthController } from '../../../src/controllers/auth.controller';
import { AuthService } from '../../../src/services/auth.service';
import { app } from '../../../src/app';

describe('AuthController', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let authController: AuthController;

  beforeEach(() => {
    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn()
    } as any;

    authController = new AuthController(mockAuthService);
  });

  describe('POST /api/auth/login', () => {
    it('should return tokens on successful login', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const expectedResponse = {
        user: {
          id: 'user-123',
          email: loginData.email,
          firstName: 'John',
          lastName: 'Doe'
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600
        }
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expectedResponse
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid credentials'
        }
      });
    });
  });
});
```

## Integration Testing

### Example: API Integration Test

```typescript
// tests/integration/auth.integration.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication Integration Tests', () => {
  describe('User Registration and Login Flow', () => {
    it('should register a new user and allow login', async () => {
      const userData = {
        email: 'integration@example.com',
        password: 'password123',
        firstName: 'Integration',
        lastName: 'Test'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(userData.email);

      // Login with registered user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();

      // Verify user in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create and login user to get token
      const userData = {
        email: 'protected@example.com',
        password: 'password123',
        firstName: 'Protected',
        lastName: 'Test'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      authToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('protected@example.com');
    });

    it('should reject protected route without token', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

### Example: Database Integration Test

```typescript
// tests/integration/credit.integration.test.ts
import { CreditService } from '../../src/services/credit.service';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

describe('Credit System Integration Tests', () => {
  let creditService: CreditService;
  let userId: string;

  beforeAll(async () => {
    creditService = new CreditService();
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'credit@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Credit',
        lastName: 'Test'
      }
    });
    
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up credit data
    await prisma.creditAccount.deleteMany({ where: { userId } });
    await prisma.usageLog.deleteMany({ where: { userId } });
  });

  describe('Credit Account Management', () => {
    it('should create credit account with initial balance', async () => {
      const initialBalance = 1000;

      const account = await creditService.createAccount(userId, initialBalance);

      expect(account.userId).toBe(userId);
      expect(account.balance).toBe(initialBalance);
      expect(account.currency).toBe('credits');
    });

    it('should add credits to account', async () => {
      const initialBalance = 100;
      const addAmount = 500;

      // Create account
      await creditService.createAccount(userId, initialBalance);

      // Add credits
      const updatedAccount = await creditService.addCredits(userId, addAmount);

      expect(updatedAccount.balance).toBe(initialBalance + addAmount);
    });

    it('should deduct credits from account', async () => {
      const initialBalance = 1000;
      const deductAmount = 300;

      // Create account
      await creditService.createAccount(userId, initialBalance);

      // Deduct credits
      const updatedAccount = await creditService.deductCredits(userId, deductAmount);

      expect(updatedAccount.balance).toBe(initialBalance - deductAmount);
    });

    it('should throw error when insufficient credits', async () => {
      const initialBalance = 100;
      const deductAmount = 200;

      // Create account
      await creditService.createAccount(userId, initialBalance);

      // Try to deduct more than available
      await expect(
        creditService.deductCredits(userId, deductAmount)
      ).rejects.toThrow('Insufficient credits');
    });
  });
});
```

## End-to-End Testing

### Example: User Journey E2E Test

```typescript
// tests/e2e/user-journey.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration and AI Model Usage Journey', () => {
  test('should allow user to register, purchase credits, and use AI model', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Register new user
    await page.click('[data-testid="register-button"]');
    await page.fill('[data-testid="email-input"]', 'e2e@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123!');
    await page.fill('[data-testid="first-name-input"]', 'E2E');
    await page.fill('[data-testid="last-name-input"]', 'Test');
    await page.click('[data-testid="register-submit"]');

    // Verify successful registration
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('E2E Test');

    // Purchase credits
    await page.click('[data-testid="credits-button"]');
    await page.click('[data-testid="purchase-credits-button"]');
    await page.selectOption('[data-testid="credit-package"]', 'Starter Pack - 1000 credits');
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.click('[data-testid="purchase-submit"]');

    // Verify successful purchase
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Credits purchased successfully');
    await expect(page.locator('[data-testid="credit-balance"]')).toContainText('1000');

    // Navigate to AI model interface
    await page.click('[data-testid="ai-models-button"]');
    await page.click('[data-testid="model-gpt-4"]');

    // Interact with AI model
    await page.fill('[data-testid="prompt-input"]', 'Hello, how are you?');
    await page.click('[data-testid="send-prompt"]');

    // Verify AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-info"]')).toContainText('Tokens used:');

    // Verify credit deduction
    await page.click('[data-testid="credits-button"]');
    await expect(page.locator('[data-testid="credit-balance"]')).not.toContainText('1000');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });
});
```

## Performance Testing

### Load Testing with Artillery

```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  processor: "./tests/performance/processor.js"

scenarios:
  - name: "User Registration and Login"
    weight: 20
    flow:
      - post:
          url: "/api/auth/register"
          json:
            email: "{{ randomEmail() }}"
            password: "Password123!"
            firstName: "{{ randomFirstName() }}"
            lastName: "{{ randomLastName() }}"
          capture:
            - json: "$.data.user.id"
              as: "userId"

  - name: "AI Model Interaction"
    weight: 80
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "loadtest@example.com"
            password: "Password123!"
          capture:
            - json: "$.data.tokens.accessToken"
              as: "authToken"
      
      - get:
          url: "/api/mcp/models"
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      - post:
          url: "/api/mcp/chat/completions"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            model: "gpt-3.5-turbo"
            messages:
              - role: "user"
                content: "Hello, this is a load test message"
```

### Performance Test Processor

```javascript
// tests/performance/processor.js
const { random } = require('faker');

module.exports = {
  randomEmail() {
    return `${random.alphaNumeric(10)}@loadtest.com`;
  },
  randomFirstName() {
    return random.firstName();
  },
  randomLastName() {
    return random.lastName();
  }
};
```

## Security Testing

### Security Test Example

```typescript
// tests/security/auth.security.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Authentication Security Tests', () => {
  describe('Input Validation', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousInput = {
        email: "'; DROP TABLE users; --",
        password: "password"
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousInput);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('validation');
    });

    it('should prevent XSS in user registration', async () => {
      const maliciousInput = {
        email: 'xss@example.com',
        password: 'Password123!',
        firstName: '<script>alert("XSS")</script>',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousInput);

      expect(response.status).toBe(201);
      expect(response.body.data.user.firstName).not.toContain('<script>');
    });

    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'wrongpassword'
      };

      // Make multiple login attempts
      const attempts = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const results = await Promise.allSettled(attempts);
      const rateLimited = results.some(result => 
        result.status === 'fulfilled' && 
        result.value.status === 429
      );

      expect(rateLimited).toBe(true);
    });
  });

  describe('Authentication Security', () => {
    it('should reject requests with invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject requests with expired JWT tokens', async () => {
      // Create an expired token
      const expiredToken = createExpiredToken();

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

## API Testing

### Contract Testing with Pact

```typescript
// tests/contract/auth-service.contract.test.ts
import { Pact } from '@pact-foundation/pact';
import { API } from '../../src/api';

describe('Auth Service API Contract', () => {
  const provider = new Pact({
    consumer: 'frontend',
    provider: 'auth-service',
    port: 1234,
    log: './logs/pact.log',
    dir: './pacts',
    logLevel: 'INFO'
  });

  beforeAll(async () => {
    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('User Login', () => {
    beforeEach(async () => {
      await provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request to login with valid credentials',
        withRequest: {
          method: 'POST',
          path: '/api/auth/login',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            email: 'test@example.com',
            password: 'password123'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            data: {
              user: {
                id: Pact.like('user-123'),
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User'
              },
              tokens: {
                accessToken: Pact.like('jwt-token'),
                refreshToken: Pact.like('refresh-token'),
                expiresIn: Pact.like(3600)
              }
            }
          }
        }
      });
    });

    it('should return user data and tokens on successful login', async () => {
      const api = new API('http://localhost:1234');
      
      const response = await api.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(response.success).toBe(true);
      expect(response.data.user.email).toBe('test@example.com');
      expect(response.data.tokens.accessToken).toBeDefined();
    });
  });
});
```

## Frontend Testing

### Component Testing with React Testing Library

```typescript
// tests/frontend/components/LoginForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../../src/components/LoginForm';
import { AuthProvider } from '../../../src/contexts/AuthContext';

const MockedLoginForm = () => (
  <AuthProvider>
    <LoginForm />
  </AuthProvider>
);

describe('LoginForm Component', () => {
  it('should render login form elements', () => {
    render(<MockedLoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<MockedLoginForm />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<MockedLoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockLogin = jest.fn();
    jest.mock('../../../src/services/auth.service', () => ({
      login: mockLogin
    }));

    const user = userEvent.setup();
    render(<MockedLoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
```

## Database Testing

### Database Schema Validation

```typescript
// tests/database/schema.test.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

describe('Database Schema Tests', () => {
  beforeAll(async () => {
    // Set up test database
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
    });
    
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Table Constraints', () => {
    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'unique@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      };

      // Create first user
      await prisma.user.create({ data: userData });

      // Attempt to create second user with same email
      await expect(
        prisma.user.create({ data: userData })
      ).rejects.toThrow();
    });

    it('should enforce not null constraints', async () => {
      const invalidUserData = {
        email: null,
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      };

      await expect(
        prisma.user.create({ data: invalidUserData as any })
      ).rejects.toThrow();
    });
  });

  describe('Credit Account Constraints', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'credit@example.com',
          passwordHash: 'hashedpassword',
          firstName: 'Credit',
          lastName: 'Test'
        }
      });
      userId = user.id;
    });

    it('should enforce foreign key constraint', async () => {
      const invalidCreditData = {
        userId: 'non-existent-user-id',
        balance: 1000,
        currency: 'credits'
      };

      await expect(
        prisma.creditAccount.create({ data: invalidCreditData })
      ).rejects.toThrow();
    });

    it('should enforce balance cannot be negative', async () => {
      const creditData = {
        userId,
        balance: -100,
        currency: 'credits'
      };

      await expect(
        prisma.creditAccount.create({ data: creditData })
      ).rejects.toThrow();
    });
  });
});
```

## Test Data Management

### Test Data Factory

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../src/utils/password';

const prisma = new PrismaClient();

export class UserFactory {
  static async create(overrides: Partial<any> = {}): Promise<any> {
    const userData = {
      email: faker.internet.email(),
      passwordHash: await hashPassword('Password123!'),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: 'user',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };

    return prisma.user.create({ data: userData });
  }

  static async createMany(count: number, overrides: Partial<any> = {}): Promise<any[]> {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(overrides));
    }
    return users;
  }
}

export class CreditAccountFactory {
  static async create(userId: string, overrides: Partial<any> = {}): Promise<any> {
    const creditData = {
      userId,
      balance: faker.number.int({ min: 100, max: 10000 }),
      currency: 'credits',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };

    return prisma.creditAccount.create({ data: creditData });
  }
}
```

## Continuous Testing

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: smartaihub_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/smartaihub_test
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/smartaihub_test
        REDIS_URL: redis://localhost:6379
        JWT_SECRET: test-jwt-secret
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: smartaihub_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run database migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/smartaihub_test
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/smartaihub_test
        REDIS_URL: redis://localhost:6379
        JWT_SECRET: test-jwt-secret
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm run start:test &
    
    - name: Wait for application to be ready
      run: npx wait-on http://localhost:3000
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

## Test Reporting and Metrics

### Coverage Configuration

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/index.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    },
    "coverageReporters": [
      "text",
      "lcov",
      "html",
      "json-summary"
    ]
  }
}
```

### Test Metrics Dashboard

```typescript
// tests/utils/metrics-collector.ts
import { TestResult } from '@jest/types';

export class TestMetricsCollector {
  private metrics = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    coverage: {
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0
    },
    performance: {
      averageTestDuration: 0,
      slowestTests: []
    }
  };

  collectTestResults(results: TestResult.AggregatedResult): void {
    this.metrics.totalTests = results.numTotalTests;
    this.metrics.passedTests = results.numPassedTests;
    this.metrics.failedTests = results.numFailedTests;
    this.metrics.skippedTests = results.numPendingTests;
    
    // Collect coverage data
    if (results.coverageMap) {
      this.collectCoverageMetrics(results.coverageMap);
    }
    
    // Collect performance data
    this.collectPerformanceMetrics(results.testResults);
  }

  generateReport(): TestMetricsReport {
    const passRate = (this.metrics.passedTests / this.metrics.totalTests) * 100;
    
    return {
      summary: {
        totalTests: this.metrics.totalTests,
        passRate,
        failRate: ((this.metrics.failedTests / this.metrics.totalTests) * 100).toFixed(2),
        skipRate: ((this.metrics.skippedTests / this.metrics.totalTests) * 100).toFixed(2)
      },
      coverage: this.metrics.coverage,
      performance: this.metrics.performance
    };
  }

  private collectCoverageMetrics(coverageMap: any): void {
    // Implementation for collecting coverage metrics
  }

  private collectPerformanceMetrics(testResults: TestResult.TestResult[]): void {
    // Implementation for collecting performance metrics
  }
}

interface TestMetricsReport {
  summary: {
    totalTests: number;
    passRate: number;
    failRate: string;
    skipRate: string;
  };
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  performance: {
    averageTestDuration: number;
    slowestTests: Array<{
      name: string;
      duration: number;
    }>;
  };
}
```

## Best Practices

### Test Organization

1. **Structure tests by feature**, not by file type
2. **Use descriptive test names** that explain what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** and avoid dependencies between tests
5. **Use factories and fixtures** for consistent test data

### Test Data Management

1. **Use separate test databases** for different test types
2. **Clean up test data** after each test
3. **Use factories** instead of hardcoded test data
4. **Avoid using production data** in tests
5. **Seed only necessary data** for each test

### Test Maintenance

1. **Regularly review and update tests** as the code evolves
2. **Remove flaky tests** that produce inconsistent results
3. **Keep tests simple and focused** on one thing
4. **Refactor tests** to improve readability and maintainability
5. **Document complex test scenarios** for better understanding

### Performance Considerations

1. **Run unit tests frequently** during development
2. **Use parallel execution** for faster test runs
3. **Optimize test data setup** to reduce test execution time
4. **Mock external dependencies** to avoid network calls
5. **Use test databases in memory** when possible

---

For additional testing information or questions, please contact the QA team or create an issue on GitHub.