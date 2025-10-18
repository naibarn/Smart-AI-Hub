# Kilo Code Prompt: Smart AI Hub - Update Documentation for Sora2 Integration

## Objective

Review and update the core documentation files (PRD, Architecture, Backlog) to reflect the newly implemented Sora2 Video Generator integration features, including Google OAuth session management, credit management APIs, and MCP server integration.

## Context

The Smart AI Hub has been enhanced with new features to support Sora2 Video Generator integration:

- Google OAuth with session-based authentication
- Session verification API
- Credit check and deduction APIs with user-specific operations
- Verification code system for Custom GPT integration

These features have been implemented but may not be fully documented in the core project files.

## Source Documents to Read and Analyze

### Primary Documents (to be updated):

1. **`docs\prd.md`** - Product Requirements Document
2. **`docs\architecture.md`** - System Architecture Document
3. **`docs\backlog.md`** - Development Backlog

### Reference Documents (implementation details):

4. **`docs\sora2-integration.md`** - Integration guide
5. **`sora2-integration-status.md`** - Status report
6. **`SORA2-INTEGRATION-COMPLETE.md`** - Completion summary

---

## Task 1: Analyze Current Documentation

### Priority: Critical

**Action**: Read and analyze the three core documents to identify gaps

### Analysis Checklist:

#### 1.1 Check PRD (prd.md)

**Look for**:

- [ ] Is Sora2 integration mentioned as a use case?
- [ ] Are session-based authentication requirements documented?
- [ ] Is Google OAuth with verification codes documented?
- [ ] Are credit management APIs (check/deduct with user ID) documented?
- [ ] Are Custom GPT integration requirements mentioned?
- [ ] Are new API endpoints listed in functional requirements?
- [ ] Are security requirements updated for session management?

#### 1.2 Check Architecture (architecture.md)

**Look for**:

- [ ] Is session storage (Redis) architecture documented?
- [ ] Are new API endpoints documented in API specifications?
- [ ] Is the OAuth flow with verification codes documented?
- [ ] Is the integration with external services (Sora2) documented?
- [ ] Are data models for sessions and transactions documented?
- [ ] Is the authentication flow diagram updated?
- [ ] Are deployment considerations for new features documented?

#### 1.3 Check Backlog (backlog.md)

**Look for**:

- [ ] Are Sora2 integration tasks marked as completed?
- [ ] Are new features added to the backlog?
- [ ] Are implementation tasks properly categorized?
- [ ] Is the status of OAuth enhancements updated?
- [ ] Are testing tasks for new features included?
- [ ] Are documentation tasks marked as done/pending?

---

## Task 2: Create Gap Analysis Report

### Priority: Critical

**Action**: Document what's missing in each file

**Create file**: `docs/documentation-gap-analysis.md`

**Report Structure**:

```markdown
# Documentation Gap Analysis - Sora2 Integration

## Executive Summary

- Documents Analyzed: 3 (PRD, Architecture, Backlog)
- Total Gaps Found: X
- Critical Gaps: Y
- Recommendations: Z

## PRD (prd.md) Gaps

### Missing Features

1. **Sora2 Integration Use Case**
   - Status: [MISSING / PARTIAL / COMPLETE]
   - Impact: High
   - Recommendation: Add section describing Sora2 as a key integration partner

2. **Session-Based Authentication**
   - Status: [MISSING / PARTIAL / COMPLETE]
   - Impact: High
   - Recommendation: Update authentication requirements

[... continue for all gaps ...]

## Architecture (architecture.md) Gaps

### Missing Components

1. **Session Storage Architecture**
   - Status: [MISSING / PARTIAL / COMPLETE]
   - Impact: High
   - Recommendation: Add Redis session storage to architecture diagram

[... continue for all gaps ...]

## Backlog (backlog.md) Gaps

### Missing Tasks

1. **Sora2 Integration Tasks**
   - Status: [MISSING / PARTIAL / COMPLETE]
   - Impact: Medium
   - Recommendation: Add completed tasks to Done section

[... continue for all gaps ...]

## Priority Recommendations

1. [Most critical update needed]
2. [Second priority]
3. [Third priority]
```

---

## Task 3: Update PRD (prd.md)

### Priority: Critical

**Action**: Add or update sections to reflect Sora2 integration features

### 3.1 Add Sora2 Integration Use Case

**Section to add/update**: "Use Cases" or "Integration Partners"

**Content to add**:

```markdown
### Use Case: AI Video Generation Integration (Sora2)

**Actor**: Third-party AI service (Sora2 Video Generator)

**Goal**: Enable external AI services to authenticate users and manage credits through Smart AI Hub

**Flow**:

1. User accesses Sora2 service via Custom GPT
2. Sora2 redirects user to Smart AI Hub for Google OAuth login
3. User authenticates with Google account
4. Smart AI Hub generates session token (verification code)
5. User provides verification code to Sora2 via Custom GPT
6. Sora2 verifies session token with Smart AI Hub
7. Smart AI Hub returns user identity
8. Sora2 checks user's credit balance before generating video
9. If sufficient credits, Sora2 generates video
10. Sora2 deducts credits from user's balance
11. Smart AI Hub records transaction for audit

**Benefits**:

- Centralized user authentication across multiple AI services
- Unified credit management system
- Secure session-based authentication without exposing API keys
- Seamless integration with conversational AI platforms (Custom GPT)
```

### 3.2 Update Authentication Requirements

**Section to update**: "Functional Requirements" → "Authentication"

**Content to add**:

```markdown
#### FR-AUTH-05: Session-Based Authentication

**Priority**: High
**Description**: Support session-based authentication for third-party integrations

**Requirements**:

- Generate secure session tokens (format: VERIFIED-{random_string})
- Store sessions in Redis with configurable expiration (default: 7 days)
- Provide API endpoint to verify session tokens
- Return user identity (ID, email, name) for valid sessions
- Support session revocation
- Handle session expiration gracefully

**Acceptance Criteria**:

- Session tokens are cryptographically secure
- Session verification responds within 100ms
- Expired sessions return 401 Unauthorized
- Invalid sessions return 404 Not Found
```

### 3.3 Add Credit Management API Requirements

**Section to update**: "Functional Requirements" → "Credit Management"

**Content to add**:

```markdown
#### FR-CREDIT-03: User-Specific Credit Check API

**Priority**: High
**Description**: Provide API for third-party services to check user credit balance

**Requirements**:

- Accept user ID via X-User-ID header
- Accept service name and cost in request body
- Return whether user has sufficient credits
- Return current credit balance
- Support different service types and costs
- Respond within 200ms

**API Specification**:
```

POST /api/mcp/v1/credits/check
Headers: X-User-ID: {user_id}
Body: { service: string, cost: number }
Response: { sufficient: boolean, balance: number }

```

**Acceptance Criteria**:
- Accurately checks user credit balance
- Returns 402 if insufficient credits
- Returns 404 if user not found
- Handles concurrent requests correctly

#### FR-CREDIT-04: User-Specific Credit Deduction API
**Priority**: High
**Description**: Provide API for third-party services to deduct credits from user balance

**Requirements**:
- Accept user ID via X-User-ID header
- Accept service name, cost, and metadata in request body
- Atomically deduct credits from user balance
- Create transaction record with metadata
- Return new balance and transaction ID
- Support rollback on failure

**API Specification**:
```

POST /api/mcp/v1/credits/deduct
Headers: X-User-ID: {user_id}
Body: { service: string, cost: number, metadata: object }
Response: { status: "ok", new_balance: number, transaction_id: string }

```

**Acceptance Criteria**:
- Deduction is atomic (no race conditions)
- Transaction record is created
- Returns 402 if insufficient credits
- Supports concurrent deductions safely
```

### 3.4 Add OAuth Enhancement Requirements

**Section to update**: "Functional Requirements" → "Authentication"

**Content to add**:

```markdown
#### FR-AUTH-06: OAuth with Verification Codes

**Priority**: High
**Description**: Support OAuth flow with verification codes for Custom GPT integration

**Requirements**:

- Accept session parameter in OAuth initiation URL
- Generate verification code on successful authentication
- Display verification code on success page
- Map verification code to user session
- Support "return_to" parameter for different integration types
- Maintain backward compatibility with traditional OAuth flow

**Flow**:

1. Third-party service generates unique session ID
2. User is redirected to /auth/google?session={id}&return_to=chatgpt
3. User authenticates with Google
4. System generates verification code (VERIFIED-{random})
5. Success page displays verification code with copy button
6. User copies code and provides to third-party service
7. Third-party service uses code as session token

**Acceptance Criteria**:

- Verification codes are unique and secure
- Success page is user-friendly with Thai language
- Copy button works on all major browsers
- Session mapping is created correctly
- Traditional OAuth flow still works
```

### 3.5 Update Non-Functional Requirements

**Section to update**: "Non-Functional Requirements" → "Security"

**Content to add**:

```markdown
#### NFR-SEC-04: Session Security

**Priority**: High
**Requirements**:

- Session tokens must be cryptographically random (minimum 128-bit entropy)
- Sessions must expire after configurable period (default: 7 days)
- Session storage must be secure (Redis with authentication)
- Session verification must validate expiration
- Support session revocation for security incidents
- Log all session creation and verification events

#### NFR-SEC-05: Credit Transaction Integrity

**Priority**: Critical
**Requirements**:

- Credit deductions must be atomic
- Prevent double-spending through database transactions
- Create audit trail for all credit operations
- Support transaction rollback on failure
- Log all credit operations with user ID and metadata
```

---

## Task 4: Update Architecture (architecture.md)

### Priority: Critical

**Action**: Update architecture documentation to reflect new components and flows

### 4.1 Add Session Storage Component

**Section to update**: "System Components" or "Data Storage"

**Content to add**:

````markdown
### Session Storage (Redis)

**Purpose**: Store user sessions for third-party integrations

**Technology**: Redis 7.x

**Schema**:

```javascript
// Key format: session:{token}
{
  "sessionToken": "VERIFIED-abc123xyz",
  "userId": 123,
  "email": "user@gmail.com",
  "name": "User Name",
  "provider": "google",
  "createdAt": "2025-01-15T10:00:00Z",
  "expiresAt": "2025-01-22T10:00:00Z",
  "metadata": {
    "ip": "1.2.3.4",
    "userAgent": "Mozilla/5.0...",
    "returnTo": "chatgpt"
  }
}
```
````

**Operations**:

- SET session:{token} {data} EX {ttl}
- GET session:{token}
- DEL session:{token}
- TTL session:{token}

**Configuration**:

- Default TTL: 7 days (604800 seconds)
- Max sessions per user: 10
- Cleanup: Automatic via Redis expiration

````

### 4.2 Update API Endpoints Documentation

**Section to update**: "API Specifications" or "Endpoints"

**Content to add**:
```markdown
### Authentication Service APIs

#### Session Verification
````

GET /api/auth/verify-session
Headers:
X-Session-Token: VERIFIED-{token}
Response 200:
{
"user": {
"id": 123,
"email": "user@gmail.com",
"name": "User Name"
},
"expiresAt": "2025-01-22T10:00:00Z"
}
Response 401: { "error": "Session expired" }
Response 404: { "error": "Session not found" }

```

#### OAuth with Verification Code
```

GET /api/auth/google?session={id}&return_to={type}
Parameters:
session: Unique session identifier from third-party
return_to: Integration type (e.g., "chatgpt", "api")
Response: Redirect to Google OAuth
Callback: /api/auth/google/callback
Success: Display verification code page

```

### Core Service APIs

#### Credit Check
```

POST /api/mcp/v1/credits/check
Headers:
X-User-ID: {user_id}
Content-Type: application/json
Body:
{
"service": "sora2-video-generation",
"cost": 30
}
Response 200:
{
"sufficient": true,
"balance": 150,
"userId": 123
}
Response 402:
{
"sufficient": false,
"balance": 20,
"required": 30,
"userId": 123
}

```

#### Credit Deduction
```

POST /api/mcp/v1/credits/deduct
Headers:
X-User-ID: {user_id}
Content-Type: application/json
Body:
{
"service": "sora2-video-generation",
"cost": 30,
"metadata": {
"taskId": "task-123",
"prompt": "sunset over ocean",
"aspectRatio": "16:9"
}
}
Response 200:
{
"status": "ok",
"new_balance": 120,
"transaction_id": "txn-456",
"userId": 123
}
Response 402:
{
"error": "Insufficient credits",
"balance": 20,
"required": 30
}

```

```

### 4.3 Add Integration Architecture Diagram

**Section to add**: "Integration Architecture" or "External Integrations"

**Content to add**:

```markdown
### Sora2 Video Generator Integration

**Architecture Overview**:
```

┌─────────────────────────────────────────────────────────────┐
│ User via Custom GPT (ChatGPT) │
└─────────────────────────────────────────────────────────────┘
↓
┌─────────────────┴─────────────────┐
│ │
↓ (1) Login Request ↓ (5) API Calls
┌──────────────────┐ ┌──────────────────┐
│ Smart AI Hub │ │ Sora2 Backend │
│ OAuth Flow │ │ │
└──────────────────┘ └──────────────────┘
↓ ↓
(2) Google OAuth (6) Session Verification
↓ ↓
┌──────────────────┐ ┌──────────────────┐
│ Google │ │ Smart AI Hub │
│ Authentication │ │ Auth Service │
└──────────────────┘ └──────────────────┘
↓ ↓
(3) Verification Code (7) Credit Check/Deduct
↓ ↓
┌──────────────────┐ ┌──────────────────┐
│ User copies code │ │ Smart AI Hub │
│ to Custom GPT │ │ Core Service │
└──────────────────┘ └──────────────────┘
↓ ↓
(4) Code to Sora2 (8) Video Generation
↓
┌──────────────────┐
│ kie.ai API │
│ (External) │
└──────────────────┘

```

**Data Flow**:

1. **Authentication Flow**:
   - User initiates video generation via Custom GPT
   - Sora2 detects no session, provides login link
   - User clicks link → Smart AI Hub OAuth page
   - User authenticates with Google
   - Smart AI Hub creates session and displays verification code
   - User copies code back to Custom GPT
   - Sora2 stores code as session token

2. **Session Verification Flow**:
   - Sora2 receives API request with X-Session-Token header
   - Sora2 calls Smart AI Hub: GET /api/auth/verify-session
   - Smart AI Hub validates token and returns user info
   - Sora2 proceeds with authenticated user context

3. **Credit Management Flow**:
   - Sora2 calls Smart AI Hub: POST /api/mcp/v1/credits/check
   - Smart AI Hub checks user's credit balance
   - If sufficient, Sora2 proceeds with video generation
   - After successful generation, Sora2 calls: POST /api/mcp/v1/credits/deduct
   - Smart AI Hub deducts credits and creates transaction record

**Security Considerations**:
- Session tokens are single-use for initial verification
- All API calls use HTTPS
- User ID is verified on every credit operation
- Transactions are atomic to prevent race conditions
- Audit trail maintained for all credit operations
```

### 4.4 Update Database Schema

**Section to update**: "Database Schema" or "Data Models"

**Content to add**:

```markdown
### Sessions Table (Redis - for reference)

While sessions are stored in Redis, the logical
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)
```
