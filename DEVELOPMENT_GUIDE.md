# Smart AI Hub Development Guide

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Debugging](#debugging)
- [Code Quality](#code-quality)
- [Database Management](#database-management)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## Overview

This guide provides comprehensive instructions for setting up a development environment and contributing to the Smart AI Hub project. It covers everything from initial setup to advanced development workflows.

## Prerequisites

### Required Software

- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) (v9.x or later) or [yarn](https://yarnpkg.com/) (v1.22.x or later)
- [Docker](https://www.docker.com/) (v20.x or later)
- [Docker Compose](https://docs.docker.com/compose/) (v2.x or later)
- [Git](https://git-scm.com/) (v2.30 or later)

### Recommended Tools

- [Visual Studio Code](https://code.visualstudio.com/) with recommended extensions
- [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) for API testing
- [Redis Desktop Manager](https://redisdesktop.com/) for Redis management
- [DBeaver](https://dbeaver.io/) or [TablePlus](https://tableplus.com/) for database management

### Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

## Development Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Smart-AI-Hub.git
cd Smart-AI-Hub
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install dependencies for all packages
npm run install:all
```

### 3. Environment Configuration

Configure your environment variables:

```bash
# Edit the .env file
nano .env
```

Key environment variables to configure:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/smartaihub_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# API Keys
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
```

### 4. Database Setup

#### Using Docker (Recommended)

```bash
# Start database services
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

#### Manual Setup

If you prefer to install PostgreSQL and Redis manually:

1. Install PostgreSQL and Redis on your system
2. Create a database named `smartaihub_dev`
3. Run migrations and seeds as shown above

### 5. Start Development Services

```bash
# Start all services in development mode
npm run dev

# Or start individual services
npm run dev:api-gateway
npm run dev:auth-service
npm run dev:core-service
npm run dev:mcp-server
npm run dev:frontend
```

## Project Structure

```
Smart-AI-Hub/
├── packages/                    # Monorepo packages
│   ├── api-gateway/            # API Gateway service
│   ├── auth-service/           # Authentication service
│   ├── core-service/           # Core business logic
│   ├── mcp-server/             # MCP (Model Context Protocol) server
│   ├── frontend/               # Frontend application
│   ├── notification-service/   # Notification service
│   └── shared/                 # Shared utilities and types
├── docs/                       # Documentation
├── scripts/                    # Build and deployment scripts
├── specs/                      # Project specifications
├── .github/                    # GitHub workflows and templates
├── docker-compose.yml          # Docker configuration
├── package.json                # Root package.json
└── README.md                   # Project README
```

### Package Structure

Each service package follows a consistent structure:

```
packages/service-name/
├── src/
│   ├── controllers/            # Route controllers
│   ├── middleware/             # Custom middleware
│   ├── models/                 # Data models
│   ├── routes/                 # Route definitions
│   ├── services/               # Business logic
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── index.ts                # Service entry point
├── tests/                      # Test files
├── package.json                # Package configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Package-specific README
```

## Development Workflow

### 1. Create a Feature Branch

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Or create a bugfix branch
git checkout -b fix/issue-description
```

### 2. Make Changes

- Follow the coding standards defined in [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md)
- Write tests for new functionality
- Update documentation as needed

### 3. Run Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests for a specific package
npm run test:auth-service
```

### 4. Code Quality Checks

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run all quality checks
npm run quality
```

### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add user profile management"

# Push to your fork
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Create a pull request against the `main` branch
2. Fill out the PR template completely
3. Wait for code review and CI checks to pass
4. Address feedback if needed
5. Merge when approved

## Running the Application

### Development Mode

```bash
# Start all services in development mode with hot reload
npm run dev

# Start with verbose logging
DEBUG=* npm run dev

# Start specific services
npm run dev:api-gateway
npm run dev:auth-service
npm run dev:core-service
npm run dev:mcp-server
npm run dev:frontend
```

### Production Mode

```bash
# Build all packages
npm run build

# Start in production mode
npm start

# Or using Docker
docker-compose up -d
```

### Service URLs in Development

| Service              | URL                   |
| -------------------- | --------------------- |
| Frontend             | http://localhost:3000 |
| API Gateway          | http://localhost:3001 |
| Auth Service         | http://localhost:3002 |
| Core Service         | http://localhost:3003 |
| MCP Server           | http://localhost:3004 |
| Notification Service | http://localhost:3005 |

## Testing

### Test Structure

```
packages/service-name/
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── e2e/                   # End-to-end tests
│   └── fixtures/              # Test fixtures and data
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests for a specific package
npm run test:auth-service

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

### Writing Tests

#### Unit Tests

```typescript
// tests/unit/services/user.service.test.ts
import { UserService } from '../../../src/services/user.service';
import { User } from '../../../src/models/user';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = await userService.createUser(userData);

      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(userData.email);
    });
  });
});
```

#### Integration Tests

```typescript
// tests/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Authentication', () => {
  describe('POST /api/auth/login', () => {
    it('should authenticate with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });
  });
});
```

### Test Database

For testing, we use a separate database:

```bash
# Set up test database
npm run db:test:setup

# Reset test database
npm run db:test:reset

# Run tests against test database
NODE_ENV=test npm run test
```

## Debugging

### VS Code Debugging Configuration

Create a `.vscode/launch.json` file:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Auth Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/auth-service/src/index.ts",
      "outFiles": ["${workspaceFolder}/packages/auth-service/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    },
    {
      "name": "Debug Core Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/core-service/src/index.ts",
      "outFiles": ["${workspaceFolder}/packages/core-service/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

### Debugging Tips

1. Use `console.log` for quick debugging
2. Use the VS Code debugger for complex issues
3. Check the logs in the console
4. Use the Chrome DevTools for frontend debugging
5. Use network tab to inspect API requests

## Code Quality

### Linting

We use ESLint for code linting:

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run linter for a specific package
npm run lint:auth-service
```

### Type Checking

We use TypeScript for static type checking:

```bash
# Run type checking
npm run type-check

# Run type checking for a specific package
npm run type-check:auth-service
```

### Formatting

We use Prettier for code formatting:

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### Pre-commit Hooks

We use Husky for Git hooks:

```bash
# Install Git hooks
npm run prepare

# Run pre-commit checks manually
npm run pre-commit
```

## Database Management

### Migrations

```bash
# Create a new migration
npm run db:migration:create -- --name add_user_table

# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:migrate:rollback

# Check migration status
npm run db:migrate:status
```

### Seeding

```bash
# Run all seeds
npm run db:seed

# Run a specific seed
npm run db:seed -- --class=001_default_roles

# Reset and reseed
npm run db:reset
```

### Database Client

```bash
# Open database client
npm run db:client

# View database schema
npm run db:schema

# Generate Prisma client
npm run db:generate
```

## API Development

### Creating a New API Endpoint

1. Define the route in the appropriate routes file:

```typescript
// packages/auth-service/src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register.bind(authController));

export default router;
```

2. Implement the controller method:

```typescript
// packages/auth-service/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      const user = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
      });

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message,
        },
      });
    }
  }
}
```

3. Implement the service method:

```typescript
// packages/auth-service/src/services/auth.service.ts
import { User } from '../models/user';
import { hashPassword } from '../utils/password';

export class AuthService {
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);

    return User.create({
      ...userData,
      password: hashedPassword,
    });
  }
}
```

### API Documentation

We use OpenAPI/Swagger for API documentation:

```bash
# Generate API documentation
npm run docs:api

# Serve API documentation
npm run docs:serve
```

## Frontend Development

### Component Structure

```
packages/frontend/src/
├── components/               # Reusable components
│   ├── common/              # Common components
│   ├── forms/               # Form components
│   └── layout/              # Layout components
├── pages/                   # Page components
├── services/                # API services
├── hooks/                   # Custom React hooks
├── utils/                   # Utility functions
├── types/                   # TypeScript types
└── styles/                  # CSS/styling files
```

### Creating a New Component

```typescript
// packages/frontend/src/components/common/Button.tsx
import React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  return (
    <button
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### State Management

We use React Context for state management:

```typescript
// packages/frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import { User } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Common Development Tasks

### Adding a New Environment Variable

1. Add the variable to `.env.example`
2. Add the variable to your local `.env` file
3. Update the type definitions in the appropriate package
4. Use the variable in your code

### Adding a New Service

1. Create a new directory in `packages/`
2. Initialize the package with `npm init`
3. Set up the basic structure
4. Add the service to the root `package.json` workspaces
5. Update the Docker configuration

### Adding a New Database Table

1. Create a new migration:
   ```bash
   npm run db:migration:create -- --name new_table
   ```
2. Define the table schema in the migration
3. Run the migration:
   ```bash
   npm run db:migrate
   ```
4. Update the Prisma schema if needed
5. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```

### Adding a New API Endpoint

1. Define the route in the appropriate routes file
2. Implement the controller method
3. Implement the service method
4. Add tests
5. Update the API documentation

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run db:migrate
npm run db:seed
```

#### Redis Connection Issues

```bash
# Check if Redis is running
docker-compose ps

# Check Redis logs
docker-compose logs redis

# Connect to Redis CLI
docker-compose exec redis redis-cli
```

#### Port Conflicts

```bash
# Check which ports are in use
netstat -tulpn | grep :3000

# Kill process using a port
sudo kill -9 <PID>
```

#### Node Modules Issues

```bash
# Clean all node_modules
npm run clean

# Reinstall dependencies
npm install
npm run install:all
```

### Getting Help

1. Check the [documentation](https://docs.smartaihub.com)
2. Search [existing issues](https://github.com/your-username/Smart-AI-Hub/issues)
3. Create a new issue with detailed information
4. Join our [Discord community](https://discord.gg/smartaihub)

## Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Security Guidelines](./SECURITY_GUIDELINES.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Code Style Guide](./CODE_STYLE_GUIDE.md)
- [Contributing Guide](./CONTRIBUTING.md)

---

For additional help or questions, please contact the development team or create an issue on GitHub.
