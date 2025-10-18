# 🚀 Kilo Code Prompt - Smart AI Hub Next Steps

## 📋 สถานะปัจจุบันของโปรเจกต์

### ✅ สิ่งที่มีอยู่แล้ว:

- **โครงสร้าง microservices** พร้อมพื้นฐาน (auth-service, core-service, mcp-server, api-gateway, frontend)
- **Database schema** สมบูรณ์สำหรับ authentication และ credit management (Prisma)
- **MCP Server** ที่ทำงานได้ด้วย WebSocket, JWT authentication, และ credit deduction
- **Basic auth service** พร้อม health check endpoints
- **API Gateway** พร้อม CORS configuration
- **Core service** พร้อม database connection

### 🔍 สิ่งที่ต้องการเสริม:

- Authentication service ที่สมบูรณ์ (JWT, OAuth, password management)
- API Gateway พร้อม routing และ middleware ครบถ้วน
- Frontend React application พร้อม authentication flow
- Testing framework และ CI/CD pipeline
- Production deployment configuration

---

## 🎯 **Priority 1: Complete Authentication Service (Week 1-2)**

### **Task 1.1: สร้าง JWT Authentication System สมบูรณ์**

```
@kilo create complete JWT authentication system for Smart AI Hub auth-service with:

JWT Token Management:
- RS256 signing with public/private key pairs
- Access token (15 minutes) and refresh token (30 days)
- Token blacklisting system using Redis
- Automatic token rotation on refresh
- Secure token storage in httpOnly cookies

Authentication Endpoints:
POST /api/auth/register
- Email/password registration with validation
- Password strength requirements (8+ chars, special chars, numbers)
- Email verification with secure tokens
- Duplicate email prevention
- Rate limiting per IP

POST /api/auth/login
- Email/password authentication with bcrypt
- Account lockout after 5 failed attempts (30 minutes)
- Rate limiting per IP and per user
- Login attempt logging
- Return both access and refresh tokens

POST /api/auth/refresh
- Refresh token validation and rotation
- Blacklist old refresh tokens
- Return new access token

POST /api/auth/logout
- Token blacklisting for both access and refresh tokens
- Clear httpOnly cookies
- Logout from all devices option

POST /api/auth/verify-email
- Email verification with secure tokens
- Token expiration (24 hours)
- Account activation

POST /api/auth/forgot-password
- Secure password reset with email tokens
- Token expiration (1 hour)
- Rate limiting per email

POST /api/auth/reset-password
- Password reset with token validation
- Password strength validation
- Password history (prevent reuse of last 5)

Include comprehensive error handling, input validation with Joi, TypeScript interfaces, and unit tests with Jest.
```

### **Task 1.2: สร้าง Google OAuth 2.0 Integration**

```
@kilo create Google OAuth 2.0 integration for Smart AI Hub auth-service with:

OAuth Configuration:
- Passport.js with Google OAuth 2.0 strategy
- Secure client ID and secret management
- Proper callback URL configuration
- Scope configuration (email, profile)

OAuth Endpoints:
GET /api/auth/google
- Redirect to Google OAuth consent screen
- State parameter for CSRF protection

GET /api/auth/google/callback
- Handle OAuth callback from Google
- Exchange authorization code for tokens
- Retrieve user profile information
- Account linking for existing users (by email)
- New account creation from Google profile
- Error handling for OAuth failures

Account Linking Logic:
- Check if Google email exists in database
- If exists and has password: link Google account
- If exists and no password: convert to OAuth account
- If not exists: create new account with Google data
- Set default role for new OAuth users

Security Features:
- State parameter validation
- CSRF protection
- Secure token storage
- OAuth token revocation on logout
- Error handling for expired/invalid tokens

Include comprehensive error handling, TypeScript interfaces, and integration tests.
```

### **Task 1.3: สร้าง User Management System**

```
@kilo create comprehensive user management system for Smart AI Hub auth-service with:

User Profile Management:
GET /api/users/profile
- Get current user profile with role and permissions
- Include credit account information
- Include usage statistics

PUT /api/users/profile
- Update user profile information
- First name, last name, avatar URL
- User preferences (JSON)
- Input validation and sanitization

GET /api/users/credits
- Get current credit balance
- Get credit transaction history
- Include pagination and filtering

POST /api/users/change-password
- Change password with current password verification
- Password strength validation
- Password history check
- Update password hash with bcrypt

Role-Based Access Control:
- Role assignment and management
- Permission checking middleware
- Default role assignment for new users
- Admin role management endpoints

User Administration (Admin only):
GET /api/admin/users
- List all users with pagination
- Search and filter capabilities
- Include role and status information

PUT /api/admin/users/:id/role
- Change user role
- Audit logging for role changes

POST /api/admin/users/:id/credits
- Adjust user credits (admin)
- Reason for adjustment
- Audit logging

Include comprehensive error handling, TypeScript interfaces, and role-based access control.
```

---

## 🎯 **Priority 2: Complete API Gateway (Week 2)**

### **Task 2.1: สร้าง API Gateway พร้อม Routing และ Middleware**

```
@kilo create comprehensive API Gateway for Smart AI Hub with:

Express.js Setup with TypeScript:
- Route delegation to auth-service (port 3001), core-service (port 3002), mcp-server (port 3003)
- JWT middleware for protected routes
- CORS configuration for frontend integration
- Request/response logging with Winston
- Error handling middleware

Proxy Configuration:
- HTTP proxy for REST API endpoints
- WebSocket proxy for MCP server
- Load balancing for multiple instances
- Health check for backend services
- Circuit breaker pattern for service failures

Security Middleware:
- Helmet.js for security headers
- Request sanitization and validation
- SQL injection prevention
- XSS protection
- Rate limiting configuration

Rate Limiting:
- IP-based rate limiting (100 requests/hour for anonymous)
- User-based rate limiting (1000 requests/hour for authenticated)
- Different limits for different endpoints
- Redis-based rate limit storage
- Rate limit headers in responses

Authentication Middleware:
- JWT token validation for protected routes
- Token refresh mechanism
- User context injection
- Role-based access control
- Session management

Health Check System:
- GET /health - Aggregate health status
- GET /health/services - Individual service health
- Database connectivity checks
- External service availability
- Detailed health metrics

Include Swagger/OpenAPI documentation, comprehensive logging, and monitoring hooks.
```

### **Task 2.2: สร้าง API Documentation และ Monitoring**

```
@kilo create API documentation and monitoring system for Smart AI Hub API Gateway with:

OpenAPI/Swagger Documentation:
- Complete API documentation with Swagger
- Interactive API explorer
- Authentication examples
- Request/response schemas
- Error code documentation

Monitoring and Logging:
- Request/response logging with correlation IDs
- Performance metrics collection
- Error tracking and alerting
- API usage analytics
- Real-time monitoring dashboard

API Analytics:
- Request count per endpoint
- Response time statistics
- Error rate monitoring
- User activity tracking
- Resource usage analytics

Include comprehensive API documentation, monitoring setup, and analytics dashboard.
```

---

## 🎯 **Priority 3: Frontend React Application (Week 2-3)**

### **Task 3.1: สร้าง React Frontend Foundation**

```
@kilo create React frontend foundation for Smart AI Hub with:

Modern React 18+ Setup:
- TypeScript configuration
- Vite build tool for fast development
- Redux Toolkit with RTK Query for state management
- React Router v6 for navigation
- Material-UI v5 as base component library
- Axios for API communication

Authentication Integration:
- Login/Register pages with form validation
- Protected route wrapper component
- Auth context and hooks
- Token management and auto-refresh
- Logout functionality
- Google OAuth integration

Dashboard Structure:
- Main dashboard layout with sidebar
- Header with user profile and notifications
- Credit balance display
- Usage statistics cards
- Navigation menu
- Responsive design

State Management:
- Redux store configuration
- Auth slice for user authentication
- Credit slice for credit management
- API slices for backend communication
- Persistent state with localStorage

Include dark/light theme support, loading states, error boundaries, and accessibility features.
```

### **Task 3.2: สร้าง Authentication UI Components**

```
@kilo create authentication UI components for Smart AI Hub frontend with:

Login Page:
- Email/password form with validation
- Remember me checkbox
- Forgot password link
- Google OAuth login button
- Loading states and error handling
- Redirect after successful login

Register Page:
- Registration form with validation
- Password strength indicator
- Email verification requirement
- Terms and conditions checkbox
- Google OAuth registration option
- Success state with email verification notice

Password Reset Flow:
- Forgot password form with email
- Password reset form with token validation
- New password confirmation
- Password strength requirements
- Success state with login redirect

User Profile Page:
- Profile information display and editing
- Avatar upload functionality
- Password change form
- Account settings
- Delete account option

Include comprehensive form validation, error handling, loading states, and user feedback.
```

---

## 🎯 **Priority 4: Testing Framework (Week 3)**

### **Task 4.1: สร้าง Testing Framework สำหรับ Backend**

```
@kilo create comprehensive testing framework for Smart AI Hub backend services with:

Backend Testing Setup:
- Jest configuration for all services
- Supertest for API integration testing
- Database testing with test containers
- Mock external services (OAuth, email)
- Test coverage reporting with minimum 80%

Authentication Service Tests:
- Unit tests for all authentication functions
- Integration tests for authentication endpoints
- JWT token generation and validation tests
- OAuth flow testing with mocked Google
- Password reset flow testing
- Rate limiting functionality tests

API Gateway Tests:
- Unit tests for middleware functions
- Integration tests for proxy routing
- Authentication middleware tests
- Rate limiting tests
- Error handling tests

MCP Server Tests:
- WebSocket connection tests
- Authentication tests
- Credit deduction tests
- Provider integration tests
- Error handling tests

Test Data Management:
- Test data factories with Faker.js
- Database cleanup between tests
- Mock user and credit data
- Test environment configuration

Include comprehensive test documentation, CI/CD integration, and coverage reporting.
```

### **Task 4.2: สร้าง Testing Framework สำหรับ Frontend**

```
@kilo create comprehensive testing framework for Smart AI Hub frontend with:

Frontend Testing Setup:
- React Testing Library for component testing
- Jest unit tests for utilities and hooks
- Cypress E2E tests for critical user flows
- Visual regression testing setup
- Accessibility testing with axe

Component Testing:
- Authentication form components tests
- Dashboard components tests
- Navigation components tests
- Error boundary tests
- Loading component tests

Integration Testing:
- Authentication flow testing
- API integration testing with msw
- State management testing
- Routing tests
- Theme switching tests

E2E Testing:
- Complete authentication flow
- User registration and login
- Password reset flow
- Dashboard navigation
- Credit usage tracking

Include comprehensive test documentation, CI/CD integration, and coverage reporting.
```

---

## 🎯 **Priority 5: Production Deployment (Week 3-4)**

### **Task 5.1: สร้าง Production Docker Configuration**

```
@kilo create production Docker configuration for Smart AI Hub with:

Multi-stage Docker Builds:
- Optimized Dockerfile for each service
- Node.js Alpine base images
- Security scanning with Trivy
- Minimal attack surface
- Proper health checks

Docker Compose Production:
- Production docker-compose.yml
- Environment variable management
- Network configuration
- Volume mounting for persistent data
- Logging configuration
- Restart policies

Database Configuration:
- PostgreSQL production setup
- Redis production configuration
- Database backup scripts
- Connection pooling
- SSL/TLS configuration

Security Configuration:
- Non-root user execution
- Read-only filesystem where possible
- Resource limits and constraints
- Security scanning integration
- Vulnerability monitoring

Include comprehensive deployment documentation, monitoring setup, and backup procedures.
```

### **Task 5.2: สร้าง CI/CD Pipeline**

```
@kilo create comprehensive CI/CD pipeline for Smart AI Hub with:

GitHub Actions Workflow:
- Automated testing on pull requests
- Code quality checks with ESLint
- Security scanning with CodeQL
- Dependency vulnerability scanning
- Docker image building and pushing
- Automated deployment to staging

Staging Environment:
- Automated staging deployment
- Integration testing in staging
- Performance testing
- Security testing
- User acceptance testing

Production Deployment:
- Manual approval for production
- Blue-green deployment strategy
- Rollback capabilities
- Health checks after deployment
- Monitoring and alerting

Monitoring and Observability:
- Application performance monitoring
- Log aggregation with ELK stack
- Metrics collection with Prometheus
- Alerting configuration
- Dashboard setup

Include comprehensive deployment documentation, monitoring setup, and incident response procedures.
```

---

## 📊 **Success Criteria และ Validation**

### **Functional Requirements:**

- [ ] User registration and login working end-to-end
- [ ] Google OAuth integration functional
- [ ] JWT token management operational
- [ ] Credit system working with API usage
- [ ] MCP server integration with frontend
- [ ] Responsive design working on all devices

### **Quality Requirements:**

- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing for critical flows
- [ ] API documentation complete
- [ ] Performance metrics acceptable (<200ms response time)
- [ ] Security basics implemented

### **Deployment Requirements:**

- [ ] Docker containers running in production
- [ ] CI/CD pipeline functional
- [ ] Monitoring and alerting active
- [ ] Backup procedures in place
- [ ] SSL/TLS certificates configured
- [ ] Health checks passing

---

## 🚀 **Quick Start Commands**

```bash
# 1. Database setup
cd packages/auth-service
npm run migrate:latest
npm run seed:run

# 2. Start development servers
docker-compose up -d  # Database services
npm run dev:all       # All microservices

# 3. Test endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Core Service
curl http://localhost:3003/health  # MCP Server

# 4. Frontend development
cd packages/frontend
npm run dev

# 5. Run tests
npm run test        # All tests
npm run test:unit   # Unit tests only
npm run test:e2e    # E2E tests only
```

---

## 📋 **Implementation Priority Order**

1. **Week 1**: Complete Authentication Service (Tasks 1.1-1.3)
2. **Week 2**: Complete API Gateway (Tasks 2.1-2.2) + Frontend Foundation (Task 3.1)
3. **Week 3**: Frontend Authentication UI (Task 3.2) + Testing Framework (Tasks 4.1-4.2)
4. **Week 4**: Production Deployment (Tasks 5.1-5.2) + Final Testing

**🎊 เริ่มจาก Task 1.1 ได้เลย! ใช้ Kilo Code ตามคำสั่งข้างต้นเพื่อสร้าง Smart AI Hub ให้สมบูรณ์!**
