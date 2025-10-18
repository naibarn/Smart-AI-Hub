# Smart AI Hub API Documentation

## Overview

This document provides comprehensive API documentation for the Smart AI Hub platform, including the RAG System, Pricing System, and Agent Skills Marketplace.

## Base URLs

- **Production**: `https://api.smartaihub.com`
- **Staging**: `https://staging-api.smartaihub.com`
- **Development**: `http://localhost:3001`

## Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer {jwt-token}
```

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Standard users**: 100 requests per minute
- **Premium users**: 500 requests per minute
- **Enterprise users**: 2000 requests per minute

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

## RAG System API

### Documents

#### Upload Document

Uploads a document to the RAG system for processing and indexing.

```http
POST /api/rag/documents
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- file: File (required) - The document to upload
- title: string (required) - Document title
- description: string (optional) - Document description
- accessLevel: string (required) - Access level (PUBLIC, ORGANIZATION, PRIVATE)
- organizationId: string (optional) - Organization ID for ORGANIZATION access
- tags: string[] (optional) - Array of tags
- metadata: object (optional) - Additional metadata
```

**Response:**
```json
{
  "document": {
    "id": "doc_123",
    "title": "AI Research Paper",
    "description": "Latest AI research findings",
    "fileName": "research.pdf",
    "fileSize": 1048576,
    "fileType": "application/pdf",
    "status": "PROCESSING",
    "accessLevel": "PUBLIC",
    "uploadedBy": "user_456",
    "tags": ["ai", "research"],
    "metadata": {},
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Document uploaded successfully and is being processed"
}
```

#### Get Documents

Retrieves a paginated list of documents with optional filtering.

```http
GET /api/rag/documents?page=1&limit=10&accessLevel=PUBLIC&tags=ai&search=research
Authorization: Bearer {token}
```

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_123",
      "title": "AI Research Paper",
      "description": "Latest AI research findings",
      "fileName": "research.pdf",
      "fileSize": 1048576,
      "fileType": "application/pdf",
      "status": "COMPLETED",
      "accessLevel": "PUBLIC",
      "uploadedBy": "user_456",
      "tags": ["ai", "research"],
      "metadata": {},
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Get Document by ID

Retrieves a specific document by its ID.

```http
GET /api/rag/documents/{documentId}
Authorization: Bearer {token}
```

#### Update Document

Updates document metadata.

```http
PATCH /api/rag/documents/{documentId}
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["ai", "research", "updated"],
  "accessLevel": "ORGANIZATION",
  "organizationId": "org_789"
}
```

#### Delete Document

Deletes a document and all its chunks.

```http
DELETE /api/rag/documents/{documentId}
Authorization: Bearer {token}
```

### Queries

#### Query Documents

Performs a semantic search against uploaded documents.

```http
POST /api/rag/queries
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "query": "What are the latest findings in AI research?",
  "topK": 5,
  "accessLevels": ["PUBLIC"],
  "tags": ["ai", "research"],
  "filters": {
    "uploadedBy": "user_456",
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    }
  },
  "rerank": true,
  "includeMetadata": true
}
```

**Response:**
```json
{
  "query": "What are the latest findings in AI research?",
  "results": [
    {
      "documentId": "doc_123",
      "documentTitle": "AI Research Paper",
      "chunkId": "chunk_456",
      "content": "The latest findings in AI research show significant improvements...",
      "score": 0.95,
      "metadata": {
        "pageNumber": 5,
        "section": "Introduction"
      }
    }
  ],
  "totalResults": 1,
  "executionTime": 150
}
```

#### Get Query History

Retrieves the user's query history.

```http
GET /api/rag/queries/history?page=1&limit=10
Authorization: Bearer {token}
```

### Collections

#### Create Collection

Creates a document collection for grouping related documents.

```http
POST /api/rag/collections
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "name": "AI Research Collection",
  "description": "Collection of AI research papers",
  "accessLevel": "ORGANIZATION",
  "organizationId": "org_789"
}
```

#### Get Collections

Retrieves a list of collections.

```http
GET /api/rag/collections?page=1&limit=10
Authorization: Bearer {token}
```

#### Add Document to Collection

Adds a document to a collection.

```http
POST /api/rag/collections/{collectionId}/documents/{documentId}
Authorization: Bearer {token}
```

## Pricing System API

### Pricing Rules

#### Create Pricing Rule

Creates a new pricing rule for agent execution.

```http
POST /api/pricing/rules
Content-Type: application/json
Authorization: Bearer {admin-token}

Body:
{
  "name": "OpenAI GPT-4 Pricing",
  "description": "Pricing for OpenAI GPT-4 model",
  "platformId": "openai",
  "modelId": "gpt-4",
  "inputTokenPrice": 0.00001,
  "outputTokenPrice": 0.00002,
  "fixedPrice": 0,
  "currency": "USD",
  "validFrom": "2024-01-01T00:00:00Z",
  "validTo": "2024-12-31T23:59:59Z",
  "metadata": {
    "region": "us-east-1",
    "tier": "standard"
  }
}
```

**Response:**
```json
{
  "rule": {
    "id": "rule_123",
    "name": "OpenAI GPT-4 Pricing",
    "description": "Pricing for OpenAI GPT-4 model",
    "platformId": "openai",
    "modelId": "gpt-4",
    "inputTokenPrice": 0.00001,
    "outputTokenPrice": 0.00002,
    "fixedPrice": 0,
    "currency": "USD",
    "validFrom": "2024-01-01T00:00:00Z",
    "validTo": "2024-12-31T23:59:59Z",
    "isActive": true,
    "metadata": {
      "region": "us-east-1",
      "tier": "standard"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Pricing Rules

Retrieves a list of pricing rules with optional filtering.

```http
GET /api/pricing/rules?page=1&limit=10&platformId=openai&isActive=true
Authorization: Bearer {token}
```

#### Get Pricing Rule by ID

Retrieves a specific pricing rule.

```http
GET /api/pricing/rules/{ruleId}
Authorization: Bearer {token}
```

#### Update Pricing Rule

Updates an existing pricing rule.

```http
PATCH /api/pricing/rules/{ruleId}
Content-Type: application/json
Authorization: Bearer {admin-token}

Body:
{
  "inputTokenPrice": 0.000015,
  "outputTokenPrice": 0.000025
}
```

#### Delete Pricing Rule

Deletes a pricing rule.

```http
DELETE /api/pricing/rules/{ruleId}
Authorization: Bearer {admin-token}
```

### Cost Calculation

#### Calculate Cost

Calculates the cost for agent execution based on usage.

```http
POST /api/pricing/calculate
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "platformId": "openai",
  "modelId": "gpt-4",
  "inputTokens": 1000,
  "outputTokens": 500,
  "executionTime": 30,
  "userId": "user_456"
}
```

**Response:**
```json
{
  "costBreakdown": {
    "platformId": "openai",
    "modelId": "gpt-4",
    "inputTokens": 1000,
    "outputTokens": 500,
    "executionTime": 30,
    "inputTokenCost": 0.01,
    "outputTokenCost": 0.01,
    "executionTimeCost": 0,
    "fixedCost": 0,
    "totalCost": 0.02,
    "currency": "USD",
    "appliedRuleId": "rule_123",
    "discounts": [
      {
        "type": "bulk_discount",
        "amount": 0.002,
        "description": "10% bulk discount for >1000 tokens"
      }
    ]
  }
}
```

### Usage Tracking

#### Record Usage

Records agent execution usage for billing.

```http
POST /api/pricing/usage
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "userId": "user_456",
  "platformId": "openai",
  "modelId": "gpt-4",
  "inputTokens": 1000,
  "outputTokens": 500,
  "executionTime": 30,
  "totalCost": 0.02,
  "currency": "USD",
  "sessionId": "session_789",
  "metadata": {
    "requestId": "req_123",
    "endpoint": "/api/agent/execute"
  }
}
```

#### Get Usage History

Retrieves usage history for a user.

```http
GET /api/pricing/usage?userId=user_456&from=2024-01-01&to=2024-01-31&page=1&limit=10
Authorization: Bearer {token}
```

## Agent Skills Marketplace API

### Skills

#### Create Skill

Creates a new agent skill for the marketplace.

```http
POST /api/agent-skills/skills
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "name": "Email Automation",
  "description": "Automate email responses",
  "longDescription": "A comprehensive tool for automating email responses...",
  "categoryId": "cat_123",
  "platformId": "openai",
  "visibility": "PUBLIC",
  "tags": ["automation", "email", "productivity"]
}
```

**Response:**
```json
{
  "skill": {
    "id": "skill_123",
    "name": "Email Automation",
    "slug": "email-automation",
    "description": "Automate email responses",
    "longDescription": "A comprehensive tool for automating email responses...",
    "creatorId": "user_456",
    "categoryId": "cat_123",
    "platformId": "openai",
    "visibility": "PUBLIC",
    "status": "PENDING",
    "installCount": 0,
    "averageRating": 0,
    "reviewCount": 0,
    "tags": ["automation", "email", "productivity"],
    "metadata": {},
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Skills

Retrieves a paginated list of skills with optional filtering.

```http
GET /api/agent-skills/skills?page=1&limit=12&category=automation&platform=openai&search=automation&sortBy=popular
Authorization: Bearer {token}
```

#### Get Skill by ID

Retrieves a specific skill by its ID.

```http
GET /api/agent-skills/skills/{skillId}
Authorization: Bearer {token}
```

#### Update Skill

Updates skill metadata.

```http
PATCH /api/agent-skills/skills/{skillId}
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "description": "Updated description",
  "tags": ["automation", "email", "productivity", "updated"]
}
```

#### Delete Skill

Deletes a skill.

```http
DELETE /api/agent-skills/skills/{skillId}
Authorization: Bearer {token}
```

### Skill Versions

#### Create Skill Version

Creates a new version of a skill.

```http
POST /api/agent-skills/skills/{skillId}/versions
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- version: "1.2.0" (required)
- changelog: "Added new features and bug fixes" (optional)
- file: File (required) - ZIP file containing the skill
```

**Response:**
```json
{
  "version": {
    "id": "version_456",
    "skillId": "skill_123",
    "version": "1.2.0",
    "changelog": "Added new features and bug fixes",
    "fileUrl": "https://storage.example.com/skills/skill_123_v1.2.0.zip",
    "fileSize": 1048576,
    "fileHash": "sha256:abc123...",
    "isLatest": true,
    "downloadCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Skill Versions

Retrieves all versions of a skill.

```http
GET /api/agent-skills/skills/{skillId}/versions?page=1&limit=10
Authorization: Bearer {token}
```

### Skill Installation

#### Install Skill

Installs a skill for the user.

```http
POST /api/agent-skills/skills/{skillId}/install
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "versionId": "version_456" // Optional, defaults to latest
}
```

**Response:**
```json
{
  "installation": {
    "id": "install_789",
    "skillId": "skill_123",
    "userId": "user_456",
    "versionId": "version_456",
    "installedAt": "2024-01-25T09:15:00Z",
    "lastUsedAt": null,
    "usageCount": 0
  },
  "downloadUrl": "https://storage.example.com/download/skill_123_v1.2.0.zip"
}
```

#### Uninstall Skill

Uninstalls a skill for the user.

```http
DELETE /api/agent-skills/skills/{skillId}/install
Authorization: Bearer {token}
```

#### Get User's Installed Skills

Retrieves skills installed by the user.

```http
GET /api/agent-skills/user/installed?page=1&limit=10
Authorization: Bearer {token}
```

### Reviews

#### Create Review

Creates a review for a skill.

```http
POST /api/agent-skills/skills/{skillId}/reviews
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "rating": 5,
  "title": "Excellent tool!",
  "comment": "This skill has greatly improved my workflow..."
}
```

**Response:**
```json
{
  "review": {
    "id": "review_123",
    "skillId": "skill_456",
    "userId": "user_789",
    "rating": 5,
    "title": "Excellent tool!",
    "comment": "This skill has greatly improved my workflow...",
    "isVerified": true,
    "helpfulCount": 0,
    "createdAt": "2024-01-25T10:30:00Z",
    "updatedAt": "2024-01-25T10:30:00Z"
  }
}
```

#### Get Skill Reviews

Retrieves reviews for a skill.

```http
GET /api/agent-skills/skills/{skillId}/reviews?page=1&limit=10&rating=5
Authorization: Bearer {token}
```

#### Update Review

Updates a review.

```http
PATCH /api/agent-skills/skills/{skillId}/reviews/{reviewId}
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "rating": 4,
  "comment": "Updated comment after more usage..."
}
```

#### Delete Review

Deletes a review.

```http
DELETE /api/agent-skills/skills/{skillId}/reviews/{reviewId}
Authorization: Bearer {token}
```

### Categories

#### Get Categories

Retrieves all skill categories.

```http
GET /api/agent-skills/categories
Authorization: Bearer {token}
```

**Response:**
```json
{
  "categories": [
    {
      "id": "cat_123",
      "name": "Automation",
      "slug": "automation",
      "description": "Skills for automating repetitive tasks",
      "iconName": "automation",
      "parentId": null,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Category

Creates a new skill category.

```http
POST /api/agent-skills/categories
Content-Type: application/json
Authorization: Bearer {admin-token}

Body:
{
  "name": "Data Science",
  "description": "Skills for data analysis and science",
  "iconName": "data-science",
  "color": "#4CAF50"
}
```

### Search

#### Search Skills

Searches for skills with various filters.

```http
POST /api/agent-skills/search
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "q": "email automation",
  "category": "automation",
  "platform": "openai",
  "tags": ["productivity"],
  "sort": "popular",
  "limit": 20,
  "offset": 0
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "skill_123",
      "name": "Email Automation",
      "slug": "email-automation",
      "description": "Automate email responses",
      "creatorId": "user_456",
      "creatorName": "John Doe",
      "categoryId": "cat_123",
      "categoryName": "Automation",
      "platformId": "openai",
      "platformName": "OpenAI",
      "installCount": 150,
      "averageRating": 4.5,
      "reviewCount": 23,
      "iconUrl": "https://example.com/icon.png",
      "tags": ["automation", "email", "productivity"],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "facets": {
    "categories": [
      {
        "id": "cat_123",
        "name": "Automation",
        "count": 1
      }
    ],
    "platforms": [
      {
        "id": "openai",
        "name": "OpenAI",
        "count": 1
      }
    ],
    "tags": [
      {
        "name": "automation",
        "count": 1
      }
    ]
  }
}
```

### Admin Operations

#### Get Pending Skills

Retrieves skills pending approval.

```http
GET /api/agent-skills/skills/pending-approval?page=1&limit=10
Authorization: Bearer {admin-token}
```

#### Approve Skill

Approves a pending skill.

```http
POST /api/agent-skills/skills/{skillId}/approve
Content-Type: application/json
Authorization: Bearer {admin-token}
```

#### Reject Skill

Rejects a pending skill.

```http
POST /api/agent-skills/skills/{skillId}/reject
Content-Type: application/json
Authorization: Bearer {admin-token}

Body:
{
  "reason": "Skill does not meet quality standards"
}
```

#### Get Analytics

Retrieves marketplace analytics.

```http
GET /api/agent-skills/stats
Authorization: Bearer {admin-token}
```

**Response:**
```json
{
  "totalSkills": 150,
  "totalDownloads": 5000,
  "totalReviews": 1200,
  "averageRating": 4.2,
  "topCategories": [
    {
      "categoryId": "cat_123",
      "categoryName": "Automation",
      "skillCount": 45,
      "downloadCount": 2000,
      "averageRating": 4.5
    }
  ],
  "topPlatforms": [
    {
      "platformId": "openai",
      "platformName": "OpenAI",
      "skillCount": 80,
      "downloadCount": 3000,
      "averageRating": 4.3
    }
  ],
  "recentActivity": [
    {
      "type": "skill_created",
      "skillId": "skill_789",
      "skillName": "New Automation Tool",
      "userId": "user_456",
      "userName": "John Doe",
      "timestamp": "2024-01-25T10:30:00Z"
    }
  ]
}
```

## Credit Reservation API

### Reserve Credits

Reserves credits for an operation.

```http
POST /api/credit-reservation/reserve
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "userId": "user_123",
  "amount": 100,
  "purpose": "agent_execution",
  "expiresIn": 300, // seconds
  "metadata": {
    "agentId": "agent_456",
    "operation": "text_generation"
  }
}
```

**Response:**
```json
{
  "reservation": {
    "id": "reservation_789",
    "userId": "user_123",
    "amount": 100,
    "status": "ACTIVE",
    "purpose": "agent_execution",
    "expiresAt": "2024-01-25T10:35:00Z",
    "createdAt": "2024-01-25T10:30:00Z",
    "metadata": {
      "agentId": "agent_456",
      "operation": "text_generation"
    }
  }
}
```

### Charge Reserved Credits

Charges the reserved credits.

```http
POST /api/credit-reservation/{reservationId}/charge
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "amount": 80 // Optional, defaults to full reservation amount
}
```

### Release Reservation

Releases a credit reservation without charging.

```http
POST /api/credit-reservation/{reservationId}/release
Authorization: Bearer {token}
```

### Get User Reservations

Retrieves active reservations for a user.

```http
GET /api/credit-reservation/user/{userId}?status=ACTIVE
Authorization: Bearer {token}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| INVALID_REQUEST | Invalid request format | 400 |
| UNAUTHORIZED | Authentication required | 401 |
| FORBIDDEN | Access denied | 403 |
| NOT_FOUND | Resource not found | 404 |
| CONFLICT | Resource conflict | 409 |
| VALIDATION_ERROR | Input validation failed | 422 |
| RATE_LIMIT_EXCEEDED | Rate limit exceeded | 429 |
| INTERNAL_ERROR | Internal server error | 500 |
| SERVICE_UNAVAILABLE | Service temporarily unavailable | 503 |

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @smartaihub/sdk
```

```typescript
import { SmartAIHubClient } from '@smartaihub/sdk';

const client = new SmartAIHubClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.smartaihub.com'
});

// Upload document to RAG
const document = await client.rag.uploadDocument(file, {
  title: 'My Document',
  accessLevel: 'PUBLIC'
});

// Query documents
const results = await client.rag.query({
  query: 'What is AI?',
  topK: 5
});

// Calculate cost
const cost = await client.pricing.calculateCost({
  platformId: 'openai',
  modelId: 'gpt-4',
  inputTokens: 1000,
  outputTokens: 500
});

// Install skill
const installation = await client.agentSkills.installSkill('skill_123');
```

### Python

```bash
pip install smartaihub-sdk
```

```python
from smartaihub import SmartAIHubClient

client = SmartAIHubClient(
    api_key='your-api-key',
    base_url='https://api.smartaihub.com'
)

# Upload document to RAG
document = client.rag.upload_document(
    file=open('document.pdf', 'rb'),
    title='My Document',
    access_level='PUBLIC'
)

# Query documents
results = client.rag.query(
    query='What is AI?',
    top_k=5
)

# Calculate cost
cost = client.pricing.calculate_cost(
    platform_id='openai',
    model_id='gpt-4',
    input_tokens=1000,
    output_tokens=500
)

# Install skill
installation = client.agent_skills.install_skill('skill_123')
```

## Webhooks

### Configure Webhooks

Webhooks can be configured to receive notifications about various events:

```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "url": "https://your-app.com/webhooks",
  "events": [
    "document.processed",
    "skill.approved",
    "payment.completed"
  ],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

#### Document Processed

```json
{
  "event": "document.processed",
  "data": {
    "documentId": "doc_123",
    "status": "COMPLETED",
    "processedAt": "2024-01-25T10:30:00Z"
  }
}
```

#### Skill Approved

```json
{
  "event": "skill.approved",
  "data": {
    "skillId": "skill_456",
    "approvedBy": "admin_789",
    "approvedAt": "2024-01-25T10:30:00Z"
  }
}
```

#### Payment Completed

```json
{
  "event": "payment.completed",
  "data": {
    "userId": "user_123",
    "amount": 100,
    "currency": "USD",
    "transactionId": "txn_456",
    "completedAt": "2024-01-25T10:30:00Z"
  }
}
```

## Rate Limits

| Endpoint | Requests per Minute |
|----------|---------------------|
| RAG Queries | 60 |
| Document Upload | 10 |
| Cost Calculation | 100 |
| Skill Installation | 20 |
| Other Endpoints | 100 |

## Support

For API support and questions:
- Email: api-support@smartaihub.com
- Documentation: https://docs.smartaihub.com
- Status Page: https://status.smartaihub.com