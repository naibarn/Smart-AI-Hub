# Smart AI Hub - VS Code + Kilo Code Setup Guide

## 🚀 การเริ่มต้นพัฒนา Smart AI Hub

### 1. การตั้งค่า VS Code Environment

#### 📦 Extensions ที่จำเป็น
```bash
# ติดตั้ง extensions ผ่าน VS Code หรือ command line
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension ms-vscode.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode-remote.remote-containers
```

#### ⚙️ VS Code Settings สำหรับโปรเจกต์
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### 2. การใช้ Kilo Code สำหรับ Smart AI Hub

#### 🎯 คำสั่งเริ่มต้นสำหรับ Kilo Code

**สร้างโครงสร้างโปรเจกต์**:
```
@kilo create monorepo structure for Smart AI Hub with these services:
- api-gateway (Express.js + TypeScript)
- auth-service (Node.js + TypeScript + JWT + OAuth)
- core-service (Node.js + TypeScript + PostgreSQL)
- mcp-server (Node.js + TypeScript + WebSocket)
- frontend (React + TypeScript + Material-UI)
- shared (TypeScript utilities and types)

Include Docker configuration, TypeScript setup, and package.json for each service.
```

**สร้าง Database Schema**:
```
@kilo generate PostgreSQL database schema for Smart AI Hub with these tables:
- users (id, email, password_hash, google_id, email_verified, role_id, created_at, updated_at)
- roles (id, name, permissions as JSONB, created_at)
- user_profiles (user_id, first_name, last_name, avatar_url, preferences as JSONB)
- credit_accounts (user_id, current_balance, total_purchased, total_used)
- credit_transactions (id, user_id, type, amount, balance_after, description, metadata as JSONB)
- services (id, name, type, provider, cost_per_use, rate_limit_per_hour, active, config as JSONB)
- usage_logs (id, user_id, service_id, credits_used, request_data as JSONB, response_data as JSONB, status)

Include indexes, foreign keys, and migration scripts using Knex.js
```

**สร้าง Authentication Service**:
```
@kilo create authentication service for Smart AI Hub with:
- JWT token generation and validation (RS256)
- Google OAuth 2.0 integration using Passport.js
- Email verification with nodemailer
- Password reset functionality
- Role-based middleware for route protection
- Rate limiting with express-rate-limit
- Input validation with Joi
- Password hashing with bcrypt

Include TypeScript interfaces, error handling, and comprehensive testing with Jest.
```

### 3. ลำดับการพัฒนาตาม Backlog

#### 🏗️ Sprint 1: Infrastructure Setup (Week 1-2)

**คำสั่ง Kilo Code สำหรับ Sprint 1**:

```
@kilo setup Docker development environment for Smart AI Hub:
- docker-compose.yml with PostgreSQL, Redis, Nginx
- Dockerfile for each microservice
- Environment variable configuration
- Development and production configurations
- Health check endpoints for all services
```

```
@kilo create API Gateway for Smart AI Hub:
- Express.js with TypeScript
- Route delegation to microservices
- JWT authentication middleware
- Rate limiting middleware
- CORS configuration
- Request/response logging
- Error handling middleware
- OpenAPI documentation setup
```

```
@kilo generate database connection and ORM setup:
- Knex.js configuration for PostgreSQL
- Connection pooling setup
- Migration and seed scripts
- Database utility functions
- Redis client configuration for caching
- Type-safe database queries with TypeScript
```

#### 🔐 Sprint 2: Authentication System (Week 3-4)

```
@kilo implement user registration and login system:
- POST /auth/register endpoint with email validation
- POST /auth/login with JWT token generation
- Email verification system with templates
- Password reset flow with secure tokens
- Google OAuth callback handling
- User profile management
- Session management with Redis
- Comprehensive error handling and validation
```

```
@kilo create role-based access control (RBAC) system:
- Role and permission management
- Middleware for route protection
- Dynamic permission checking
- Role inheritance system
- Admin role management interface
- Default role assignment for new users
- Audit logging for permission changes
```

#### 💰 Sprint 3: Credit Management (Week 5-6)

```
@kilo develop credit management system:
- Credit account creation and management
- Credit transaction logging with audit trail
- Credit deduction for service usage
- Stripe payment integration for credit purchase
- Credit packages configuration
- Low balance notifications
- Admin credit adjustment tools
- Credit usage analytics and reporting
```

#### 🔌 Sprint 4: MCP Server (Week 7-8)

```
@kilo create MCP server for LLM integration:
- WebSocket server with authentication
- OpenAI API client with error handling
- Anthropic Claude API integration
- Request/response transformation
- Provider switching and load balancing
- Usage tracking and credit deduction
- Rate limiting per user and service
- Comprehensive logging and monitoring
```

```
@kilo implement unified LLM interface:
- Abstract provider interface
- Request normalization across providers
- Response format standardization
- Error handling and retry logic
- Provider health monitoring
- Fallback mechanisms
- Performance optimization
- Integration testing suite
```

### 4. Frontend Development Commands

#### ⚛️ React Frontend Setup

```
@kilo create React frontend for Smart AI Hub:
- React 18+ with TypeScript and Vite
- Material-UI component library setup
- Redux Toolkit with RTK Query
- React Router v6 configuration
- Authentication context and hooks
- Responsive layout components
- Error boundary implementation
- PWA configuration
```

```
@kilo develop authentication UI components:
- LoginForm with validation using react-hook-form
- RegisterForm with email verification flow
- GoogleOAuth login button
- ForgotPassword and ResetPassword forms
- UserProfile management interface
- Protected route components
- Loading and error states
- Responsive design for mobile
```

```
@kilo create user dashboard interface:
- DashboardLayout with navigation
- CreditBalance display component
- UsageStatistics with charts (Recharts)
- AvailableServices grid
- UsageHistory table with pagination
- NotificationCenter for alerts
- Settings panel
- Real-time updates via WebSocket
```

### 5. Testing Commands

#### 🧪 Comprehensive Testing Setup

```
@kilo setup testing framework for Smart AI Hub:
- Jest configuration for unit testing
- Supertest for API integration testing
- React Testing Library for frontend testing
- Cypress for end-to-end testing
- Test database setup and teardown
- Mock services for external APIs
- Coverage reporting and thresholds
- CI/CD integration with GitHub Actions
```

```
@kilo generate test suites for authentication:
- Unit tests for authentication middleware
- Integration tests for auth endpoints
- OAuth flow testing
- JWT token validation tests
- Password security tests
- Rate limiting tests
- User registration and login E2E tests
- Security vulnerability tests
```

### 6. Deployment Commands

#### 🚀 Production Deployment

```
@kilo create production deployment configuration:
- Docker production images with multi-stage builds
- Nginx reverse proxy configuration
- SSL certificate automation with Let's Encrypt
- Environment variable management
- Database migration pipeline
- Health check endpoints
- Monitoring and logging setup
- Backup and recovery procedures
```

```
@kilo setup CI/CD pipeline:
- GitHub Actions workflow configuration
- Automated testing pipeline
- Security scanning with Snyk
- Docker image building and pushing
- Staging deployment automation
- Production deployment with rollback
- Performance monitoring integration
- Slack notifications for deployments
```

### 7. Monitoring and Analytics

```
@kilo implement monitoring and analytics:
- Application performance monitoring
- Error tracking and alerting
- User analytics dashboard
- API usage metrics
- Credit consumption tracking
- System health monitoring
- Custom metrics collection
- Performance optimization insights
```

### 8. คำสั่งเฉพาะสำหรับแต่ละ Phase

#### 📝 Phase 2: Prompt Management

```
@kilo create prompt management system:
- Template creation and editing interface
- Variable substitution system
- Template categories and tagging
- Version control for templates
- Template sharing and collaboration
- Prompt execution with multiple providers
- Performance analytics for prompts
- Template marketplace functionality
```

#### 🎨 Phase 3: Media Generation

```
@kilo integrate media generation services:
- fal.ai API integration for image generation
- kie.ai service integration
- Kling AI video generation
- Multi-provider routing system
- Content moderation pipeline
- Media storage and CDN integration
- Usage tracking and billing
- Quality optimization algorithms
```

### 9. การใช้ Kilo Code อย่างมีประสิทธิภาพ

#### 💡 Tips สำหรับคำสั่ง Kilo Code

**1. ใช้ Context ที่ชัดเจน**:
```
@kilo [action] [component] for Smart AI Hub with [specific requirements]
```

**2. ระบุ Technology Stack**:
```
@kilo create [component] using Node.js + TypeScript + PostgreSQL + Redis
```

**3. รวม Testing Requirements**:
```
@kilo [action] including unit tests, integration tests, and TypeScript types
```

**4. ระบุ Security Requirements**:
```
@kilo [action] with JWT authentication, input validation, and rate limiting
```

**5. ขอ Documentation**:
```
@kilo [action] with comprehensive JSDoc comments and API documentation
```

### 10. Workspace Configuration

#### 📁 VS Code Workspace Setup

```json
// smart-ai-hub.code-workspace
{
  "folders": [
    {"name": "API Gateway", "path": "./api-gateway"},
    {"name": "Auth Service", "path": "./auth-service"},
    {"name": "Core Service", "path": "./core-service"},
    {"name": "MCP Server", "path": "./mcp-server"},
    {"name": "Frontend", "path": "./frontend"},
    {"name": "Shared", "path": "./shared"},
    {"name": "Docs", "path": "./docs"}
  ],
  "settings": {
    "typescript.preferences.includePackageJsonAutoImports": "on",
    "editor.rulers": [80, 120],
    "files.associations": {
      "*.env.*": "properties"
    }
  },
  "extensions": {
    "recommendations": [
      "ms-vscode.vscode-typescript-next",
      "bradlc.vscode-tailwindcss",
      "ms-vscode.vscode-eslint",
      "esbenp.prettier-vscode"
    ]
  }
}
```

### 🎯 การเริ่มต้นในวันแรก

**Step 1**: เปิด VS Code และสร้าง workspace
**Step 2**: ใช้คำสั่ง Kilo Code สร้างโครงสร้างพื้นฐาน
**Step 3**: ติดตั้ง dependencies และ configure development environment
**Step 4**: เริ่มพัฒนา authentication service ตาม Sprint 1-2
**Step 5**: Setup testing และ CI/CD pipeline

พร้อมเริ่มพัฒนา Smart AI Hub แล้วครับ! 🚀