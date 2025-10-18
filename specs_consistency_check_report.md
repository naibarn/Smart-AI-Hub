# Specs Consistency Check Report

**Date**: 2025-10-13  
**Purpose**: Perform consistency check across the migrated specs for credit deduction rules and API endpoints

## Executive Summary

This report analyzes the consistency between different specification documents in the Smart AI Hub project, focusing on:

1. Credit deduction rules comparison
2. API endpoint consistency between auth service spec and architecture documentation

## 1. Credit Deduction Rules Analysis

### Issue: Missing Specification File

**Finding**: The file `/specs/01_requirements/functional/fr_3.1_credit_deduction_rules.md` referenced in the task does not exist in the repository.

**Impact**: Unable to perform direct comparison between the functional requirement document and PRD.md for credit deduction rules.

### Available Credit Information

**Source**: [`docs/prd.md`](docs/prd.md:179-186)

The PRD contains the following credit deduction rules:

```yaml
GPT-4: 10 credits per 1000 tokens
GPT-3.5: 1 credit per 1000 tokens
Claude-3: 8 credits per 1000 tokens
Image Generation: 50 credits per image
Video Generation: 200 credits per minute
Sora2 Video Generation: 30 credits per video
```

**Additional References**:

- [`specs/01_requirements/functional/fr_credit_03.md`](specs/01_requirements/functional/fr_3.md) and [`fr_credit_04.md`](specs/01_requirements/functional/fr_4.md) contain API specifications for credit checking and deduction but not the actual credit costs
- [`docs/architecture.md`](docs/architecture.md:2162) mentions credit calculation but doesn't specify values

### Recommendation

1. Create the missing `/specs/01_requirements/functional/fr_3.1_credit_deduction_rules.md` file with the credit deduction rules
2. Ensure the credit values in the new file match those in PRD.md
3. Consider adding credit cost information to the architecture documentation for completeness

## 2. API Endpoint Consistency Analysis

### Authentication Service Endpoints

**Source**: [`specs/02_architecture/services/auth_service.md`](specs/02_architecture/services/auth_service.md:52-69)

List of endpoints:

- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout (blacklist token)
- `POST /refresh` - Refresh access token
- `POST /verify-email` - Email verification
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password
- `GET /me` - Current user info
- `GET /oauth/google` - Google OAuth initiate
- `GET /oauth/google/callback` - Google OAuth callback
- `GET /oauth/sora2` - Sora2 OAuth initiate
- `GET /oauth/sora2/callback` - Sora2 OAuth callback
- `POST /oauth/session/verify` - Verify session code
- `POST /oauth/session/confirm` - Confirm session with parameters

### Authentication Flow in Architecture Documentation

**Source**: [`docs/architecture.md`](docs/architecture.md:2110-2139)

The Authentication Flow Diagram shows the following flow:

1. Client sends `POST /api/auth/login` to API Gateway
2. API Gateway forwards to Auth Service
3. Auth Service verifies password with database
4. Auth Service checks token blacklist in Redis
5. Auth Service generates JWT tokens
6. Auth Service stores refresh token in Redis
7. Auth Service returns JWT tokens

### Discrepancies Found

1. **Endpoint Path Prefix**:
   - In [`auth_service.md`](specs/02_architecture/services/auth_service.md): Endpoints are listed without `/api/auth` prefix
   - In [`architecture.md`](docs/architecture.md:2118): Shows `/api/auth/login` as the endpoint path
   - **Impact**: This is expected behavior as the API Gateway adds the prefix when routing

2. **Missing Endpoints in Flow Diagram**:
   - The Authentication Flow Diagram only shows the login flow
   - OAuth flows, registration, and password reset flows are not documented in the diagram
   - **Impact**: Incomplete documentation of authentication flows

### Routing Configuration Consistency

**Source**: [`docs/architecture.md`](docs/architecture.md:128-132)

The API Gateway routing rules show:

```
/api/auth/* → auth-service:3001
```

This confirms that the auth service endpoints should be accessed with the `/api/auth` prefix through the API Gateway.

## 3. Recommendations

### Immediate Actions

1. **Create Missing Specification File**:
   - Create `/specs/01_requirements/functional/fr_3.1_credit_deduction_rules.md`
   - Include the credit deduction rules from PRD.md
   - Ensure consistency with the values in PRD.md

2. **Update Authentication Flow Documentation**:
   - Add OAuth flows to the Authentication Flow Diagram in architecture.md
   - Document the registration and password reset flows
   - Ensure all endpoints from auth_service.md are represented in the flow diagrams

### Long-term Improvements

1. **Centralize Credit Cost Information**:
   - Consider creating a dedicated credit costs configuration file
   - Reference this file from both PRD and functional requirements
   - Ensure architecture documentation references these costs

2. **API Documentation Standardization**:
   - Establish a standard for documenting API endpoints
   - Ensure all API documentation includes the full path (with prefix)
   - Maintain consistency between service specs and architecture documentation

3. **Documentation Cross-References**:
   - Add cross-references between related documents
   - Include a mapping between functional requirements and implementation details

## 4. Conclusion

While the core functionality is consistent between the specification documents, there are some documentation gaps and inconsistencies that should be addressed:

1. The missing credit deduction rules specification file needs to be created
2. The authentication flow documentation should be expanded to cover all endpoints
3. Documentation standards should be established for consistency across the project

These improvements will enhance the clarity and maintainability of the project documentation.
