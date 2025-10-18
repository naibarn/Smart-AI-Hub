# RAG System Technical Documentation

## Overview

The RAG (Retrieval-Augmented Generation) System is a comprehensive document management and retrieval system with multi-tier access control. It allows users to upload, manage, and query documents using advanced embedding and search techniques.

## Architecture

### Components

1. **Document Management Service**
   - Handles document upload, processing, and storage
   - Integrates with Cloudflare R2 for file storage
   - Uses Cloudflare Vectorize for embeddings

2. **Query Service**
   - Processes user queries and retrieves relevant document chunks
   - Implements semantic search with configurable top-K results
   - Supports access control based on user permissions

3. **Access Control Layer**
   - Enforces multi-tier access levels (Private, Agent, Agency, Organization, Public)
   - Manages document sharing permissions
   - Logs all access attempts for auditing

### Data Flow

1. **Document Upload**
   - User uploads document through the frontend
   - Document is stored in Cloudflare R2
   - Document is processed and chunked
   - Chunks are embedded using the embedding model
   - Embeddings are stored in Vectorize with metadata

2. **Query Processing**
   - User submits a query
   - Query is embedded using the same model
   - System searches Vectorize for similar chunks
   - Results are filtered based on access permissions
   - Relevant chunks are returned to the user

## API Reference

### Document Management

#### Upload Document
```http
POST /api/rag/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: File (required)
- title: string (required)
- accessLevel: DocumentAccessLevel (required)
- sharedWithAgentIds: string[] (optional)
- agentId: string (optional)
```

#### Get Documents
```http
GET /api/rag/documents?page=1&limit=10&accessLevel=PRIVATE&search=query
Authorization: Bearer {token}
```

#### Get Document by ID
```http
GET /api/rag/documents/{id}
Authorization: Bearer {token}
```

#### Update Document Access
```http
PATCH /api/rag/documents/{id}/access
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "accessLevel": "AGENCY",
  "sharedWithAgentIds": ["agent1", "agent2"]
}
```

#### Delete Document
```http
DELETE /api/rag/documents/{id}
Authorization: Bearer {token}
```

### Query Operations

#### Query RAG System
```http
POST /api/rag/query
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "query": "What is the return policy?",
  "agentId": "optional-agent-id",
  "topK": 5,
  "accessLevel": "PUBLIC",
  "filters": {
    "organizationId": "optional-org-id",
    "agencyId": "optional-agency-id",
    "userId": "optional-user-id"
  }
}
```

#### Get Document Chunks
```http
GET /api/rag/documents/{documentId}/chunks?page=1&limit=10
Authorization: Bearer {token}
```

#### Get Document Access Logs
```http
GET /api/rag/documents/{documentId}/access-logs?page=1&limit=10
Authorization: Bearer {token}
```

### System Information

#### Get System Statistics
```http
GET /api/rag/stats
Authorization: Bearer {token}

Response:
{
  "totalDocuments": 150,
  "totalChunks": 2500,
  "totalQueries": 5000,
  "averageQueryTime": 125.5
}
```

## Data Models

### Document
```typescript
interface Document {
  id: string;
  userId: string;
  organizationId?: string;
  agencyId?: string;
  agentId?: string;
  title: string;
  filename?: string;
  fileType?: string;
  fileSize?: number;
  r2Bucket: string;
  r2Key: string;
  vectorizeIndex: string;
  vectorizeNamespace?: string;
  totalChunks: number;
  accessLevel: DocumentAccessLevel;
  sharedWithAgentIds: string[];
  allowDownload: boolean;
  allowCopy: boolean;
  status: DocumentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}
```

### DocumentChunk
```typescript
interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  chunkSize: number;
  vectorId: string;
  embeddingModel: string;
  pageNumber?: number;
  sectionTitle?: string;
  createdAt: Date;
}
```

### RAGQueryRequest
```typescript
interface RAGQueryRequest {
  query: string;
  agentId?: string;
  topK?: number;
  accessLevel?: DocumentAccessLevel;
  filters?: {
    organizationId?: string;
    agencyId?: string;
    userId?: string;
  };
}
```

### RAGQueryResponse
```typescript
interface RAGQueryResponse {
  results: RAGQueryResult[];
  totalResults: number;
  queryTime: number;
}
```

## Access Control

### Access Levels

1. **PRIVATE**: Only accessible by the document owner
2. **AGENT**: Accessible by the owner and specified agents
3. **AGENCY**: Accessible by all agents in the same agency
4. **ORGANIZATION**: Accessible by all users in the same organization
5. **PUBLIC**: Accessible by all authenticated users

### Permission Matrix

| Access Level | Owner | Agent | Agency | Organization | Public |
|--------------|-------|-------|--------|---------------|--------|
| PRIVATE      | ✓     | ✗     | ✗      | ✗             | ✗      |
| AGENT        | ✓     | ✓     | ✗      | ✗             | ✗      |
| AGENCY       | ✓     | ✓     | ✓      | ✗             | ✗      |
| ORGANIZATION| ✓     | ✓     | ✓      | ✓             | ✗      |
| PUBLIC       | ✓     | ✓     | ✓      | ✓             | ✓      |

## Configuration

### Environment Variables

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=smart-ai-hub-documents

# Cloudflare Vectorize Configuration
VECTORIZE_API_TOKEN=your-vectorize-api-token
VECTORIZE_ACCOUNT_ID=your-account-id
VECTORIZE_INDEX_NAME=documents-index

# Embedding Model Configuration
EMBEDDING_MODEL=bge-base-en-v1.5
EMBEDDING_DIMENSIONS=768
EMBEDDING_BATCH_SIZE=100

# Chunking Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Query Configuration
DEFAULT_TOP_K=5
MAX_TOP_K=20
MIN_SCORE_THRESHOLD=0.7
```

### File Type Support

Supported file types:
- PDF (.pdf)
- Microsoft Word (.docx)
- Microsoft Excel (.xlsx)
- Plain Text (.txt)
- Markdown (.md)

Maximum file size: 10MB

## Security Considerations

1. **Authentication**: All API endpoints require valid JWT tokens
2. **Authorization**: Access control is enforced at the document level
3. **Audit Trail**: All document access is logged for compliance
4. **Data Encryption**: Documents are encrypted at rest in R2
5. **Input Validation**: All inputs are validated and sanitized

## Performance Optimization

1. **Batch Processing**: Documents are processed in batches for efficiency
2. **Caching**: Query results are cached for frequently accessed documents
3. **Lazy Loading**: Document chunks are loaded on demand
4. **Vector Indexing**: Optimized vector indexes for fast retrieval

## Monitoring and Logging

1. **Query Metrics**: Track query performance and accuracy
2. **Document Processing**: Monitor document upload and processing status
3. **Access Logs**: Log all document access for security auditing
4. **Error Tracking**: Monitor and alert on system errors

## Troubleshooting

### Common Issues

1. **Document Upload Fails**
   - Check file size and type
   - Verify R2 credentials
   - Check available storage space

2. **Query Returns No Results**
   - Verify document processing is complete
   - Check access permissions
   - Adjust query parameters (topK, threshold)

3. **Slow Query Performance**
   - Check vector index size
   - Optimize chunk size
   - Consider caching strategies

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Invalid request | Check request parameters |
| 401 | Unauthorized | Verify authentication token |
| 403 | Access denied | Check document permissions |
| 404 | Document not found | Verify document ID |
| 413 | File too large | Reduce file size |
| 500 | Internal error | Check system logs |

## Future Enhancements

1. **Multi-language Support**: Support for documents in multiple languages
2. **Advanced Filtering**: More sophisticated query filtering options
3. **Document Versioning**: Track and manage document versions
4. **Collaborative Features**: Enable document collaboration
5. **Analytics Dashboard**: Advanced analytics for document usage