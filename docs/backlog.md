---
title: "backlog"
author: "Development Team"
version: "1.0.0"
---
# Product Backlog

## Smart AI Hub - Development Tasks

### Document Information

**Version**: 2.2
**Last Updated**: 2025-10-13
**Sprint Duration**: 2 weeks  
**Team Size**: 3-4 developers

### Backlog Overview

**Total Estimated Story Points**: 223 points
**Completed Story Points**: 102 points (45.7% complete)
**Current Sprint**: Sprint 4 (Weeks 7-8) - In Progress
**Phases**: 3 phases over 24-30 weeks

**Progress Summary** (as of 2025-10-13):

- ✅ Database setup and schema implementation
- ✅ Basic project structure with monorepo
- ✅ User registration with authentication
- ✅ Credit account creation system
- ✅ User login functionality with JWT tokens
- ✅ JWT middleware for protected routes
- ✅ Refresh token mechanism with rotation
- ✅ Token blacklist functionality (logout)
- ✅ Email verification system with OTP
- ✅ Password reset functionality
- ✅ Google OAuth integration
- ✅ Role-Based Access Control (RBAC) with permission caching
- ✅ Complete Credit APIs (balance, history, admin adjustments)
- ✅ Promotional Code System (redemption, validation)
- ✅ MCP Server Foundation (WebSocket, authentication, connection management)
- ✅ Frontend development server setup (React + Vite)
- ✅ API Gateway development server running
- ✅ OpenAI SDK integration completed
- ✅ SORA2 Video Generator integration completed
- 🔄 Claude integration in progress
- 📋 Next: Complete payment system with Stripe integration

### Story Point Estimation Scale

- **1 point**: 1-2 hours (Simple config changes)
- **2 points**: 4-6 hours (Simple feature)
- **3 points**: 1 day (Medium feature)
- **5 points**: 2-3 days (Complex feature)
- **8 points**: 1 week (Large feature)
- **13 points**: 2 weeks (Epic feature)

### Definition of Ready Checklist

Before a story enters a sprint:

- [ ] Acceptance criteria clearly defined
- [ ] Dependencies identified and resolved/noted
- [ ] Technical approach discussed
- [ ] Story points estimated by team
- [ ] Risks assessed and mitigation planned
- [ ] No blockers present

### Definition of Done Checklist

For each user story to be considered complete:

#### Development

- [ ] Code implementation completed
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] Code review completed and approved
- [ ] Documentation updated (inline comments, README)
- [ ] No console errors or warnings

#### Quality Assurance

- [ ] Manual testing completed
- [ ] Performance requirements met
- [ ] Security requirements validated
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Cross-browser compatibility verified (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness tested

#### Deployment

- [ ] Feature deployed to staging environment
- [ ] Smoke tests passed
- [ ] Database migrations applied successfully
- [ ] Environment variables configured
- [ ] Monitoring and logging configured
- [ ] Rollback plan documented

#### Acceptance

- [ ] All acceptance criteria validated
- [ ] Product owner approval received
- [ ] User experience validated
- [ ] Performance benchmarks met
- [ ] Ready for production deployment

---

## PHASE 1: Foundation & Custom GPT Authorization (MVP)

**Duration**: 8-10 weeks (4-5 sprints)  
**Total Story Points**: 94 points  
**Target Release**: Q1 2026

### Epic 1: Project Setup & Infrastructure (Sprint 1)

#### E1.1: Development Environment Setup

**Story Points**: 8  
**Priority**: P0 (Critical)  
**Status**: In Progress  
**Dependencies**: None  
**Risk Level**: Low

**Acceptance Criteria**:

- [x] Ubuntu VPS server setup and configuration ✅ DONE
- [x] Docker and Docker Compose installation ✅ DONE
- [x] Nginx reverse proxy configuration ✅ DONE
- [ ] SSL certificate setup (Let's Encrypt) with auto-renewal
- [ ] Basic monitoring setup (PM2 with cluster mode)
- [ ] Server security hardening (firewall, fail2ban, SSH keys only)

**Technical Details**:

```bash
# SSL Certificate Setup
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.smartaihub.com -d www.smartaihub.com
sudo certbot renew --dry-run  # Test auto-renewal

# PM2 Setup
npm install -g pm2
pm2 startup systemd
pm2 save
```

**Tasks**:

- [ ] Configure UFW firewall (allow 22, 80, 443)
- [ ] Setup fail2ban for SSH protection
- [ ] Install and configure PM2 with ecosystem.config.js
- [ ] Setup automated SSL renewal cron job
- [ ] Create deployment user with limited permissions
- [ ] Configure log rotation
- [ ] Setup automated backups

**Technical Debt**: Manual SSL setup initially, automate in Sprint 2

---

#### E1.2: Database Setup

**Story Points**: 5  
**Priority**: P0 (Critical)  
**Status**: ✅ COMPLETED  
**Completed Date**: 2025-10-02

**Acceptance Criteria**:

- [x] PostgreSQL database installation and configuration ✅
- [x] Redis cache server setup ✅
- [x] Database schema initialization ✅
- [x] Database migration system setup ✅
- [x] Connection pooling configuration ✅

**Completion Notes**:

- PostgreSQL 15 configured with optimized settings
- Redis 7 configured for caching and sessions
- Prisma migrations working correctly
- All tables created and indexed
- Connection pool: max 100, min 10 connections

**Lessons Learned**:

- Schema alignment between Prisma and migrations requires careful review
- Initial credit balance (1 credit) working as expected

---

#### E1.3: Project Structure Creation

**Story Points**: 3  
**Priority**: P0 (Critical)  
**Status**: ✅ COMPLETED  
**Completed Date**: 2025-10-02

**Acceptance Criteria**:

- [x] Monorepo structure with microservices ✅
- [x] TypeScript configuration for all services ✅
- [x] Docker containers for each service ✅
- [x] Environment configuration management ✅
- [ ] Code quality tools setup (ESLint, Prettier)

**Remaining Tasks**:

- [ ] Setup ESLint with shared config
- [ ] Setup Prettier with pre-commit hooks
- [ ] Configure Husky for git hooks
- [ ] Add commitlint for conventional commits

**Technical Debt**: Code quality tools postponed to Sprint 2

---

#### NEW: E1.4: CI/CD Pipeline Setup

**Story Points**: 5  
**Priority**: P1 (High)  
**Status**: Not Started  
**Dependencies**: E1.3  
**Risk Level**: Medium

**Acceptance Criteria**:

- [ ] GitHub Actions workflow for automated testing
- [ ] Automated linting and type checking
- [ ] Docker image building and pushing
- [ ] Automated deployment to staging
- [ ] Build status badges in README

**Pipeline Stages**:

```yaml
1. Lint & Type Check
2. Unit Tests (with coverage report)
3. Integration Tests
4. Build Docker Images
5. Push to Registry
6. Deploy to Staging (on main branch)
```

**Tasks**:

- [ ] Create .github/workflows/ci.yml
- [ ] Setup Docker Hub or GitHub Container Registry
- [ ] Configure secrets in GitHub
- [ ] Setup staging environment
- [ ] Add deployment scripts

---

#### NEW: E1.5: Logging Infrastructure

**Story Points**: 3  
**Priority**: P1 (High)  
**Status**: Not Started  
**Dependencies**: E1.3  
**Risk Level**: Low

**Acceptance Criteria**:

- [ ] Winston logger configured in all services
- [ ] Structured JSON logging format
- [ ] Log levels properly configured (dev: debug, prod: info)
- [ ] Request ID correlation across services
- [ ] Error stack traces captured
- [ ] Sensitive data masking in logs

**Implementation**:

```typescript
// Shared logger configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME,
  },
});
```

---

### Epic 2: Authentication System (Sprint 1-2)

#### E2.1: Basic Authentication API

**Story Points**: 8
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E1.2 (completed), E1.3 (completed)
**Risk Level**: Medium

**Acceptance Criteria**:

- [x] User registration with email/password ✅ DONE
- [x] User login with JWT token generation ✅ DONE
- [x] Password hashing with bcrypt (cost: 12) ✅ DONE
- [ ] Email verification system (6-digit OTP)
- [ ] Password reset functionality
- [x] JWT token validation middleware ✅ DONE
- [x] Refresh token mechanism ✅ DONE
- [x] Token blacklist (logout functionality) ✅ DONE

**Completion Notes**:

- Login endpoint fully implemented with credential validation
- JWT middleware created for protected routes with blacklist checking
- Refresh token mechanism with rotation implemented
- Token blacklist functionality working for logout
- Failed login attempt logging implemented
- Comprehensive test coverage for login and refresh flows

**Tests Completed**:

- [x] Login success/failure scenarios
- [x] JWT generation and validation
- [x] Refresh token rotation
- [x] Token blacklist functionality
- [x] Validation error handling

**Detailed Tasks**:

**Day 1: Login Implementation**

```typescript
// POST /login endpoint
- [ ] Validate email and password format
- [ ] Query user from database
- [ ] Verify password with bcrypt.compare
- [ ] Generate access token (15min expiry)
- [ ] Generate refresh token (7 days expiry)
- [ ] Store refresh token in Redis
- [ ] Track failed login attempts (max 5 per 15min)
- [ ] Create audit log entry
- [ ] Return tokens in response
```

**Day 2: JWT Middleware & Email Verification**

```typescript
// JWT Middleware
- [ ] Extract token from Authorization header
- [ ] Validate token signature
- [ ] Check token expiration
- [ ] Verify token not in blacklist (Redis)
- [ ] Attach user to request object
- [ ] Handle token errors gracefully

// Email Verification
- [ ] Generate 6-digit OTP
- [ ] Store OTP in Redis (15min TTL)
- [ ] Send verification email via SendGrid
- [ ] Create /verify-email endpoint
- [ ] Mark user as verified in database
- [ ] Rate limit verification attempts
```

**Day 3-4: Password Reset & Refresh Token**

```typescript
// Password Reset
- [ ] POST /forgot-password - Generate reset token
- [ ] Send reset email with link
- [ ] Store token in Redis (1 hour TTL)
- [ ] POST /reset-password - Validate token
- [ ] Update password hash
- [ ] Invalidate all user sessions

// Refresh Token
- [ ] POST /refresh endpoint
- [ ] Validate refresh token
- [ ] Generate new access token
- [ ] Rotate refresh token (optional)
```

**Unit Tests Required**:

- [ ] Registration validation tests
- [ ] Login success/failure scenarios
- [ ] JWT generation and validation
- [ ] Password hashing verification
- [ ] Token expiration handling
- [ ] Blacklist functionality

**Integration Tests Required**:

- [ ] Full registration flow
- [ ] Login → Protected route → Logout
- [ ] Email verification flow
- [ ] Password reset flow

**Blockers**:

- Need SendGrid API key for email verification
- Need to decide on OTP vs magic link for verification

**Technical Debt**:

- TODO: Implement rate limiting per IP/user
- TODO: Add account lockout after failed attempts
- TODO: Implement 2FA (Phase 2)

---

#### E2.4: Email Verification System

**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.1 (completed)
**Risk Level**: Medium

**Acceptance Criteria**:

- [x] 6-digit OTP generation ✅
- [x] OTP email delivery via SendGrid ✅
- [x] OTP verification endpoint ✅
- [x] OTP expiry (15 minutes) ✅
- [x] Rate limiting for verification attempts ✅
- [x] Account status update after verification ✅
- [x] Resend OTP functionality ✅

**Completion Notes**:

- Email verification system fully implemented with 6-digit OTP
- SendGrid integration configured and working
- OTP verification endpoint with proper validation
- Rate limiting implemented (max 5 attempts per 15 minutes)
- Account status updates working correctly
- Resend OTP functionality implemented
- Comprehensive test coverage for verification flow

**Implementation Details**:

```typescript
// OTP Generation
- Generate cryptographically secure 6-digit code
- Store in Redis with 15-minute TTL
- Include user ID and timestamp in Redis key

// Email Template
- Professional HTML email template
- Clear instructions for users
- Company branding
- Expiration time notice

// Verification Endpoint
POST /api/auth/verify-email
{
  "email": "user@example.com",
  "otp": "123456"
}

// Resend Endpoint
POST /api/auth/resend-verification
{
  "email": "user@example.com"
}
```

**Tasks**:

- [ ] Configure SendGrid API integration
- [ ] Create OTP generation utility
- [ ] Design email template
- [ ] Implement verification endpoint
- [ ] Add rate limiting (max 5 attempts per 15 min)
- [ ] Create resend OTP endpoint
- [ ] Add verification status to user model
- [ ] Update registration flow to require verification

**Security Measures**:

- [ ] Constant-time OTP comparison
- [ ] Secure OTP generation using crypto.randomBytes()
- [ ] Rate limiting per IP and email
- [ ] OTP attempt logging
- [ ] Automatic cleanup of expired OTPs

**Tests Required**:

- [ ] OTP generation and storage
- [ ] Email sending functionality
- [ ] Successful verification flow
- [ ] Expired OTP handling
- [ ] Invalid OTP attempts
- [ ] Rate limiting enforcement
- [ ] Resend OTP functionality

---

#### E2.5: Password Reset Flow

**Story Points**: 3
**Priority**: P1 (High)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.4 (Email Verification)
**Risk Level**: Low

**Acceptance Criteria**:

- [x] Password reset request endpoint ✅
- [x] Secure reset token generation ✅
- [x] Reset email delivery ✅
- [x] Password reset confirmation endpoint ✅
- [x] Token expiry (1 hour) ✅
- [x] Session invalidation after reset ✅
- [x] Password strength validation ✅

**Completion Notes**:

- Password reset flow fully implemented
- Secure reset token generation with crypto
- Reset email delivery working with SendGrid
- Password reset confirmation endpoint implemented
- Token expiry set to 1 hour
- All user sessions invalidated after password reset
- Password strength validation implemented
- Comprehensive test coverage for password reset flow

**Implementation Details**:

```typescript
// Reset Request
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

// Reset Confirmation
POST /api/auth/reset-password
{
  "token": "secure-reset-token",
  "newPassword": "newStrongPassword123!"
}
```

**Tasks**:

- [ ] Create secure reset token generator
- [ ] Store reset tokens in Redis with 1-hour TTL
- [ ] Design password reset email template
- [ ] Implement forgot-password endpoint
- [ ] Implement reset-password endpoint
- [ ] Invalidate all user sessions after reset
- [ ] Add password strength validation
- [ ] Log password reset events

**Security Measures**:

- [ ] Cryptographically secure reset tokens
- [ ] Single-use tokens (deleted after use)
- [ ] Rate limiting for reset requests
- [ ] Verify token existence before allowing reset
- [ ] Audit trail for password changes

**Tests Required**:

- [ ] Reset request flow
- [ ] Token validation
- [ ] Password update success
- [ ] Invalid token handling
- [ ] Expired token handling
- [ ] Session invalidation verification

---

#### E2.2: Google OAuth Integration

**Story Points**: 5
**Priority**: P1 (High)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.1
**Risk Level**: Medium
**Blocks**: None

**Acceptance Criteria**:

- [x] Google OAuth 2.0 configuration ✅
- [x] OAuth callback handling ✅
- [x] User account creation from Google profile ✅
- [x] Account linking (existing email) ✅
- [x] OAuth error handling ✅
- [x] CSRF protection in OAuth flow ✅

**Completion Notes**:

- Google OAuth 2.0 fully configured with Passport.js
- OAuth callback handler implemented
- User account creation from Google profile working
- Account linking for existing emails implemented
- Comprehensive OAuth error handling
- CSRF protection implemented with state parameter
- OAuth endpoints tested and working

**Prerequisites**:

- [ ] Create Google Cloud Console project
- [ ] Configure OAuth 2.0 credentials
- [ ] Add authorized redirect URIs
- [ ] Obtain client ID and secret

**Implementation Tasks**:

```typescript
// Passport Google Strategy
- [ ] Install passport-google-oauth20
- [ ] Configure strategy with client ID/secret
- [ ] Define callback URL
- [ ] Handle user profile mapping
- [ ] Check if user exists (by email or googleId)
- [ ] Create new user or update existing
- [ ] Issue JWT tokens
- [ ] Handle OAuth errors
```

**Endpoints**:

```
GET  /auth/google           - Initiate OAuth flow
GET  /auth/google/callback  - OAuth callback handler
```

**Security Considerations**:

- [ ] Validate state parameter (CSRF)
- [ ] Verify token with Google
- [ ] Rate limit OAuth endpoints
- [ ] Log OAuth events for audit

**Testing**:

- [ ] Mock Google OAuth responses
- [ ] Test account creation flow
- [ ] Test account linking flow
- [ ] Test error scenarios

---

#### E2.3: Role-Based Access Control (RBAC)

**Story Points**: 5
**Priority**: P1 (High)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.1
**Risk Level**: Low

**Acceptance Criteria**:

- [x] Role system implementation (SuperAdmin, Admin, Manager, User, Guest) ✅
- [x] Permission system with resource-action pairs ✅
- [x] Role assignment functionality ✅
- [x] Permission checking middleware ✅
- [x] Default role assignment (User) for new registrations ✅
- [x] Role hierarchy enforcement ✅

**Database Changes**:

```prisma
// Already defined in schema
- roles table ✅
- permissions table ✅
- user_roles junction table ✅
- role_permissions junction table ✅
```

**Default Roles & Permissions**:

```typescript
SuperAdmin:
  - ALL permissions on ALL resources ✅

Admin:
  - users: create, read, update, delete ✅
  - credits: read, update, adjust ✅
  - roles: read, assign ✅
  - services: read, configure ✅

Manager:
  - users: read (team only) ✅
  - credits: read (team only), adjust (team only) ✅
  - services: read ✅

User:
  - users: read (self only), update (self only) ✅
  - credits: read (self only) ✅
  - services: use ✅

Guest:
  - users: read (self only) ✅
  - credits: read (self only) ✅
  - services: limited use ✅
```

**Implementation Tasks**:

- [x] Create seed data for default roles/permissions ✅
- [x] Implement role assignment service ✅
- [x] Create RBAC middleware ✅
- [x] Add role-based route protection ✅
- [x] Implement permission caching (Redis) ✅

**Middleware Usage**:

```typescript
// Protect routes by permission
router.delete('/users/:id', requirePermission('users', 'delete'), deleteUser);

// Protect routes by role
router.get('/admin/dashboard', requireRole(['admin', 'superadmin']), getAdminDashboard);
```

**Completion Notes**:

- Complete RBAC system implemented with 5 default roles (SuperAdmin, Admin, Manager, User, Guest)
- Permission-based access control with resource-action pairs
- Redis caching for permission checks (1 hour TTL)
- Comprehensive test coverage for all RBAC middleware functions
- Role assignment/removal endpoints with proper authorization
- Seed script creates all default roles and permissions
- Permission invalidation cache when roles are changed

---

### Epic 3: Credit Management System (Sprint 2-3)

#### E3.1: Credit Account System

**Story Points**: 5
**Priority**: P1 (High)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03

**Acceptance Criteria**:

- [x] Credit account creation for new users ✅
- [x] Initial balance (1 credit) ✅
- [x] Credit balance tracking API ✅
- [x] Credit transaction logging ✅
- [x] Credit usage calculation ✅
- [x] Credit history API endpoints ✅

**Completion Notes**:

- Auto-creation on user registration
- Database schema implemented
- Initial balance setup
- Credit balance endpoint with Redis caching (60s TTL)
- Transaction history with pagination (page/limit)
- Admin credit adjustment endpoints
- Promo code redemption system
- Comprehensive error handling and validation

**API Endpoints Implemented**:

```typescript
GET    /credits/balance        - Get current balance (with caching)
GET    /credits/history        - Transaction history (paginated)
POST   /credits/redeem         - Redeem promo codes
POST   /admin/credits/adjust   - Admin credit adjustments
GET    /admin/credits/:userId  - Get user credit info (admin)
```

---

#### E3.2: Credit Top-up System

**Story Points**: 8  
**Priority**: P1 (High)  
**Status**: Not Started  
**Dependencies**: E3.1, Stripe Account Setup  
**Risk Level**: High (Payment integration)

**Acceptance Criteria**:

- [ ] Credit package configuration
- [ ] Stripe payment integration
- [ ] Checkout page (hosted or embedded)
- [ ] Payment webhook handling
- [ ] Transaction security (idempotency)
- [ ] Purchase confirmation email
- [ ] Refund processing

**Credit Packages**:

```typescript
{
  starter: { credits: 100, price: 10, perCredit: 0.10 },
  pro: { credits: 1000, price: 80, perCredit: 0.08 },
  business: { credits: 10000, price: 600, perCredit: 0.06 },
  enterprise: { custom: true }
}
```

**Implementation Steps**:

1. **Stripe Setup** (1 day)
   - [ ] Create Stripe account
   - [ ] Configure products and prices
   - [ ] Setup webhook endpoint
   - [ ] Add Stripe SDK

2. **Purchase Flow** (2 days)
   - [ ] Create checkout session endpoint
   - [ ] Redirect to Stripe checkout
   - [ ] Handle success/cancel callbacks
   - [ ] Store pending transactions

3. **Webhook Processing** (2 days)
   - [ ] Verify webhook signatures
   - [ ] Handle checkout.session.completed
   - [ ] Handle payment_intent.succeeded
   - [ ] Handle payment_intent.failed
   - [ ] Implement idempotency (prevent duplicate credits)
   - [ ] Update credit balance atomically

4. **Email Notifications** (1 day)
   - [ ] Purchase confirmation email
   - [ ] Receipt with transaction details
   - [ ] Failed payment notification

**Security Measures**:

- [ ] Webhook signature verification
- [ ] Idempotency keys for all operations
- [ ] Transaction audit logging
- [ ] PCI compliance (Stripe handles card data)

**Testing**:

- [ ] Use Stripe test mode
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Test webhook retry mechanism
- [ ] Test duplicate webhook prevention

---

#### E3.3: Admin Credit Management

**Story Points**: 3  
**Priority**: P2 (Medium)  
**Status**: Not Started  
**Dependencies**: E3.1, E2.3 (RBAC)

**Acceptance Criteria**:

- [ ] Admin interface for credit adjustments
- [ ] Manual credit addition/deduction
- [ ] Bulk credit operations
- [ ] Credit audit trail
- [ ] Credit usage reports

**Admin Endpoints**:

```typescript
POST   /admin/credits/adjust       - Adjust user credits
POST   /admin/credits/bulk         - Bulk operations
GET    /admin/credits/report       - Usage reports
GET    /admin/credits/audit        - Audit trail
```

**Tasks**:

- [ ] Create admin credit adjustment service
- [ ] Add reason field for manual adjustments
- [ ] Implement bulk operations (CSV import)
- [ ] Create audit trail queries
- [ ] Build usage report generator

---

#### E3.4: Promotional Code System

**Story Points**: 5
**Priority**: P2 (Medium)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E3.1

**Acceptance Criteria**:

- [x] Promo code creation (admin only) ✅
- [x] Code redemption functionality ✅
- [x] Validation (exists, not expired, not used) ✅
- [x] One-time use per user enforcement ✅
- [x] Credit bonus application ✅
- [x] Redemption tracking ✅

**Promo Code Properties**:

```typescript
interface PromoCode {
  code: string; // e.g., "WELCOME10"
  credits: number; // Bonus credits
  maxUses?: number; // Global limit (null = unlimited)
  expiresAt?: Date; // Expiration date (null = never)
  active: boolean; // Can be deactivated
}
```

**Endpoints Implemented**:

```typescript
POST   /credits/redeem         - Redeem code (user)
// Admin endpoints for promo management will be in Phase 2
```

**Validation Rules Implemented**:

- [x] Code must exist and be active
- [x] Code must not be expired
- [x] User must not have redeemed this code before
- [x] Global max uses not exceeded (if set)

**Completion Notes**:

- Atomic transaction implementation for redemption
- Redis cache invalidation on credit updates
- Comprehensive error handling for all validation cases
- Usage tracking with promo_code_usage table
- Admin management UI planned for Phase 2

---

### Epic 4: MCP Server Development (Sprint 3-4)

#### E4.1: MCP Server Foundation

**Story Points**: 8
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.1 (JWT middleware), E3.1 (Credit system)
**Risk Level**: High

**Acceptance Criteria**:

- [x] MCP protocol implementation ✅
- [x] WebSocket server with authentication ✅
- [x] Request/response message format ✅
- [x] Connection lifecycle management ✅
- [x] Error handling and logging ✅
- [x] Heartbeat/ping-pong mechanism ✅

**WebSocket Server Setup**:

```typescript
import WebSocket from 'ws';

const wss = new WebSocket.Server({
  port: 3003,
  verifyClient: async (info, callback) => {
    // Verify JWT from query param or header
    try {
      const token = extractToken(info.req);
      const user = await verifyToken(token);
      info.req.user = user;
      callback(true);
    } catch (error) {
      callback(false, 401, 'Unauthorized');
    }
  },
});
```

**Message Protocol**:

```typescript
// Client → Server
interface MCPRequest {
  id: string; // Unique request ID
  type: 'completion' | 'chat'; // Request type
  provider?: 'openai' | 'claude' | 'auto';
  model: string;
  messages: Message[];
  stream: boolean;
  maxTokens?: number;
  temperature?: number;
}

// Server → Client
interface MCPResponse {
  id: string; // Matches request ID
  type: 'chunk' | 'done' | 'error';
  data?: string; // Content chunk
  usage?: TokenUsage; // Final usage stats
  error?: ErrorDetails;
}
```

**Connection Management**:

- [x] Handle client connect ✅
- [x] Authenticate with JWT ✅
- [x] Track active connections (Map) ✅
- [x] Handle client disconnect ✅
- [x] Clean up resources ✅
- [x] Implement reconnection logic ✅

**Heartbeat**:

```typescript
// Ping every 30 seconds
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
```

**Completion Notes**:

- Full WebSocket server implementation with authentication
- Connection service for managing active connections
- Credit service integration for pre-request validation
- Logging service for request tracking and analytics
- Health check and stats endpoints for monitoring
- Comprehensive error handling and structured logging
- Mock LLM processing (placeholder for actual AI integration)

---

#### E4.2: OpenAI Integration

**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-13
**Dependencies**: E4.1
**Risk Level**: Medium
**Assigned To**: Backend Team

**Acceptance Criteria**:

- [x] OpenAI SDK integration
- [x] Support for GPT-3.5, GPT-4
- [x] Streaming responses
- [x] Token usage tracking
- [x] Error handling (rate limits, timeouts)
- [x] Credit deduction per request

**Completion Notes**:

- Full OpenAI SDK integration completed with streaming support
- GPT-3.5 and GPT-4 models implemented
- Token usage tracking and credit deduction working
- Rate limiting and timeout handling implemented
- Comprehensive error handling for all failure scenarios
- Integration with MCP server foundation completed

**Implementation**:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function callOpenAI(request: MCPRequest): Promise<MCPResponse> {
  // Check user credits before making request
  await checkSufficientCredits(request.userId, estimateCredits(request));

  try {
    const stream = await openai.chat.completions.create({
      model: request.model,
      messages: request.messages,
      stream: true,
      max_tokens: request.maxTokens,
    });

    // Stream chunks back to client
    for await (const chunk of stream) {
      ws.send(
        JSON.stringify({
          id: request.id,
          type: 'chunk',
          data: chunk.choices[0]?.delta?.content,
        })
      );
    }

    // Deduct credits based on actual usage
    await deductCredits(request.userId, usage.totalTokens);
  } catch (error) {
    // Handle errors (rate limit, timeout, etc.)
  }
}
```

**Rate Limit Handling**:

- [ ] Detect 429 status code
- [ ] Implement exponential backoff
- [ ] Queue requests if rate limited
- [ ] Fallback to Claude if persistent

**Tasks**:

- [ ] Install OpenAI SDK
- [ ] Create OpenAI provider wrapper
- [ ] Implement streaming logic
- [ ] Add token counting
- [ ] Integrate credit deduction
- [ ] Add comprehensive error handling

---

#### E4.5: Sora2 Video Generator Integration

**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-13
**Dependencies**: E4.1, E4.2
**Risk Level**: Medium

**Acceptance Criteria**:

- [x] Sora2 Video API integration
- [x] Session-based authentication with verification codes
- [x] Google OAuth integration for Sora2
- [x] Credit management for video generation
- [x] Custom GPT integration for video workflows
- [x] Error handling for video generation failures

**Completion Notes**:

- Full Sora2 Video Generator integration completed
- Session-based authentication system implemented with verification codes
- Google OAuth integration with session parameters working
- Credit management APIs (check and deduct) implemented for video generation
- Custom GPT integration for video workflows completed
- Comprehensive error handling for all video generation scenarios
- Redis session storage implemented for OAuth tokens
- Atomic credit transactions for video generation

**Implementation Details**:

```typescript
// Sora2 Video Generation Endpoint
POST /api/sora2/generate
{
  "prompt": "A beautiful sunset over the ocean",
  "duration": 10,
  "resolution": "1080p"
}

// Session-based Authentication
GET /api/sora2/auth/session?code=verification_code
{
  "sessionToken": "session_token_here",
  "expiresAt": "2025-10-14T08:57:00Z"
}

// Credit Management for Video Generation
POST /api/credits/check
POST /api/credits/deduct
{
  "userId": "user_id",
  "credits": 5,
  "service": "sora2",
  "sessionId": "session_token_here"
}
```

**OAuth Flow with Verification Codes**:

1. User initiates video generation request
2. System generates verification code and stores in Redis
3. User authorizes via Google OAuth with verification code
4. System receives OAuth callback with verification code
5. System creates session token and stores in Redis
6. User can now generate videos using session token

**Security Measures**:

- [x] Verification codes expire after 15 minutes
- [x] Session tokens expire after 24 hours
- [x] All requests require valid session token
- [x] Credit deduction happens before video generation
- [x] Audit trail for all video generation requests

**Tests Completed**:

- [x] OAuth flow with verification codes
- [x] Session management in Redis
- [x] Credit check and deduction for video generation
- [x] Video generation with valid session
- [x] Error handling for expired sessions
- [x] Error handling for insufficient credits

---

#### E4.3: Claude Integration

**Story Points**: 5  
**Priority**: P1 (High)  
**Status**: Not Started  
**Dependencies**: E4.1, E4.2  
**Risk Level**: Medium

**Acceptance Criteria**:

- [ ] Anthropic SDK integration
- [ ] Support for Claude-3 models
- [ ] Unified interface with OpenAI
- [ ] Provider switching logic
- [ ] Load balancing between providers

**Provider Abstraction**:

```typescript
interface LLMProvider {
  execute(request: MCPRequest): Promise<MCPResponse>;
  estimateCredits(request: MCPRequest): number;
  checkAvailability(): Promise<boolean>;
}

class OpenAIProvider implements LLMProvider {
  // Implementation
}

class ClaudeProvider implements LLMProvider {
  // Implementation
}

// Provider selection
const providers = {
  openai: new OpenAIProvider(),
  claude: new ClaudeProvider(),
};

function selectProvider(request: MCPRequest): LLMProvider {
  if (request.provider && request.provider !== 'auto') {
    return providers[request.provider];
  }

  // Auto-select based on availability and load
  return selectBestProvider();
}
```

---

#### E4.4: MCP Authentication & Authorization

**Story Points**: 3  
**Priority**: P1 (High)  
**Status**: Not Started  
**Dependencies**: E4.1, E2.1  
**Risk Level**: Low

**Acceptance Criteria**:

- [ ] JWT validation for WebSocket connections
- [ ] User permission checking per request
- [ ] Credit validation before LLM calls
- [ ] Service access control by role
- [ ] Usage logging per user

**Pre-request Checks**:

```typescript
async function handleMCPRequest(ws: WebSocket, request: MCPRequest) {
  const user = ws.user; // From JWT validation

  // 1. Check user has permission to use service
  if (!(await hasPermission(user, 'services', 'use'))) {
    return sendError(ws, 'FORBIDDEN', 'No permission to use AI services');
  }

  // 2. Check sufficient credits
  const estimatedCredits = estimateCredits(request);
  const balance = await getCreditBalance(user.id);

  if (balance < estimatedCredits) {
    return sendError(ws, 'INSUFFICIENT_CREDITS', 'Not enough credits');
  }

  // 3. Check rate limits
  if (await isRateLimited(user.id)) {
    return sendError(ws, 'RATE_LIMIT_EXCEEDED', 'Too many requests');
  }

  // 4. Process request
  await processLLMRequest(ws, request);

  // 5. Log usage
  await logUsage(user.id, request, response);
}
```

---

### Epic 5: Frontend Development (Sprint 4-5)

#### E5.1: React App Setup

**Story Points**: 5
**Priority**: P1 (High)
**Status**: 🔄 In Progress (Started 2025-10-04)
**Dependencies**: None
**Risk Level**: Low

**Acceptance Criteria**:

- [x] React 18+ with TypeScript
- [x] Vite build tool configuration
- [ ] Material-UI component library
- [ ] Redux Toolkit state management
- [ ] React Router navigation
- [ ] Responsive layout foundation

**Current Progress**:

- ✅ Vite + React + TypeScript setup complete
- ✅ Development server running on port 5173
- ✅ API Gateway development server also running
- 🔄 Installing additional dependencies (MUI, Redux, etc.)

**Initial Setup**:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @mui/material @emotion/react @emotion/styled
npm install @reduxjs/toolkit react-redux
npm install react-router-dom
npm install react-hook-form zod @hookform/resolvers
```

**Project Structure**:

```
frontend/src/
├── components/
│   ├── common/          # Reusable components
│   ├── auth/            # Auth-related
│   └── layout/          # Layout components
├── pages/               # Route components
├── store/               # Redux store
├── services/            # API services
├── hooks/               # Custom hooks
├── utils/               # Utilities
├── types/               # TypeScript types
└── theme/               # MUI theme
```

**Theme Configuration**:

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
});
```

---

#### E5.2: Authentication UI

**Story Points**: 5  
**Priority**: P1 (High)  
**Status**: Not Started  
**Dependencies**: E2.1, E5.1

**Acceptance Criteria**:

- [ ] Login page with form validation
- [ ] Registration page
- [ ] Email verification UI
- [ ] Password reset flow
- [ ] Google OAuth button
- [ ] Protected route wrapper

**Components**:

```typescript
// Login Form
- [ ] Email and password fields
- [ ] Validation with react-hook-form + zod
- [ ] Remember me checkbox
- [ ] Forgot password link
- [ ] Loading states
- [ ] Error display

// Registration Form
- [ ] Email, password, confirm password
- [ ] Terms acceptance checkbox
- [ ] Validation rules
- [ ] Success message

// Protected Route
- [ ] Check authentication status
- [ ] Redirect to login if not authenticated
- [ ] Show loading while checking
```

---

#### E5.3: Dashboard UI

**Story Points**: 8  
**Priority**: P1 (High)  
**Status**: Not Started  
**Dependencies**: E5.1, E5.2

**Acceptance Criteria**:

- [ ] Dashboard layout with navigation
- [ ] Credit balance widget
- [ ] Usage statistics charts
- [ ] Available services grid
- [ ] Recent activity table

**Dashboard Widgets**:

- Credit Balance Card (real-time)
- Usage Chart (last 30 days)
- Quick Actions (Top-up, View History)
- Service Status Indicators
- Recent Transactions Table

---

#### E5.4: Admin Interface

**Story Points**: 8  
**Priority**: P2 (Medium)  
**Status**: Not Started  
**Dependencies**: E5.1, E2.3 (RBAC)

**Acceptance Criteria**:

- [ ] Admin dashboard with metrics
- [ ] User management table
- [ ] Credit management interface
- [ ] System monitoring panels
- [ ] Audit log viewer

---

### Epic 6: Testing & Deployment (Sprint 5)

#### E6.1: Testing Implementation

**Story Points**: 8  
**Priority**: P1 (High)  
**Status**: Not Started

**Acceptance Criteria**:

- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests for APIs
- [ ] E2E tests for critical flows
- [ ] Performance testing
- [ ] Security testing

**Testing Stack**:

- Jest for unit tests
- Supertest for API tests
- Cypress for E2E tests
- Artillery for load testing

---

#### E6.2: Production Deployment

**Story Points**: 5  
**Priority**: P0 (Critical)  
**Status**: Not Started

**Acceptance Criteria**:

- [ ] Production Docker configuration
- [ ] Environment variable management
- [ ] SSL automation
- [ ] Database migration automation
- [ ] Monitoring and alerting

---

## Sprint Planning

### Sprint 1 (Weeks 1-2): Foundation ✅ COMPLETE

**Goal**: Complete infrastructure and basic auth
**Story Points**: 24
**Status**: 100% Complete (24/24 points done)

**Completed**:

- ✅ E1.2: Database Setup (5 points)
- ✅ E1.3: Project Structure (3 points)
- ✅ E2.1: Basic Authentication API (8 points)
- ✅ E3.1: Credit Account System (5 points)
- ✅ Additional: JWT middleware & refresh tokens (3 points)

**Carry Over to Sprint 2**:

- E1.1: SSL Certificate setup (remaining work)
- E1.4: CI/CD Pipeline (new)
- E1.5: Logging Infrastructure (new)
- E2.4: Email Verification System (new)

**Retrospective Actions**:

1. ✅ Good: Schema alignment resolved quickly
2. ⚠️ Improvement: Need better task breakdown
3. 📝 Action: Add more detailed subtasks for complex stories

---

### Sprint 2 (Weeks 3-4): Authentication Complete + Observability

**Goal**: Complete auth system and add monitoring
**Story Points**: 21
**Status**: 100% Complete (21/21 points done)

**Completed Stories**:

1. ✅ E2.4: Email Verification System (5 points) - COMPLETED
2. ✅ E2.5: Password Reset Flow (3 points) - COMPLETED
3. ✅ E2.2: Google OAuth (5 points) - COMPLETED
4. ✅ E2.3: RBAC Implementation (5 points) - COMPLETED
5. ✅ E1.4: CI/CD Pipeline (3 points) - reduced scope

**Sprint Goals**:

- ✅ Email verification working
- ✅ Password reset flow implemented
- ✅ OAuth integration complete
- ✅ RBAC in place (completed)
- ⏳ CI/CD automated (pending)

**Risks Resolved**:

- ✅ Google OAuth completed on schedule
- ✅ SendGrid API key configured and working
- ✅ RBAC implementation completed with comprehensive testing

---

### Sprint 3 (Weeks 5-6): Credit System + MCP Foundation

**Goal**: Build credit management and start MCP
**Story Points**: 18
**Status**: 100% Complete (18/18 points done)
**Completed Date**: 2025-10-03

**Completed Stories**:

1. ✅ E3.1: Complete Credit APIs (2 points remaining) - COMPLETED
2. ✅ E3.4: Promotional Codes (5 points) - COMPLETED
3. ✅ E4.1: MCP Server Foundation (8 points) - COMPLETED
4. ⏳ E4.2: OpenAI Integration (3 points) - MOVED TO SPRINT 4

**Sprint Goals**:

- ✅ Credit balance API with caching
- ✅ Transaction history with pagination
- ✅ Promo code redemption system
- ✅ MCP WebSocket server with authentication
- ✅ Connection lifecycle management
- ⏳ OpenAI integration (moved to Sprint 4)

**Achievements**:

- Complete credit management system implemented
- Full MCP server foundation ready for AI provider integration
- Comprehensive error handling and logging
- Redis caching for performance optimization
- Atomic transactions for data consistency

---

### Sprint 4 (Weeks 7-8): MCP Complete + Payment (In Progress)

**Goal**: Complete LLM integration and payment
**Story Points**: 26
**Status**: In Progress (Started 2025-10-04)
**Sprint Dates**: Oct 4 - Oct 17, 2025

**Planned Stories**:

1. ✅ E4.2: OpenAI Integration (5 points) - COMPLETED
2. ✅ E4.5: Sora2 Video Generator Integration (5 points) - COMPLETED
3. 🔄 E4.3: Claude Integration (5 points) - IN PROGRESS
4. 🔄 E4.4: MCP Auth (3 points) - IN PROGRESS
5. ⏳ E3.2: Credit Top-up with Stripe (8 points) - NOT STARTED

**Current Focus**:

- Implementing Claude SDK integration
- Finalizing MCP authentication and authorization
- Planning Stripe payment integration

**Daily Progress Log**:

**2025-10-04 (Day 1)**:

- ✅ Frontend development server started (Vite + React)
- ✅ API Gateway development server running
- ✅ Reviewing MCP server foundation for OpenAI integration
- 🔄 Working on OpenAI SDK setup and configuration
- 📋 Next: Implement streaming response handler

**2025-10-05 to 2025-10-12**:

- ✅ OpenAI SDK integration completed
- ✅ Streaming response handling implemented
- ✅ Token counting and credit deduction working
- ✅ Error handling for rate limits implemented
- ✅ SORA2 Video Generator integration completed with session-based authentication
- ✅ Google OAuth with verification codes for Sora2 integration
- ✅ Credit management APIs for video generation
- 🔄 Started Claude SDK integration
- 🔄 Working on MCP authentication enhancements

**Blockers**: None
**Risks**: Claude API key configuration needed

**Tasks for Tomorrow (2025-10-14)**:

- Complete Claude SDK integration in MCP server
- Implement provider switching logic between OpenAI and Claude
- Finalize MCP authentication and authorization
- Begin Stripe payment integration planning

---

### Sprint 5 (Weeks 9-10): Frontend + Testing

**Goal**: Build UI and comprehensive tests  
**Story Points**: 21

**Planned Stories**:

1. E5.1: React App Setup (5 points)
2. E5.2: Auth UI (5 points)
3. E5.3: Dashboard UI (8 points)
4. E6.1: Testing Implementation (partial - 3 points)

---

## Technical Debt Register

| ID     | Description                              | Impact    | Effort | Priority | Target Sprint | Status         |
| ------ | ---------------------------------------- | --------- | ------ | -------- | ------------- | -------------- | ------- |
| TD-001 | Email verification not implemented       | High      | 5      | High     | Sprint 2      | ✅ Completed   |
| TD-002 | Password reset flow not implemented      | Medium    | 3      | High     | Sprint 2      | ✅ Completed   |
| TD-002 | SSL manual setup, need automation        | Medium    | 2      | Medium   | Sprint 2      | Not Started    |
| TD-003 | No code quality tools (ESLint, Prettier) | Medium    | 3      | Medium   | Sprint 2      | Not Started    |
| TD-004 | Rate limiting not implemented            | High      | 3      | High     | Sprint 3      | Not Started    |
| TD-005 | No monitoring/alerting                   | High      | 5      | High     | Sprint 3      | Not Started    |
| TD-006 | API documentation missing                | Medium    | 3      | Medium   | Sprint 4      | Not Started    |
| TD-008 | No E2E tests                             | High      | 8      | High     | Sprint 5      | Not Started    |
| TD-009 | JWT middleware implementation            | COMPLETED | High   | 3        | High          | Sprint 1       | ✅ Done |
| TD-010 | Refresh token mechanism                  | COMPLETED | High   | 2        | High          | Sprint 1       | ✅ Done |
| TD-011 | Token blacklist functionality            | COMPLETED | Medium | 2        | Medium        | Sprint 1       | ✅ Done |
| TD-007 | No E2E tests                             | High      | 8      | High     | Sprint 5      | Not Started    |
| TD-012 | Credit APIs not fully implemented        | High      | 2      | High     | Sprint 3      | ✅ Completed   |
| TD-013 | MCP Server not implemented               | High      | 8      | High     | Sprint 3      | ✅ Completed   |
| TD-014 | Promo code system not implemented        | Medium    | 5      | Medium   | Sprint 3      | ✅ Completed   |
| TD-015 | Frontend development not started         | High      | 5      | High     | Sprint 4      | ✅ Completed   |
| TD-016 | OpenAI integration not complete          | High      | 5      | High     | Sprint 4      | ✅ Completed   |
| TD-017 | Claude integration not started           | High      | 5      | High     | Sprint 4      | 🔄 In Progress |
| TD-018 | Sora2 Video Generator integration        | High      | 5      | High     | Sprint 4      | ✅ Completed   |

---

## Risk Register

| ID  | Risk                          | Probability | Impact   | Mitigation                               | Owner    | Status           |
| --- | ----------------------------- | ----------- | -------- | ---------------------------------------- | -------- | ---------------- |
| R-1 | OpenAI rate limits            | High        | High     | Multi-provider fallback, request queuing | Backend  | Planned Sprint 4 |
| R-2 | Database performance          | Medium      | High     | Read replicas, query optimization        | DevOps   | Monitor          |
| R-3 | Security breach               | Low         | Critical | Regular audits, automated scanning       | Security | Ongoing          |
| R-4 | Credit fraud                  | Medium      | High     | Fraud detection, limits                  | Product  | Planned Sprint 3 |
| R-5 | Stripe integration complexity | Medium      | Medium   | Follow documentation, test mode          | Backend  | Sprint 4         |
| R-6 | Team bandwidth                | Medium      | Medium   | Prioritize ruthlessly, defer Phase 2     | PM       | Ongoing          |

---

## Phase 2 & 3: High-Level Planning

### PHASE 2: Web-based Prompt Services (Sprint 6-9)

**Duration**: 6-8 weeks  
**Total Story Points**: 72 points

**Major Epics**:

- Prompt Template System (21 points)
- Advanced UI Features (26 points)
- API Enhancements (25 points)

**Key Features**: Template management, collaboration tools, API versioning, webhook system

---

### PHASE 3: Media Generation Services (Sprint 10-15)

**Duration**: 10-12 weeks  
**Total Story Points**: 98 points

**Major Epics**:

- Image Generation Integration (29 points)
- Video Generation (29 points)
- Advanced Media Features (21 points)
- Enterprise Features (19 points)

**Key Features**: Multi-provider image/video generation, content moderation, SSO, white-label
