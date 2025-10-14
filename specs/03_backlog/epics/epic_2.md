# Epic 2: Authentication System (Sprint 1-2)

## E2.1: Basic Authentication API

**Story Points**: 8
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E1.2 (completed), E1.3 (completed)
**Risk Level**: Medium
- **links_to_architecture**:
  - Service: `../../02_architecture/services/auth_service.md`
  - Data Models: `../../02_architecture/data_models/user.md`

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

## E2.4: Email Verification System

**Story Points**: 5
**Priority**: P0 (Critical)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.1 (completed)
**Risk Level**: Medium
- **links_to_architecture**:
  - Service: `../../02_architecture/services/auth_service.md`
  - Data Models: `../../02_architecture/data_models/user.md`

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

## E2.5: Password Reset Flow

**Story Points**: 3
**Priority**: P1 (High)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.4 (Email Verification)
**Risk Level**: Low
- **links_to_architecture**:
  - Service: `../../02_architecture/services/auth_service.md`
  - Data Models: `../../02_architecture/data_models/user.md`

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

## E2.2: Google OAuth Integration

**Story Points**: 5
**Priority**: P1 (High)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.1
**Risk Level**: Medium
**Blocks**: None
- **links_to_architecture**:
  - Service: `../../02_architecture/services/auth_service.md`
  - Data Models: `../../02_architecture/data_models/user.md`

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

## E2.3: Role-Based Access Control (RBAC)

**Story Points**: 5
**Priority**: P1 (High)
**Status**: ✅ COMPLETED
**Completed Date**: 2025-10-03
**Dependencies**: E2.1
**Risk Level**: Low
- **links_to_architecture**:
  - Service: `../../02_architecture/services/core_service.md`, `../../02_architecture/services/auth_service.md`
  - Data Models: `../../02_architecture/data_models/user.md`, `../../02_architecture/data_models/role.md`, `../../02_architecture/data_models/permission.md`, `../../02_architecture/data_models/user_role.md`, `../../02_architecture/data_models/role_permission.md`

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