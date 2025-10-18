# Smart AI Hub

[![CI](https://github.com/your-username/Smart-AI-Hub/workflows/CI/badge.svg)](https://github.com/your-username/Smart-AI-Hub/actions)
[![codecov](https://codecov.io/gh/your-username/Smart-AI-Hub/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/Smart-AI-Hub)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-brightgreen.svg)](CODE_OF_CONDUCT.md)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Services](#services)
- [Getting Started](#getting-started)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Overview

Smart AI Hub is a comprehensive platform for managing AI service access with authentication, authorization, and credit management. It provides a unified interface for interacting with multiple AI providers while handling billing, usage tracking, and user management.

The platform is built as a microservices architecture with modern web technologies, ensuring scalability, maintainability, and security.

### Key Benefits

- **Multi-Provider Support**: Integrate with OpenAI, Claude, and other AI providers
- **Unified Authentication**: Single sign-on with JWT and OAuth support
- **Credit Management**: Flexible billing and usage tracking
- **Advanced RBAC**: Many-to-many role and permission management with junction tables
- **Real-Time Monitoring**: Comprehensive analytics and system health monitoring
- **Developer-Friendly**: RESTful APIs and comprehensive documentation

## Features

### Core Features

- ✅ User authentication and authorization
- ✅ Credit-based billing system
- ✅ Multi-AI provider integration
- ✅ Real-time chat interface
- ✅ Admin dashboard
- ✅ Usage analytics and reporting
- ✅ Notification system
- ✅ Advanced RBAC with many-to-many relationships
- ✅ Junction tables for flexible permission management

### Technical Features

- ✅ Microservices architecture
- ✅ TypeScript throughout
- ✅ PostgreSQL with Prisma ORM
- ✅ Redis for caching and sessions
- ✅ WebSocket support for real-time features
- ✅ RESTful API design
- ✅ Docker containerization
- ✅ CI/CD pipeline with GitHub Actions

## Architecture

Smart AI Hub follows a microservices architecture pattern with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Auth Service   │
│   (React)       │◄──►│   (Express)     │◄──►│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┼────────┐
                       │        │        │
                ┌──────▼───┐ ┌──▼────┐ ┌─▼───────┐
                │Core Svc │ │MCP Svc│ │Notif Svc│
                │(Express)│ │(Node)  │ │(Node)   │
                └──────────┘ └───────┘ └─────────┘
                       │        │        │
                ┌──────▼─────────▼────────▼────┐
                │      PostgreSQL & Redis      │
                └───────────────────────────────┘
```

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Services

### Core Services

| Service                  | Description                                    | Technology              | Status    |
| ------------------------ | ---------------------------------------------- | ----------------------- | --------- |
| **auth-service**         | Authentication, authorization, user management | Express, Prisma, JWT    | ✅ Active |
| **core-service**         | Core business logic, credit management         | Express, Prisma         | ✅ Active |
| **api-gateway**          | API routing, load balancing, rate limiting     | Express, Nginx          | ✅ Active |
| **mcp-server**           | Model Context Protocol server for AI providers | Node.js, WebSocket      | ✅ Active |
| **notification-service** | Email, push, and in-app notifications          | Node.js                 | ✅ Active |
| **frontend**             | React-based web application                    | React, TypeScript, Vite | ✅ Active |

### Shared Services

| Service    | Description                                  | Technology |
| ---------- | -------------------------------------------- | ---------- |
| **shared** | TypeScript utilities, types, and shared code | TypeScript |

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** 14+
- **Redis** 6+
- **Docker** and Docker Compose (optional)
- **Git**

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/Smart-AI-Hub.git
   cd Smart-AI-Hub
   ```

2. **Install dependencies**

   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   ```bash
   # Copy environment templates
   cp packages/auth-service/.env.example packages/auth-service/.env
   cp packages/core-service/.env.example packages/core-service/.env
   # ... for other services

   # Edit the .env files with your configuration
   ```

4. **Set up databases**

   ```bash
   # Start PostgreSQL and Redis (using Docker)
   docker-compose up -d postgres redis

   # Run database migrations
   npm run db:migrate

   # Seed databases with initial data
   npm run db:seed
   ```

5. **Start the development environment**

   ```bash
   # Start all services
   npm run dev

   # Or start individual services
   npm run dev:auth
   npm run dev:core
   npm run dev:gateway
   npm run dev:mcp
   npm run dev:frontend
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:3001
   - Auth Service: http://localhost:3002
   - Core Service: http://localhost:3003

For detailed setup instructions, see [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md).

## Development

### Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards in [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md)
   - Write tests for your changes
   - Update documentation as needed

3. **Run tests**

   ```bash
   # Run all tests
   npm test

   # Run tests with coverage
   npm run test:coverage

   # Run linting
   npm run lint
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Available Scripts

| Script                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Start all services in development mode    |
| `npm run build`         | Build all packages                        |
| `npm run test`          | Run all tests                             |
| `npm run lint`          | Run linting                               |
| `npm run test:coverage` | Run tests with coverage report            |
| `npm run db:migrate`    | Run database migrations                   |
| `npm run db:seed`       | Seed databases                            |
| `npm run docker:dev`    | Start development environment with Docker |

## API Documentation

### Overview

The Smart AI Hub API is organized around RESTful principles and provides endpoints for authentication, user management, credit operations, and AI service interactions.

### Base URLs

- **Development**: `http://localhost:3001`
- **Staging**: `https://api-staging.smartaihub.com`
- **Production**: `https://api.smartaihub.com`

### Authentication

All API requests (except authentication endpoints) require a valid JWT token:

```bash
curl -X GET "http://localhost:3001/api/users/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Key Endpoints

| Method | Endpoint               | Description        |
| ------ | ---------------------- | ------------------ |
| `POST` | `/api/auth/login`      | User login         |
| `POST` | `/api/auth/register`   | User registration  |
| `GET`  | `/api/users/me`        | Get current user   |
| `GET`  | `/api/credits/balance` | Get credit balance |
| `POST` | `/api/mcp/chat`        | Send chat message  |
| `GET`  | `/api/admin/users`     | List users (admin) |

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

## Deployment

### Environment Setup

The application supports multiple deployment environments:

- **Development**: Local development setup
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

### Deployment Options

1. **Docker Deployment**

   ```bash
   # Build and deploy with Docker Compose
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Manual Deployment**

   ```bash
   # Build applications
   npm run build

   # Deploy to servers
   npm run deploy:staging
   npm run deploy:production
   ```

3. **CI/CD Deployment**
   - Automatic deployment on merge to main branch
   - GitHub Actions workflow handles build and deployment
   - Environment-specific configurations

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Testing

### Testing Strategy

The project follows a comprehensive testing approach:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test service interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific service
cd packages/auth-service && npm test

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

### Test Coverage

- Target coverage: 80%+
- Critical paths: 95%+
- Automated reports on PRs

For detailed testing information, see [TESTING_STRATEGY.md](TESTING_STRATEGY.md).

## Security

### Security Features

- JWT-based authentication with role arrays
- Advanced Role-Based Access Control (RBAC) with many-to-many relationships
- Junction tables for UserRole and RolePermission mappings
- Permission caching with Redis for performance
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Security headers

### Security Best Practices

- Regular security audits
- Dependency vulnerability scanning
- Environment variable protection
- Secure API key management
- User data encryption

For detailed security guidelines, see [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- How to contribute
- Code of conduct
- Pull request process
- Issue reporting
- Development setup

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@smartaihub.com
- 💬 Discord: [Join our community](https://discord.gg/smartaihub)
- 📖 Documentation: [docs.smartaihub.com](https://docs.smartaihub.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/Smart-AI-Hub/issues)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this project.

---

**Built with ❤️ by the Smart AI Hub team**
