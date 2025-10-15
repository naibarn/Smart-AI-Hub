# API Standards Implementation (FR-6)

This document summarizes the implementation of unified API standards across all services (auth-service, core-service, mcp-server) according to FR-6 specification.

## Overview

The API standards implementation ensures consistency across all services with:
- API versioning with `/api/v1/` prefix
- Standardized response formats for success, error, and pagination
- Role-based rate limiting
- Request ID tracking
- Backward compatibility with deprecation warnings

## Implementation Details

### 1. API Versioning

All endpoints now use the `/api/v1/` prefix for versioning:

#### Auth Service
- Old: `/auth/*` → New: `/api/v1/auth/*`
- Old: `/api/auth/*` → New: `/api/v1/auth/*` (with backward compatibility)

#### Core Service
- Old: `/users/*` → New: `/api/v1/users/*`
- Old: `/credits/*` → New: `/api/v1/credits/*`
- Old: `/payments/*` → New: `/api/v1/payments/*`

#### MCP Server
- Old: `/v1/*` → New: `/api/v1/*`

### 2. Standard Response Formats

#### Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2023-10-15T04:24:40.362Z",
    "request_id": "req_1697355980362_abc123def",
    "message": "Operation completed successfully" // Optional
  }
}
```

#### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }, // Optional additional details
    "timestamp": "2023-10-15T04:24:40.362Z",
    "request_id": "req_1697355980362_abc123def"
  }
}
```

#### Paginated Response
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "meta": {
    "timestamp": "2023-10-15T04:24:40.362Z",
    "request_id": "req_1697355980362_abc123def"
  }
}
```

### 3. Role-Based Rate Limiting

Rate limiting is implemented per role with the following limits:
- Guest: 10 requests per minute
- User: 60 requests per minute
- Manager: 120 requests per minute
- Admin: Unlimited requests

Rate limiting headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit window resets (UTC timestamp)

### 4. Request ID Tracking

All requests receive a unique request ID that is:
- Generated automatically if not provided
- Included in response headers as `X-Request-ID`
- Included in response body metadata
- Propagated through service calls for distributed tracing

### 5. Backward Compatibility

Legacy endpoints are maintained with deprecation warnings:
- `Deprecation: true` header
- `Sunset` header with deprecation date (3 months)
- `Link` header pointing to new endpoint

## Files Created/Updated

### Auth Service
- `src/utils/response.js` (CREATED) - Response utility functions
- `src/middleware/requestId.js` (CREATED) - Request ID middleware
- `src/middleware/rateLimiter.js` (UPDATED) - Role-based rate limiting
- `src/middleware/errorHandler.js` (UPDATED) - Standardized error handling
- `src/app.js` (UPDATED) - API versioning and middleware setup
- `src/controllers/*.js` (UPDATED) - All controllers updated to use response utilities

### Core Service
- `src/utils/response.ts` (CREATED) - TypeScript response utilities
- `src/utils/pagination.ts` (CREATED) - Pagination helper functions
- `src/middlewares/requestId.ts` (CREATED) - Request ID middleware
- `src/middlewares/rateLimiter.ts` (CREATED) - Role-based rate limiting
- `src/middlewares/errorHandler.middleware.ts` (UPDATED) - Standardized error handling
- `src/index.ts` (UPDATED) - API versioning and middleware setup
- `src/controllers/*.ts` (UPDATED) - All controllers updated to use response utilities

### MCP Server
- `src/index.ts` (UPDATED) - API versioning and response format
- `src/types/mcp.types.ts` (UPDATED) - Error details interface

## Testing

A test script (`test-api-standards.js`) is provided to validate the implementation:
- API versioning compliance
- Response format standards
- Request ID tracking
- Rate limiting headers
- Backward compatibility

Run tests with:
```bash
node test-api-standards.js
```

## Migration Guide

### For Frontend Developers

1. **Update Base URLs**
   ```javascript
   // Old
   const AUTH_BASE_URL = 'http://localhost:3001/api/auth';
   const CORE_BASE_URL = 'http://localhost:3002/users';
   
   // New
   const AUTH_BASE_URL = 'http://localhost:3001/api/v1/auth';
   const CORE_BASE_URL = 'http://localhost:3002/api/v1/users';
   ```

2. **Handle Response Format Changes**
   ```javascript
   // Old response handling
   if (response.data.success) {
     const data = response.data.data;
   }
   
   // New response handling
   if (response.data.data) {
     const data = response.data.data;
     const requestId = response.data.meta.request_id;
   }
   ```

3. **Error Handling**
   ```javascript
   // Old error handling
   if (response.data.error) {
     console.error(response.data.error.message);
   }
   
   // New error handling
   if (response.data.error) {
     console.error(response.data.error.code, response.data.error.message);
     const requestId = response.data.error.request_id;
   }
   ```

4. **Pagination**
   ```javascript
   // Old pagination
   const { users, pagination } = response.data.data;
   
   // New pagination
   const users = response.data.data;
   const { page, per_page, total, total_pages } = response.data.pagination;
   ```

5. **Request ID Tracking**
   ```javascript
   // Extract request ID from response
   const requestId = response.headers['x-request-id'] || response.data.meta.request_id;
   
   // Include request ID in support requests
   console.log(`Request failed. ID: ${requestId}`);
   ```

## Benefits

1. **Consistency**: All services follow the same API standards
2. **Debugging**: Request IDs enable easier tracing of issues
3. **Rate Limiting**: Fair usage based on user roles
4. **Backward Compatibility**: Smooth migration path for clients
5. **Pagination**: Consistent pagination across all list endpoints
6. **Error Handling**: Standardized error format with codes and details

## Future Considerations

1. **API Gateway**: Consider implementing an API gateway to handle versioning, rate limiting, and request ID generation centrally
2. **Monitoring**: Add metrics for rate limiting violations and API usage patterns
3. **Documentation**: Generate API documentation from the standardized response formats
4. **Testing**: Expand automated tests to cover all endpoints and edge cases
5. **Deprecation Timeline**: Monitor usage of deprecated endpoints and plan their removal