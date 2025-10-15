# Smart AI Hub Architecture Documentation

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [System Architecture](#system-architecture)
- [Microservices Architecture](#microservices-architecture)
- [Data Architecture](#data-architecture)
- [Security Architecture](#security-architecture)
- [Communication Patterns](#communication-patterns)
- [Technology Stack](#technology-stack)
- [Design Decisions](#design-decisions)
- [Scalability Considerations](#scalability-considerations)
- [Performance Considerations](#performance-considerations)
- [Reliability and Fault Tolerance](#reliability-and-fault-tolerance)
- [Evolution of the Architecture](#evolution-of-the-architecture)

## Overview

The Smart AI Hub is a cloud-native platform built on a microservices architecture that enables users to interact with various AI models through a unified interface. This document describes the system's architecture, design decisions, and technical considerations.

### Architecture Goals

1. **Scalability**: Ability to handle growing numbers of users and AI model requests
2. **Modularity**: Loosely coupled services that can be developed and deployed independently
3. **Resilience**: Fault-tolerant system that can recover from failures
4. **Security**: Robust security measures to protect user data and API keys
5. **Performance**: Low latency and high throughput for AI model interactions
6. **Maintainability**: Clear structure that is easy to understand and modify

## Architecture Principles

### 1. Single Responsibility Principle

Each service has a single, well-defined responsibility:
- **Auth Service**: Handles authentication and authorization
- **Core Service**: Manages business logic and data
- **MCP Server**: Interfaces with AI models
- **API Gateway**: Routes requests and handles cross-cutting concerns
- **Notification Service**: Sends notifications to users

### 2. Domain-Driven Design (DDD)

The system is organized around business domains:
- User Management
- Authentication & Authorization
- Credit Management
- AI Model Interactions
- Notifications

### 3. API-First Design

All services expose well-defined APIs:
- RESTful APIs for CRUD operations
- WebSocket connections for real-time features
- Event-driven architecture for asynchronous operations

### 4. Loose Coupling

Services communicate through well-defined interfaces:
- No direct database access between services
- Communication via APIs and message queues
- Shared libraries contain only common types and utilities

### 5. High Cohesion

Related functionality is grouped together:
- Business logic within services
- Related components in the same service
- Clear boundaries between services

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                            Frontend                            │
│                      (React, TypeScript)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS/WebSocket
┌─────────────────────▼───────────────────────────────────────────┐
│                        API Gateway                              │
│                   (Express, Node.js)                           │
│  • Request Routing          • Rate Limiting                   │
│  • Authentication           • Request Validation               │
│  • Load Balancing           • Response Transformation          │
└─────────────┬───────────────┬───────────────┬─────────────────┘
              │               │               │
┌─────────────▼──────┐ ┌──────▼────────────┐ ┌───────▼──────────┐
│   Auth Service     │ │   Core Service    │ │   MCP Server     │
│ (Express, Node.js) │ │(Express, Node.js) │ │(Express, Node.js)│
│ • User Auth        │ │ • User Management │ │ • AI Model API   │
│ • JWT Tokens       │ │ • Credit System   │ │ • Token Tracking │
│ • OAuth            │ │ • Payment         │ │ • Usage Logging  │
└─────────────────────┘ └───────────────────┘ └──────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                     Infrastructure                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ PostgreSQL  │  │    Redis    │  │   Message Queue     │   │
│  │   Database  │  │    Cache    │  │   (Redis Streams)   │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Service Interactions

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│ API Gateway │─────▶│ Auth Service│
└─────────────┘      └─────────────┘      └─────────────┘
                            │                       │
                            ▼                       ▼
                      ┌─────────────┐      ┌─────────────┐
                      │ Core Service│      │   MCP Server │
                      └─────────────┘      └─────────────┘
                            │                       │
                            ▼                       ▼
                      ┌─────────────────────────────────┐
                      │          Database Layer         │
                      │  ┌─────────────┐ ┌───────────┐ │
                      │  │ PostgreSQL  │ │   Redis   │ │
                      │  │   Database  │ │   Cache   │ │
                      │  └─────────────┘ └───────────┘ │
                      └─────────────────────────────────┘
```

## Microservices Architecture

### Service Boundaries

#### API Gateway
- **Responsibilities**:
  - Request routing and load balancing
  - Authentication and authorization
  - Rate limiting and throttling
  - Request/response transformation
  - API versioning

- **Technology Stack**:
  - Node.js with Express
  - JWT verification
  - Redis for rate limiting
  - Nginx for load balancing

#### Auth Service
- **Responsibilities**:
  - User authentication (email/password, OAuth)
  - JWT token generation and validation
  - Password management
  - User session management

- **Technology Stack**:
  - Node.js with Express
  - Passport.js for authentication
  - bcrypt for password hashing
  - JWT for tokens

#### Core Service
- **Responsibilities**:
  - User profile management
  - Credit system
  - Payment processing
  - Business logic

- **Technology Stack**:
  - Node.js with Express
  - Prisma ORM
  - Stripe for payments
  - PostgreSQL for data

#### MCP (Model Context Protocol) Server
- **Responsibilities**:
  - AI model interactions
  - Token usage tracking
  - Cost calculation
  - Response streaming

- **Technology Stack**:
  - Node.js with Express
  - WebSocket for streaming
  - OpenAI and Anthropic APIs
  - Redis for caching

#### Notification Service
- **Responsibilities**:
  - Email notifications
  - In-app notifications
  - Push notifications
  - Notification preferences

- **Technology Stack**:
  - Node.js with Express
  - SendGrid for email
  - Redis for queues
  - WebSocket for real-time

### Service Communication

#### Synchronous Communication
- **REST APIs**: For request/response patterns
- **GraphQL**: For complex queries (future enhancement)
- **WebSocket**: For real-time communication

#### Asynchronous Communication
- **Message Queues**: For background processing
- **Event Streaming**: For real-time events
- **Webhooks**: For external integrations

### Service Discovery

- **Static Configuration**: For simple deployments
- **DNS-based Discovery**: For containerized environments
- **Service Registry**: For complex microservices (future enhancement)

## Data Architecture

### Database Design

#### Primary Database: PostgreSQL
- **ACID compliance** for transactional integrity
- **JSON support** for flexible schema
- **Full-text search** capabilities
- **Strong consistency** guarantees

#### Cache Layer: Redis
- **In-memory caching** for high performance
- **Session storage** for user sessions
- **Rate limiting** data
- **Message queuing** for async tasks

### Data Model

#### Core Entities

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit Accounts
CREATE TABLE credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'credits',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage Logs
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model_id VARCHAR(100) NOT NULL,
    tokens_used INTEGER NOT NULL,
    cost DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Data Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Request   │─────▶│  Business   │─────▶│   Database  │
└─────────────┘      │   Logic     │      └─────────────┘
                     └─────────────┘              │
                            │                     │
                            ▼                     ▼
                     ┌─────────────┐      ┌─────────────┐
                     │    Cache    │◀─────│   Query     │
                     └─────────────┘      └─────────────┘
```

### Data Consistency

#### Strong Consistency
- **Financial transactions** (credits, payments)
- **User authentication** data
- **Critical configuration** data

#### Eventual Consistency
- **Analytics data**
- **Usage statistics**
- **Notification preferences**

## Security Architecture

### Authentication Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    User     │─────▶│ Auth Service│─────▶│   Database  │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   JWT Token │
                     └─────────────┘
                            │
                            ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Request   │─────▶│API Gateway  │─────▶│    Service  │
│   + Token   │      │ Validation  │      └─────────────┘
└─────────────┘      └─────────────┘
```

### Authorization Model

#### Role-Based Access Control (RBAC)

```typescript
// Role definitions
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

// Permission definitions
enum Permission {
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  READ_CREDITS = 'read:credits',
  WRITE_CREDITS = 'write:credits',
  ACCESS_AI_MODELS = 'access:ai_models'
}

// Role-Permission mapping
const rolePermissions = {
  [Role.ADMIN]: [
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.READ_CREDITS,
    Permission.WRITE_CREDITS,
    Permission.ACCESS_AI_MODELS
  ],
  [Role.USER]: [
    Permission.READ_CREDITS,
    Permission.WRITE_CREDITS,
    Permission.ACCESS_AI_MODELS
  ]
};
```

### Security Layers

1. **Network Security**
   - TLS/SSL encryption for all communications
   - Firewall rules and network segmentation
   - DDoS protection

2. **Application Security**
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection

3. **Data Security**
   - Encryption at rest and in transit
   - Sensitive data masking
   - Secure key management

## Communication Patterns

### Request-Response Pattern

```typescript
// Synchronous API call
const response = await fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const profile = await response.json();
```

### Event-Driven Pattern

```typescript
// Publish event
eventBus.publish('user.registered', {
  userId: 'user_123',
  email: 'user@example.com'
});

// Subscribe to event
eventBus.subscribe('user.registered', async (event) => {
  await notificationService.sendWelcomeEmail(event.userId);
});
```

### CQRS (Command Query Responsibility Segregation)

```typescript
// Command side (write)
interface Command {
  execute(): Promise<void>;
}

class CreateUserCommand implements Command {
  constructor(
    private userData: UserData,
    private userRepository: UserRepository
  ) {}

  async execute(): Promise<void> {
    const user = new User(this.userData);
    await this.userRepository.save(user);
  }
}

// Query side (read)
interface Query<T> {
  execute(): Promise<T>;
}

class GetUserQuery implements Query<User> {
  constructor(
    private userId: string,
    private userRepository: UserRepository
  ) {}

  async execute(): Promise<User> {
    return this.userRepository.findById(this.userId);
  }
}
```

## Technology Stack

### Backend

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| Runtime | Node.js | 18.x | High performance, large ecosystem |
| Framework | Express.js | 4.x | Mature, flexible, good middleware |
| Database | PostgreSQL | 15+ | ACID compliant, JSON support |
| Cache | Redis | 7+ | In-memory, versatile data structures |
| ORM | Prisma | 5.x | Type-safe, excellent DX |
| Auth | Passport.js | 0.6+ | Modular, many strategies |
| Validation | Joi | 17.x | Powerful schema validation |

### Frontend

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| Framework | React | 18.x | Component-based, large ecosystem |
| Language | TypeScript | 5.x | Type safety, better DX |
| State Management | React Context | - | Built-in, simple for our needs |
| HTTP Client | Axios | 1.x | Promise-based, interceptors |
| UI Library | Material-UI | 5.x | Comprehensive, customizable |

### DevOps & Infrastructure

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| Containerization | Docker | 20.x | Industry standard |
| Orchestration | Kubernetes | 1.24+ | Scalable, self-healing |
| CI/CD | GitHub Actions | - | Integrated with GitHub |
| Monitoring | Prometheus | - | Time-series data |
| Visualization | Grafana | - | Rich dashboards |
| Logging | Winston | 3.x | Structured logging |

## Design Decisions

### 1. Microservices over Monolith

**Decision**: Adopt microservices architecture

**Rationale**:
- Independent scaling of services
- Technology diversity
- Fault isolation
- Team autonomy

**Trade-offs**:
- Increased operational complexity
- Network latency
- Distributed transaction management

### 2. PostgreSQL over NoSQL

**Decision**: Use PostgreSQL as primary database

**Rationale**:
- ACID compliance for financial transactions
- Mature and well-understood
- Excellent tooling and support
- JSON support for flexibility

**Trade-offs**:
- Less flexible schema than NoSQL
- Potential performance bottlenecks at scale

### 3. REST over GraphQL

**Decision**: Use REST APIs

**Rationale**:
- Simpler to implement and understand
- Good caching support
- Mature ecosystem
- Clear separation of concerns

**Trade-offs**:
- Over-fetching or under-fetching data
- Multiple API calls for complex data

### 4. JWT over Session-based Auth

**Decision**: Use JWT for authentication

**Rationale**:
- Stateless authentication
- Works well with microservices
- Mobile-friendly
- No server-side session storage

**Trade-offs**:
- Token revocation complexity
- Larger request size
- Security concerns if not handled properly

### 5. Docker over VMs

**Decision**: Use Docker containers

**Rationale**:
- Lightweight and portable
- Consistent environments
- Faster startup times
- Better resource utilization

**Trade-offs**:
- Less isolation than VMs
- Shared kernel vulnerability
- Container management complexity

## Scalability Considerations

### Horizontal Scaling

- **Stateless Services**: All services designed to be stateless
- **Load Balancing**: Nginx or cloud load balancers
- **Database Sharding**: For very large datasets
- **Caching Layers**: Multiple caching strategies

### Vertical Scaling

- **Resource Allocation**: CPU and memory optimization
- **Database Tuning**: Query optimization, indexing
- **Connection Pooling**: Efficient database connections

### Auto-scaling

```yaml
# Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Performance Considerations

### Database Optimization

1. **Indexing Strategy**
   - Primary keys on all tables
   - Foreign key indexes
   - Composite indexes for common queries

2. **Query Optimization**
   - Query analysis and optimization
   - Connection pooling
   - Read replicas for read-heavy workloads

3. **Caching Strategy**
   - Application-level caching
   - Database query caching
   - CDN for static assets

### API Performance

1. **Response Time Optimization**
   - Efficient serialization
   - Compression (gzip)
   - Pagination for large datasets

2. **Throughput Optimization**
   - Async processing where possible
   - Connection pooling
   - Rate limiting

### Frontend Performance

1. **Bundle Optimization**
   - Code splitting
   - Tree shaking
   - Lazy loading

2. **Caching Strategy**
   - Browser caching
   - Service workers
   - CDN caching

## Reliability and Fault Tolerance

### High Availability

1. **Redundancy**
   - Multiple service instances
   - Database replication
   - Multi-zone deployment

2. **Failover Mechanisms**
   - Health checks
   - Automatic failover
   - Circuit breakers

### Error Handling

1. **Graceful Degradation**
   - Fallback mechanisms
   - Default values
   - Offline functionality

2. **Error Recovery**
   - Retry mechanisms with exponential backoff
   - Dead letter queues
   - Manual override options

### Monitoring and Alerting

1. **Health Checks**
   - Service health endpoints
   - Database connectivity checks
   - External dependency monitoring

2. **Metrics Collection**
   - Application metrics
   - Infrastructure metrics
   - Business metrics

## Evolution of the Architecture

### Current Architecture (v1.0)

- **Focus**: Core functionality
- **Services**: 5 microservices
- **Database**: Single PostgreSQL instance
- **Deployment**: Docker Compose

### Near Future (v1.5)

- **Enhancements**:
  - Event-driven architecture
  - Message queues
  - Improved monitoring
  - Kubernetes deployment

### Long Term (v2.0)

- **Planned Features**:
  - GraphQL API
  - Service mesh (Istio)
  - Multi-region deployment
  - Advanced AI model management

### Architectural Decision Records (ADRs)

We maintain ADRs to document important architectural decisions:

1. **ADR-001**: Adopt microservices architecture
2. **ADR-002**: Use PostgreSQL as primary database
3. **ADR-003**: Implement JWT-based authentication
4. **ADR-004**: Choose Docker for containerization
5. **ADR-005**: Implement event-driven architecture

---

This architecture documentation is a living document that evolves with the system. For the latest updates and detailed implementation guides, please refer to the specific service documentation.