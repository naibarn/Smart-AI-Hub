# Kilo Code Prompt: Smart AI Hub - Verify and Implement Required Endpoints for Sora2 Integration

## Objective
Analyze the Smart AI Hub project to verify if all required endpoints for Sora2 Video Generator integration exist. If any endpoints are missing, implement them according to the specifications.

## Project Context
Smart AI Hub is a centralized authentication and credit management platform with the following architecture:
- **API Gateway** (Port 3000) - Routes requests, handles JWT authentication, rate limiting
- **Auth Service** (Port 3001) - User registration, login, JWT token issuance
- **Core Service** (Port 3002) - User management, RBAC, credit management
- **MCP Server** (Port 3003) - AI model integration via WebSocket

## Source Documents to Read
- Read `architecture.md` for system architecture
- Read `prd.md` for product requirements
- Read `backlog.md` for development tasks
- Analyze existing codebase structure

---

## Task 1: Verify Existing Endpoints

### Priority: Critical
**Action**: Analyze the codebase to check if these endpoints exist and work correctly

### Required Endpoints Checklist:

#### 1.1 Session Verification Endpoint
**Endpoint**: `GET /api/auth/verify-session`
**Location**: Should be in Auth Service or API Gateway
**Requirements**:
- Accept `X-Session-Token` header
- Verify session token validity
- Return user information: `{ user: { id, email, name } }`
- Handle errors: 401 (invalid/expired), 404 (not found)

**Check for**:
- Does this endpoint exist?
- Does it accept the correct header?
- Does it return the correct response format?
- Is session storage implemented (Redis/database)?

---

#### 1.2 Credit Check Endpoint
**Endpoint**: `POST /api/mcp/v1/credits/check`
**Location**: Should be in Core Service or MCP Server
**Requirements**:
- Accept `X-User-ID` header
- Accept request body: `{ service: string, cost: number }`
- Check if user has sufficient credits
- Return: `{ sufficient: boolean, balance: number }`
- Handle errors: 402 (insufficient), 404 (user not found)

**Check for**:
- Does this endpoint exist?
- Does it accept user ID from header?
- Does it check credits correctly?
- Is credit balance stored per user?

---

#### 1.3 Credit Deduction Endpoint
**Endpoint**: `POST /api/mcp/v1/credits/deduct`
**Location**: Should be in Core Service or MCP Server
**Requirements**:
- Accept `X-User-ID` header
- Accept request body: `{ service: string, cost: number, metadata: object }`
- Deduct credits from user balance
- Return: `{ status: "ok", new_balance: number, transaction_id: string }`
- Create transaction record for audit
- Handle errors: 402 (insufficient), 404 (user not found)

**Check for**:
- Does this endpoint exist?
- Does it deduct credits atomically?
- Does it create transaction records?
- Is there rollback mechanism for failures?

---

#### 1.4 Google OAuth Login Endpoint
**Endpoint**: `GET /auth/google`
**Location**: Should be in Auth Service
**Requirements**:
- Accept `?session=xxx&return_to=chatgpt` query parameters
- Redirect to Google OAuth
- Handle OAuth callback
- Create session mapping (session ID → user ID)
- Show success page with verification code
- Verification code format: `VERIFIED-{random_string}`

**Check for**:
- Does Google OAuth integration exist?
- Is session parameter handling implemented?
- Is there a success page?
- Does it generate verification codes?

---

## Task 2: Document Findings

### Priority: Critical
**Action**: Create a report of what exists and what's missing

**Create file**: `sora2-integration-status.md`

**Report Structure**:
```markdown
# Sora2 Integration Endpoints Status Report

## Summary
- Total Required Endpoints: 4
- Existing Endpoints: X
- Missing Endpoints: Y
- Partially Implemented: Z

## Detailed Status

### 1. Session Verification (GET /api/auth/verify-session)
**Status**: [EXISTS / MISSING / PARTIAL]
**Location**: [file path]
**Issues**: [list any issues found]
**Required Changes**: [list what needs to be added/fixed]

### 2. Credit Check (POST /api/mcp/v1/credits/check)
**Status**: [EXISTS / MISSING / PARTIAL]
**Location**: [file path]
**Issues**: [list any issues found]
**Required Changes**: [list what needs to be added/fixed]

### 3. Credit Deduction (POST /api/mcp/v1/credits/deduct)
**Status**: [EXISTS / MISSING / PARTIAL]
**Location**: [file path]
**Issues**: [list any issues found]
**Required Changes**: [list what needs to be added/fixed]

### 4. Google OAuth Login (GET /auth/google)
**Status**: [EXISTS / MISSING / PARTIAL]
**Location**: [file path]
**Issues**: [list any issues found]
**Required Changes**: [list what needs to be added/fixed]

## Recommendations
[List priority order for implementation]
```

---

## Task 3: Implement Missing Endpoints

### Priority: Critical
**Action**: Implement any missing or incomplete endpoints

### Implementation Guidelines:

#### 3.1 If Session Verification is Missing
**File**: Create or update in Auth Service (e.g., `services/auth/routes/session.js`)

**Implementation Requirements**:
- Create session storage (use Redis or database)
- Implement session creation on OAuth success
- Implement session verification endpoint
- Add session expiration (suggested: 7 days)
- Add session cleanup/revocation

**Example Structure**:
```javascript
// Session storage schema
{
  sessionToken: "VERIFIED-abc123xyz",
  userId: 123,
  email: "user@gmail.com",
  name: "User Name",
  createdAt: "2025-01-15T10:00:00Z",
  expiresAt: "2025-01-22T10:00:00Z"
}

// Endpoint
GET /api/auth/verify-session
Headers: X-Session-Token: VERIFIED-xxx
Response: { user: { id: 123, email: "...", name: "..." } }
```

---

#### 3.2 If Credit Check is Missing
**File**: Create or update in Core Service (e.g., `services/core/routes/credits.js`)

**Implementation Requirements**:
- Ensure user credit balance is stored in database
- Implement credit check logic
- Support different service types
- Return clear insufficient credit responses

**Example Structure**:
```javascript
// Credit balance schema
{
  userId: 123,
  balance: 150,
  currency: "credits",
  updatedAt: "2025-01-15T10:00:00Z"
}

// Endpoint
POST /api/mcp/v1/credits/check
Headers: X-User-ID: 123
Body: { service: "sora2-video-generation", cost: 30 }
Response: { sufficient: true, balance: 150 }
```

---

#### 3.3 If Credit Deduction is Missing
**File**: Create or update in Core Service (e.g., `services/core/routes/credits.js`)

**Implementation Requirements**:
- Implement atomic credit deduction
- Create transaction records
- Support metadata for audit trail
- Handle concurrent requests safely
- Implement rollback on failure

**Example Structure**:
```javascript
// Transaction schema
{
  id: "txn-456",
  userId: 123,
  service: "sora2-video-generation",
  amount: -30,
  balanceBefore: 150,
  balanceAfter: 120,
  metadata: { taskId: "...", prompt: "..." },
  createdAt: "2025-01-15T10:00:00Z"
}

// Endpoint
POST /api/mcp/v1/credits/deduct
Headers: X-User-ID: 123
Body: { service: "sora2-video-generation", cost: 30, metadata: {...} }
Response: { status: "ok", new_balance: 120, transaction_id: "txn-456" }
```

---

#### 3.4 If Google OAuth is Missing
**File**: Create or update in Auth Service (e.g., `services/auth/routes/oauth.js`)

**Implementation Requirements**:
- Install Google OAuth library (e.g., `passport-google-oauth20`)
- Configure Google OAuth credentials
- Implement OAuth flow
- Create session on successful authentication
- Generate verification code
- Create success page

**Example Flow**:
```javascript
// Step 1: Initiate OAuth
GET /auth/google?session=xxx&return_to=chatgpt
→ Redirect to Google

// Step 2: OAuth Callback
GET /auth/google/callback?code=...
→ Verify with Google
→ Get user info
→ Create session mapping
→ Redirect to success page

// Step 3: Success Page
Show: "Login สำเร็จ! รหัสยืนยันของคุณคือ: VERIFIED-abc123xyz"
Button: "คัดลอก"
```

**Success Page HTML**:
```html
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Login สำเร็จ - Smart AI Hub</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .code { font-size: 24px; font-weight: bold; color: #2563eb; padding: 20px; background: #f0f9ff; border-radius: 8px; margin: 20px 0; }
    button { padding: 12px 24px; font-size: 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>✅ Login สำเร็จ!</h1>
  <p>กรุณาคัดลอกรหัสนี้และส่งกลับไปที่ ChatGPT:</p>
  <div class="code" id="verificationCode">VERIFIED-{{code}}</div>
  <button onclick="copyCode()">📋 คัดลอกรหัส</button>
  <script>
    function copyCode() {
      const code = document.getElementById('verificationCode').textContent;
      navigator.clipboard.writeText(code);
      alert('คัดลอกรหัสเรียบร้อย!');
    }
  </script>
</body>
</html>
```

---

## Task 4: Add Tests

### Priority: High
**Action**: Create tests for all new/updated endpoints

**Test Files to Create**:
- `tests/auth/session-verification.test.js`
- `tests/core/credit-check.test.js`
- `tests/core/credit-deduction.test.js`
- `tests/auth/google-oauth.test.js`

**Test Coverage**:
- Success scenarios
- Error scenarios (401, 402, 404, 500)
- Concurrent request handling
- Session expiration
- Credit balance edge cases

---

## Task 5: Update Documentation

### Priority: Medium
**Action**: Update project documentation

**Files to Update**:
- `architecture.md` - Add new endpoints to API documentation
- `prd.md` - Add Sora2 integration features
- `README.md` - Add setup instructions for Google OAuth
- `.env.example` - Add required environment variables

**New Environment Variables**:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# Session Configuration
SESSION_SECRET=your-session-secret
SESSION_EXPIRY_DAYS=7

# Redis Configuration (for session storage)
REDIS_URL=redis://localhost:6379
```

---

## Task 6: Update API Gateway Routes

### Priority: High
**Action**: Ensure API Gateway routes requests correctly

**Routes to Add/Verify**:
```javascript
// In API Gateway (port 3000)
app.get('/api/auth/verify-session', proxy('http://localhost:3001'));
app.post('/api/mcp/v1/credits/check', proxy('http://localhost:3002'));
app.post('/api/mcp/v1/credits/deduct', proxy('http://localhost:3002'));
app.get('/auth/google', proxy('http://localhost:3001'));
app.get('/auth/google/callback', proxy('http://localhost:3001'));
```

---

## Success Criteria

### Functional Requirements
- [ ] All 4 required endpoints exist and work correctly
- [ ] Session verification returns correct user information
- [ ] Credit check accurately verifies user balance
- [ ] Credit deduction is atomic and creates transaction records
- [ ] Google OAuth flow works end-to-end
- [ ] Success page displays verification code correctly

### Technical Requirements
- [ ] Endpoints follow RESTful conventions
- [ ] Error handling is comprehensive
- [ ] Response formats match specifications
- [ ] Database schema supports all operations
- [ ] Tests cover all scenarios
- [ ] Documentation is complete

### Security Requirements
- [ ] Session tokens are securely generated and stored
- [ ] Google OAuth uses proper credentials
- [ ] Credit operations are atomic and prevent race conditions
- [ ] User data is properly validated
- [ ] Rate limiting is implemented

---

## Execution Instructions for Kilo Code

1. **Analyze the codebase** to find existing implementations
2. **Create status report** (`sora2-integration-status.md`)
3. **Implement missing endpoints** in priority order
4. **Add comprehensive tests** for all endpoints
5. **Update documentation** with new features
6. **Verify API Gateway routing** is correct
7. **Test end-to-end flow** from OAuth to credit deduction

## Output Format

After execution, provide:
1. **Status Report**: What exists, what's missing, what needs fixing
2. **Implementation Summary**: What was created/updated
3. **Test Results**: All tests passing
4. **Next Steps**: Any manual configuration needed (e.g., Google OAuth credentials)

---

## Notes

### Google OAuth Setup
To use Google OAuth, the Smart AI Hub owner needs to:
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy Client ID and Secret to `.env`

### Session Storage
Recommended to use Redis for session storage due to:
- Fast access
- Built-in expiration
- Easy to scale
- Simple key-value structure

### Credit System
Ensure the credit system supports:
- Multiple currencies/types
- Transaction history
- Refunds (if needed)
- Admin top-up interface
- Usage analytics

