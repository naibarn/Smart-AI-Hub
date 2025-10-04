# Smart AI Hub

Smart AI Hub

## CI/CD Status

[![CI](https://github.com/your-username/Smart-AI-Hub/workflows/CI/badge.svg)](https://github.com/your-username/Smart-AI-Hub/actions)
[![codecov](https://codecov.io/gh/your-username/Smart-AI-Hub/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/Smart-AI-Hub)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Overview

Smart AI Hub is a monorepo containing multiple microservices for AI-powered applications.

## Services

- **auth-service**: Authentication service with JWT and OAuth
- **core-service**: Core service with PostgreSQL using Prisma
- **api-gateway**: API Gateway for routing requests
- **shared**: Shared TypeScript utilities and types
- **notification-service**: Service for handling notifications
- **mcp-server**: Model Context Protocol server
- **frontend**: Frontend application

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install individually
npm install
cd packages/auth-service && npm install
cd packages/core-service && npm install
# ... and so on for other packages
```

### Development

```bash
# Start all services in development mode
npm run dev

# Start individual service
cd packages/auth-service && npm run dev
```

### Build

```bash
# Build all packages
npm run build

# Build individual package
cd packages/auth-service && npm run build
```

### Testing

```bash
# Run tests for auth-service
cd packages/auth-service && npm test

# Run tests with coverage
cd packages/auth-service && npm test -- --coverage
```

## Environment Variables

See `.env.example` files in each package for required environment variables.

## CI/CD Setup

For information on setting up GitHub Actions and repository secrets, see:
- [GitHub Secrets Setup](docs/github-secrets.md)
- [Branch Protection Rules](docs/branch-protection.md)

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
