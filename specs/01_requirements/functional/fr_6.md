# FR-6: API Standards

## Versioning
URL-based (e.g., `/api/v1/...`)

## Authentication
Bearer token (JWT)

## Rate Limiting
```
Guest: 10 requests/minute
User: 60 requests/minute
Manager: 120 requests/minute
Admin: No limit
```

## Error Response Format
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": {
      "field": "password",
      "attempts_remaining": 3
    },
    "timestamp": "2025-10-03T10:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

## Success Response Format
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-03T10:30:00Z",
    "request_id": "req_1234567890"
  }
}
```

## Pagination Standard
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}