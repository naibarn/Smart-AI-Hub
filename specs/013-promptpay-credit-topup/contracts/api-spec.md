# API Specification - PromptPay Credit Top-up

## Base URL

```
Production: https://api.smartaihub.com/v1
Staging:    https://api-staging.smartaihub.com/v1
Local:      http://localhost:3000/v1
```

## Authentication

All endpoints require JWT Bearer token except where noted.

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Admin endpoints additionally require admin role verification.

---

## Endpoints

### 1. List Credit Packages

Get all available credit packages for purchase.

**Endpoint:** `GET /credits/packages`  
**Auth Required:** Yes  
**Rate Limit:** 100 requests/minute

#### Request

```bash
curl -X GET https://api.smartaihub.com/v1/credits/packages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response 200 OK

```json
{
  "packages": [
    {
      "id": "pkg_100_credits",
      "name": "Starter Pack",
      "credits": 100,
      "price_thb": 199.0,
      "bonus_credits": 0,
      "discount_percent": 0,
      "is_popular": false,
      "display_order": 1
    },
    {
      "id": "pkg_500_credits",
      "name": "Popular Pack",
      "credits": 500,
      "price_thb": 899.0,
      "bonus_credits": 50,
      "discount_percent": 10,
      "is_popular": true,
      "display_order": 2
    },
    {
      "id": "pkg_1000_credits",
      "name": "Pro Pack",
      "credits": 1000,
      "price_thb": 1699.0,
      "bonus_credits": 150,
      "discount_percent": 15,
      "is_popular": false,
      "display_order": 3
    }
  ]
}
```

---

### 2. Initiate Purchase

Create a new credit purchase transaction and receive PromptPay QR code.

**Endpoint:** `POST /credits/purchase/initiate`  
**Auth Required:** Yes  
**Rate Limit:** 5 requests/hour per user

#### Request

```bash
curl -X POST https://api.smartaihub.com/v1/credits/purchase/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": "pkg_100_credits"
  }'
```

#### Request Body

| Field      | Type   | Required | Description                       |
| ---------- | ------ | -------- | --------------------------------- |
| package_id | string | Yes      | Package ID from /credits/packages |

#### Response 200 OK

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "qr_code_data": "00020101021129370016A000000677010111011300669812345678530376454041000.005802TH5913Smart AI Hub6304XXXX",
  "qr_code_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "promptpay_id": "081-234-5678",
  "amount_thb": 199.0,
  "reference": "TXN-20250118-A7K9M",
  "expires_at": "2025-01-18T14:30:00Z",
  "instructions": {
    "steps": [
      "Scan QR code with your mobile banking app (Kbank, SCB, BBL, etc.)",
      "Verify amount is exactly 199.00 THB",
      "Complete transfer and save payment slip screenshot",
      "Upload slip on this page within 24 hours"
    ],
    "warnings": ["Do not edit slip image", "Upload original screenshot only"]
  }
}
```

#### Error Responses

**400 Bad Request - Invalid Package**

```json
{
  "error": {
    "code": "INVALID_PACKAGE",
    "message": "Package not found or inactive"
  }
}
```

**429 Too Many Requests**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many purchase initiations. Try again in 45 minutes."
  }
}
```

---

### 3. Upload Payment Slip

Upload payment slip image for AI verification.

**Endpoint:** `POST /credits/purchase/upload-slip`  
**Auth Required:** Yes  
**Rate Limit:** 3 uploads per transaction  
**Max File Size:** 10 MB

#### Request

```bash
curl -X POST https://api.smartaihub.com/v1/credits/purchase/upload-slip \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "transaction_id=TXN-20250118-A7K9M" \
  -F "slip_image=@/path/to/slip.jpg"
```

#### Request Body (multipart/form-data)

| Field          | Type   | Required | Description                        |
| -------------- | ------ | -------- | ---------------------------------- |
| transaction_id | string | Yes      | Transaction ID from initiate       |
| slip_image     | file   | Yes      | Image file (JPG/PNG/PDF, max 10MB) |

#### Response 200 OK (Immediate Approval)

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "status": "approved",
  "verification_details": {
    "recipient_valid": true,
    "recipient_confidence": 98.5,
    "amount_valid": true,
    "amount_confidence": 96.2,
    "authenticity_score": 97.8,
    "duplicate_check_passed": true,
    "overall_confidence": 97.5
  },
  "credits_added": 100,
  "message": "Payment verified successfully. Credits added to your account.",
  "estimated_review_time": null
}
```

#### Response 200 OK (Manual Review Needed)

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "status": "manual_review",
  "verification_details": {
    "recipient_valid": true,
    "recipient_confidence": 92.0,
    "amount_valid": true,
    "amount_confidence": 88.5,
    "authenticity_score": 85.0,
    "duplicate_check_passed": true,
    "overall_confidence": 88.5
  },
  "credits_added": null,
  "message": "Your payment slip is being reviewed by our team. You will be notified soon.",
  "estimated_review_time": "Within 2 hours"
}
```

#### Response 200 OK (Rejected)

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "status": "rejected",
  "verification_details": {
    "recipient_valid": false,
    "recipient_confidence": 95.0,
    "amount_valid": true,
    "amount_confidence": 92.0,
    "authenticity_score": 88.0,
    "duplicate_check_passed": true,
    "overall_confidence": 0
  },
  "credits_added": null,
  "message": "Payment verification failed: Wrong recipient. Please ensure you transferred to our PromptPay account.",
  "estimated_review_time": null
}
```

#### Error Responses

**400 Bad Request - File Too Large**

```json
{
  "error": {
    "code": "SLIP_001",
    "message": "File too large. Maximum size is 10MB. Please compress or crop your image."
  }
}
```

**400 Bad Request - Invalid Format**

```json
{
  "error": {
    "code": "SLIP_002",
    "message": "Invalid file format. Please upload JPG, PNG or PDF only."
  }
}
```

**400 Bad Request - Corrupted File**

```json
{
  "error": {
    "code": "SLIP_003",
    "message": "File appears corrupted. Please re-screenshot your payment slip."
  }
}
```

**400 Bad Request - Duplicate Slip**

```json
{
  "error": {
    "code": "SLIP_006",
    "message": "This payment slip has already been used. Previously used on: January 15, 2025 at 2:30 PM."
  }
}
```

**404 Not Found**

```json
{
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction not found or expired"
  }
}
```

**409 Conflict**

```json
{
  "error": {
    "code": "SLIP_ALREADY_UPLOADED",
    "message": "A slip has already been uploaded for this transaction. Maximum 3 uploads allowed."
  }
}
```

---

### 4. Check Transaction Status

Poll the verification status of a transaction.

**Endpoint:** `GET /credits/purchase/{transaction_id}/status`  
**Auth Required:** Yes  
**Rate Limit:** 20 requests/minute (poll every 3 seconds max)

#### Request

```bash
curl -X GET https://api.smartaihub.com/v1/credits/purchase/TXN-20250118-A7K9M/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response 200 OK - Pending Payment

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "status": "pending_payment",
  "created_at": "2025-01-18T14:00:00Z",
  "updated_at": "2025-01-18T14:00:00Z",
  "expires_at": "2025-01-18T14:30:00Z",
  "verification_details": null,
  "rejection_reason": null
}
```

#### Response 200 OK - Verifying

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "status": "verifying",
  "created_at": "2025-01-18T14:00:00Z",
  "updated_at": "2025-01-18T14:05:00Z",
  "expires_at": "2025-01-19T14:00:00Z",
  "verification_details": null,
  "rejection_reason": null
}
```

#### Response 200 OK - Approved

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "status": "approved",
  "created_at": "2025-01-18T14:00:00Z",
  "updated_at": "2025-01-18T14:05:30Z",
  "expires_at": null,
  "verification_details": {
    "recipient_valid": true,
    "recipient_confidence": 98.5,
    "amount_valid": true,
    "amount_confidence": 96.2,
    "authenticity_score": 97.8,
    "duplicate_check_passed": true,
    "overall_confidence": 97.5
  },
  "rejection_reason": null
}
```

#### Response 200 OK - Rejected

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "status": "rejected",
  "created_at": "2025-01-18T14:00:00Z",
  "updated_at": "2025-01-18T14:05:45Z",
  "expires_at": null,
  "verification_details": {
    "recipient_valid": false,
    "overall_confidence": 0
  },
  "rejection_reason": "Wrong recipient PromptPay ID"
}
```

---

### 5. Get Manual Review Queue (Admin Only)

Retrieve list of transactions flagged for manual review.

**Endpoint:** `GET /admin/credits/review-queue`  
**Auth Required:** Yes (Admin role)  
**Rate Limit:** None

#### Request

```bash
curl -X GET "https://api.smartaihub.com/v1/admin/credits/review-queue?status=pending&limit=20" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Query Parameters

| Parameter | Type    | Default | Description                            |
| --------- | ------- | ------- | -------------------------------------- |
| status    | string  | pending | Filter by: pending, approved, rejected |
| limit     | integer | 20      | Items per page (1-100)                 |
| offset    | integer | 0       | Pagination offset                      |

#### Response 200 OK

```json
{
  "items": [
    {
      "transaction_id": "TXN-20250118-A7K9M",
      "user_email": "user@example.com",
      "amount_thb": 249.0,
      "flagged_at": "2025-01-18T14:05:30Z",
      "flag_reason": "Low authenticity score (85%)",
      "confidence_scores": {
        "recipient": 98.5,
        "amount": 96.0,
        "authenticity": 85.0
      },
      "slip_url": "https://api.smartaihub.com/v1/admin/slips/TXN-20250118-A7K9M"
    },
    {
      "transaction_id": "TXN-20250118-B2C3D",
      "user_email": "user2@example.com",
      "amount_thb": 499.0,
      "flagged_at": "2025-01-18T13:45:20Z",
      "flag_reason": "Blurry amount (82% confidence)",
      "confidence_scores": {
        "recipient": 95.0,
        "amount": 82.0,
        "authenticity": 92.0
      },
      "slip_url": "https://api.smartaihub.com/v1/admin/slips/TXN-20250118-B2C3D"
    }
  ],
  "total": 2,
  "limit": 20,
  "offset": 0
}
```

---

### 6. Submit Manual Review Decision (Admin Only)

Approve, reject, or request more information for a flagged transaction.

**Endpoint:** `POST /admin/credits/review/{transaction_id}`  
**Auth Required:** Yes (Admin role)  
**Rate Limit:** None

#### Request - Approve

```bash
curl -X POST https://api.smartaihub.com/v1/admin/credits/review/TXN-20250118-A7K9M \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "approve",
    "notes": "Verified slip manually. Authenticity confirmed despite low AI score."
  }'
```

#### Request - Reject

```bash
curl -X POST https://api.smartaihub.com/v1/admin/credits/review/TXN-20250118-A7K9M \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "reject",
    "reason": "Slip appears to be edited",
    "notes": "Amount section shows signs of manipulation"
  }'
```

#### Request Body

| Field    | Type   | Required    | Description                      |
| -------- | ------ | ----------- | -------------------------------- |
| decision | string | Yes         | approve, reject, or request_info |
| reason   | string | Conditional | Required if decision is reject   |
| notes    | string | No          | Additional notes                 |

#### Response 200 OK

```json
{
  "transaction_id": "TXN-20250118-A7K9M",
  "decision": "approve",
  "reviewed_by": "admin@smartaihub.com",
  "reviewed_at": "2025-01-18T15:30:00Z",
  "status": "approved"
}
```

#### Error Responses

**400 Bad Request**

```json
{
  "error": {
    "code": "INVALID_DECISION",
    "message": "Reason is required when decision is reject"
  }
}
```

**403 Forbidden**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required to access this endpoint"
  }
}
```

---

## Error Codes Reference

### File Upload Errors (SLIP_XXX)

| Code     | HTTP | Message                   | Action                   |
| -------- | ---- | ------------------------- | ------------------------ |
| SLIP_001 | 400  | File too large (max 10MB) | Compress image           |
| SLIP_002 | 400  | Invalid file format       | Upload JPG/PNG/PDF       |
| SLIP_003 | 400  | File corrupted            | Re-screenshot slip       |
| SLIP_004 | 400  | Wrong recipient           | Verify PromptPay ID      |
| SLIP_005 | 400  | Insufficient amount       | Pay correct amount       |
| SLIP_006 | 409  | Duplicate slip            | Cannot reuse slip        |
| SLIP_007 | 410  | Transaction expired       | Create new transaction   |
| SLIP_008 | 400  | Fake slip detected        | Upload authentic slip    |
| SLIP_009 | 400  | QR code invalid           | Ensure slip has valid QR |
| SLIP_010 | 400  | Cannot extract data       | Upload clearer image     |
| SLIP_011 | 400  | Slip too old (>24h)       | Upload recent slip       |
| SLIP_012 | 429  | Rate limit exceeded       | Wait before retry        |

### General Errors

| Code                | HTTP | Message                  |
| ------------------- | ---- | ------------------------ |
| UNAUTHORIZED        | 401  | Missing or invalid token |
| FORBIDDEN           | 403  | Insufficient permissions |
| NOT_FOUND           | 404  | Resource not found       |
| RATE_LIMIT_EXCEEDED | 429  | Too many requests        |
| INTERNAL_ERROR      | 500  | Server error             |

---

## Rate Limits

| Endpoint                           | Limit     | Window          |
| ---------------------------------- | --------- | --------------- |
| GET /credits/packages              | 100       | 1 minute        |
| POST /credits/purchase/initiate    | 5         | 1 hour          |
| POST /credits/purchase/upload-slip | 3         | Per transaction |
| GET /credits/purchase/{id}/status  | 20        | 1 minute        |
| Admin endpoints                    | Unlimited | -               |

**Rate limit headers:**

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1705579200
```

---

## Webhooks (Future)

_Not yet implemented in Phase 1_

Future webhook events:

- `transaction.approved` - When payment verified
- `transaction.rejected` - When payment rejected
- `transaction.manual_review` - When flagged for review
- `transaction.expired` - When transaction expires

---

## Testing

### Test Environment

**Staging API:** `https://api-staging.smartaihub.com/v1`

### Test Accounts

Contact dev team for test credentials.

### Mock PromptPay QR

For testing without real payment:

```json
{
  "package_id": "pkg_test_mock"
}
```

This will create a test transaction that auto-approves any uploaded image.

---

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @smartaihub/sdk
```

```javascript
import { SmartAIHub } from '@smartaihub/sdk';

const client = new SmartAIHub({ apiKey: 'YOUR_JWT_TOKEN' });

// Initiate purchase
const transaction = await client.credits.initiate('pkg_100_credits');

// Upload slip
const result = await client.credits.uploadSlip(transaction.transaction_id, slipFile);
```

### Python

```bash
pip install smartaihub
```

```python
from smartaihub import Client

client = Client(api_key='YOUR_JWT_TOKEN')

# Initiate purchase
transaction = client.credits.initiate('pkg_100_credits')

# Upload slip
result = client.credits.upload_slip(
    transaction['transaction_id'],
    open('slip.jpg', 'rb')
)
```

---

## Support

**API Issues:** api-support@smartaihub.com  
**Documentation:** https://docs.smartaihub.com  
**Status Page:** https://status.smartaihub.com
