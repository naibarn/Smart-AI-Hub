# Frontend Migration Guide: API Standards v1

This guide helps frontend developers migrate their applications to use the new API standards implemented across all services.

## Overview of Changes

The API has been updated with standardized response formats, versioning, and enhanced features. This guide will help you update your frontend code to work with the new API.

## 1. Base URL Updates

### Auth Service
```javascript
// Before
const AUTH_BASE_URL = 'http://localhost:3001/api/auth';
const AUTH_BASE_URL_ALT = 'http://localhost:3001/auth';

// After
const AUTH_BASE_URL = 'http://localhost:3001/api/v1/auth';
```

### Core Service
```javascript
// Before
const CORE_BASE_URL = 'http://localhost:3002/users';
const CREDITS_BASE_URL = 'http://localhost:3002/credits';
const PAYMENTS_BASE_URL = 'http://localhost:3002/payments';

// After
const CORE_BASE_URL = 'http://localhost:3002/api/v1/users';
const CREDITS_BASE_URL = 'http://localhost:3002/api/v1/credits';
const PAYMENTS_BASE_URL = 'http://localhost:3002/api/v1/payments';
```

### MCP Server
```javascript
// Before
const MCP_BASE_URL = 'http://localhost:3003/v1';

// After
const MCP_BASE_URL = 'http://localhost:3003/api/v1';
```

## 2. Response Format Changes

### Success Responses

#### Before
```javascript
// Old format
{
  "success": true,
  "data": { ... },
  "message": "Operation successful" // Optional
}
```

#### After
```javascript
// New format
{
  "data": { ... },
  "meta": {
    "timestamp": "2023-10-15T04:25:18.229Z",
    "request_id": "req_1697355980362_abc123def",
    "message": "Operation completed successfully" // Optional
  }
}
```

### Error Responses

#### Before
```javascript
// Old format
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE" // Sometimes present
  }
}
```

#### After
```javascript
// New format
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }, // Optional additional details
    "timestamp": "2023-10-15T04:25:18.229Z",
    "request_id": "req_1697355980362_abc123def"
  }
}
```

## 3. Code Migration Examples

### API Service Layer Updates

#### Authentication Service
```javascript
// Before
class AuthService {
  async login(email, password) {
    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        user: data.data.user,
        token: data.data.token,
        refreshToken: data.data.refreshToken
      };
    } else {
      throw new Error(data.error.message);
    }
  }
}

// After
class AuthService {
  async login(email, password) {
    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.data) {
      return {
        user: data.data.user,
        token: data.data.accessToken,
        refreshToken: data.data.refreshToken
      };
    } else {
      const error = data.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error' };
      throw new Error(`${error.code}: ${error.message}`);
    }
  }
}
```

#### User Service with Pagination
```javascript
// Before
class UserService {
  async getUsers(page = 1, limit = 20) {
    const response = await fetch(`${CORE_BASE_URL}?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        users: data.data.users,
        pagination: data.data.pagination
      };
    } else {
      throw new Error(data.error.message);
    }
  }
}

// After
class UserService {
  async getUsers(page = 1, perPage = 20) {
    const response = await fetch(`${CORE_BASE_URL}?page=${page}&per_page=${perPage}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    const data = await response.json();
    
    if (response.ok && data.data) {
      return {
        users: data.data,
        pagination: data.pagination
      };
    } else {
      const error = data.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error' };
      throw new Error(`${error.code}: ${error.message}`);
    }
  }
}
```

### Error Handling Updates

#### Global Error Handler
```javascript
// Before
function handleApiError(error) {
  if (error.response) {
    const { data } = error.response;
    if (data.error) {
      return data.error.message;
    }
  }
  return 'An unexpected error occurred';
}

// After
function handleApiError(error) {
  if (error.response) {
    const { data } = error.response;
    if (data.error) {
      // Store request ID for debugging
      const requestId = data.error.request_id;
      console.error(`API Error [${requestId}]:`, data.error);
      
      // Return user-friendly message
      return data.error.message;
    }
  }
  return 'An unexpected error occurred';
}
```

### Request ID Tracking

#### Adding Request ID to Logs
```javascript
// Create a wrapper for fetch that tracks request IDs
async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  
  // Extract request ID from headers or response body
  const requestId = response.headers.get('x-request-id') || 
                   data.meta?.request_id || 
                   data.error?.request_id;
  
  // Log request ID for debugging
  if (requestId) {
    console.log(`API Request [${requestId}]: ${options.method || 'GET'} ${url}`);
  }
  
  return { response, data, requestId };
}

// Usage
const { response, data, requestId } = await apiRequest(`${AUTH_BASE_URL}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

if (!response.ok) {
  // Include request ID in error reports
  reportError(`Login failed [${requestId}]`, data.error);
}
```

## 4. Component Updates

### React Example: User List Component
```jsx
// Before
function UserList() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getUsers(page);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of component
}

// After
function UserList() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestId, setRequestId] = useState(null);
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    setRequestId(null);
    
    try {
      const result = await userService.getUsers(page);
      setUsers(result.users);
      setPagination(result.pagination);
      setRequestId(result.requestId);
    } catch (err) {
      setError(err.message);
      // Store request ID for error reporting
      setRequestId(err.requestId);
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of component
}
```

## 5. Testing Updates

### Unit Test Example
```javascript
// Before
describe('AuthService', () => {
  it('should login successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      }
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    const result = await authService.login('test@example.com', 'password');
    
    expect(result.user).toEqual({ id: '1', email: 'test@example.com' });
    expect(result.token).toBe('mock-token');
  });
});

// After
describe('AuthService', () => {
  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token'
      },
      meta: {
        timestamp: '2023-10-15T04:25:18.229Z',
        request_id: 'req_1697355980362_abc123def'
      }
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    const result = await authService.login('test@example.com', 'password');
    
    expect(result.user).toEqual({ id: '1', email: 'test@example.com' });
    expect(result.token).toBe('mock-token');
  });
});
```

## 6. Migration Checklist

- [ ] Update all base URLs to include `/api/v1/` prefix
- [ ] Update response handling for success responses
- [ ] Update error handling for new error format
- [ ] Add request ID tracking for debugging
- [ ] Update pagination parameter names (`limit` → `per_page`)
- [ ] Update pagination response handling
- [ ] Add rate limiting error handling
- [ ] Update unit tests to match new response formats
- [ ] Test deprecation headers for legacy endpoints
- [ ] Update error reporting to include request IDs

## 7. Common Issues and Solutions

### Issue: Getting "success" field is undefined
**Solution**: Update your response handling to check for `data.data` instead of `data.success`.

### Issue: Pagination not working
**Solution**: Change `limit` parameter to `per_page` and update response handling to use `data.pagination` instead of `data.data.pagination`.

### Issue: Missing error details
**Solution**: Access error details from `data.error.details` (if available) and include the request ID in error reports.

### Issue: Rate limiting errors
**Solution**: Handle rate limiting errors (status 429) by displaying appropriate messages to users and implementing retry logic with exponential backoff.

## 8. Backward Compatibility

Legacy endpoints will continue to work with deprecation warnings:
- `Deprecation: true` header
- `Sunset` header with deprecation date
- `Link` header pointing to new endpoint

Monitor your console for deprecation warnings and plan to migrate before the sunset date.

## 9. Getting Help

If you encounter issues during migration:

1. Check the browser console for deprecation warnings
2. Include request IDs in bug reports
3. Refer to the [API Standards Implementation](./API_STANDARDS_IMPLEMENTATION.md) document
4. Run the test script to validate API compliance: `node test-api-standards.js`

## 10. Timeline

- **Immediate**: Start using new endpoints for new features
- **1 Week**: Update critical API calls to use new format
- **2 Weeks**: Complete migration of all API calls
- **1 Month**: Remove usage of legacy endpoints
- **3 Months**: Legacy endpoints will be sunset (removed)