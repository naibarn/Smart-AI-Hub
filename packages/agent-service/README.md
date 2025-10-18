# Agent Service

The Agent Service is a microservice that provides RAG (Retrieval-Augmented Generation) capabilities, pricing management, and a skills marketplace for AI agents.

## Features

### RAG System
- Document upload and processing
- Vector storage and semantic search
- Multi-tier access control
- Knowledge base management
- Query processing with context retrieval

### Pricing System
- Multi-platform agent support (Custom GPT, Gemini Gems, OpenAI Assistants, etc.)
- Real-time cost calculation
- Credit reservation mechanism
- Usage tracking and analytics
- Pricing rule management

### Skills Marketplace
- Skill creation and management
- Approval workflow
- Skill rating and review system
- Skill installation and usage
- Category management

## Architecture

The service is built with:
- **Node.js** with **TypeScript**
- **Express.js** for the web framework
- **Cloudflare** services for storage and vector search
- **Winston** for logging
- **Jest** for testing

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
cd packages/agent-service
npm install
```

### Environment Variables
Create a `.env` file with the following variables:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agent_service
DB_USER=postgres
DB_PASSWORD=password
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_R2_ENDPOINT=your-r2-endpoint
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_VECTORIZER_ENDPOINT=your-vectorize-endpoint
CLOUDFLARE_VECTORIZER_API_TOKEN=your-vectorize-token
CLOUDFLARE_WORKERS_AI_ENDPOINT=your-workers-ai-endpoint
CLOUDFLARE_WORKERS_AI_API_TOKEN=your-workers-ai-token

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Running the Service
```bash
# Development mode
npm run dev

# Production mode
npm start

# Build
npm run build
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## API Documentation

### RAG Endpoints

#### Documents
- `POST /api/rag/documents` - Upload a document
- `GET /api/rag/documents` - Get user's documents
- `GET /api/rag/documents/:documentId` - Get document details
- `DELETE /api/rag/documents/:documentId` - Delete a document
- `POST /api/rag/documents/:documentId/share` - Share a document

#### Query
- `POST /api/rag/query` - Query the RAG system
- `GET /api/rag/query/:queryId` - Get query details

#### Knowledge Bases
- `GET /api/rag/knowledge-bases` - Get knowledge bases
- `POST /api/rag/knowledge-bases` - Create a knowledge base
- `GET /api/rag/knowledge-bases/:knowledgeBaseId/documents` - Get documents in a knowledge base
- `POST /api/rag/knowledge-bases/:knowledgeBaseId/documents/:documentId` - Add document to knowledge base
- `DELETE /api/rag/knowledge-bases/:knowledgeBaseId/documents/:documentId` - Remove document from knowledge base

### Pricing Endpoints

- `GET /api/pricing/platforms` - Get all platforms
- `GET /api/pricing/platforms/:platformId/models` - Get models for a platform
- `GET /api/pricing/models/:modelId/rules` - Get pricing rules for a model
- `POST /api/pricing/estimate` - Estimate cost
- `POST /api/pricing/execute` - Execute agent with cost tracking
- `GET /api/pricing/usage` - Get usage history
- `PUT /api/pricing/rules/:ruleId` - Update pricing rule (admin)
- `GET /api/pricing/analytics` - Get pricing analytics (admin)

### Skills Endpoints

- `GET /api/skills/categories` - Get all categories
- `GET /api/skills/category/:categoryId` - Get skills by category
- `GET /api/skills/search` - Search skills
- `GET /api/skills/:skillId` - Get skill details
- `POST /api/skills` - Create skill
- `PUT /api/skills/:skillId` - Update skill
- `POST /api/skills/:skillId/submit` - Submit skill for review
- `POST /api/skills/:skillId/approve` - Approve skill (admin)
- `POST /api/skills/:skillId/reject` - Reject skill (admin)
- `POST /api/skills/:skillId/rate` - Rate skill
- `POST /api/skills/:skillId/purchase` - Purchase skill
- `GET /api/skills/user/my-skills` - Get user's skills
- `GET /api/skills/admin/pending` - Get skills pending review (admin)

## Folder Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── routes/          # API routes
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point

tests/
├── services/        # Service tests
└── setup.ts         # Test setup
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the tests
6. Submit a pull request

## License

This project is licensed under the MIT License.