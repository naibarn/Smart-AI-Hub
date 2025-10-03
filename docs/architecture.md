# Smart AI Hub Architecture

## Overview
Smart AI Hub is a monorepo application built with Node.js, TypeScript, React, and Docker for containerization. The structure uses npm workspaces for shared dependencies and TypeScript consistency. Services communicate via HTTP (proxied through API Gateway) and WebSockets (for MCP Server). PostgreSQL serves as the database for the core service.

## Monorepo Structure
The project is organized under `packages/`:
- **shared**: TypeScript utilities and types (e.g., `User` type: `{ id: string; email: string; }`).
- **api-gateway**: Express.js server proxying requests to other services (port 3000).
- **auth-service**: Node.js + Express with JWT and OAuth (Passport) for authentication (port 3001).
- **core-service**: Node.js + Express with Prisma ORM for PostgreSQL interactions (port 3002).
- **mcp-server**: Node.js + Express + WebSocket (ws library) for real-time communication (port 3003).
- **frontend**: React + TypeScript + Material-UI (Vite build tool) app (port 3004 in Docker, 3000 local).

Root files:
- `package.json`: Defines workspaces (`packages/*`), scripts (e.g., `npm run dev` for parallel starts).
- `tsconfig.base.json`: Base TS config (strict mode, paths for `@shared/*`).
- `tsconfig.json`: Composite project references to all packages for incremental builds.
- `docker-compose.yml`: Orchestrates services.

## Services Details

### API Gateway
- **Tech**: Express.js + TypeScript.
- **Role**: Entry point for all requests, proxies to auth/core/mcp with CORS.
- **Basic Setup**: Health check (`/health`), proxy placeholders (e.g., `/api/auth/*`).
- **Dependencies**: express, cors, http-proxy-middleware, @shared/utils.

### Auth Service
- **Tech**: Node.js + Express + TypeScript + JWT (jsonwebtoken) + OAuth (Passport).
- **Role**: Handles user registration, login, token generation, OAuth callbacks (e.g., Google).
- **Basic Setup**: Routes for `/register`, `/login`, `/auth/oauth2`, protected routes with JWT middleware.
- **Dependencies**: express, jsonwebtoken, passport, passport-jwt, passport-oauth2, bcryptjs, @shared/utils.

### Core Service
- **Tech**: Node.js + Express + TypeScript + Prisma + PostgreSQL.
- **Role**: Manages business logic and data persistence.
- **Basic Setup**: Prisma schema with User model; routes for `/users` (GET/POST) with DB queries.
- **Dependencies**: express, prisma, @prisma/client, @shared/utils.
- **DB**: PostgreSQL (env: DATABASE_URL).

### MCP Server
- **Tech**: Node.js + Express + TypeScript + WebSocket (ws).
- **Role**: Real-time bidirectional communication.
- **Basic Setup**: HTTP health check; WebSocket server with connection handling, message echo, welcome message.
- **Dependencies**: ws, express, cors, @shared/utils.

### Frontend
- **Tech**: React + TypeScript + Material-UI (Vite for dev/build).
- **Role**: User interface, calls API Gateway.
- **Basic Setup**: App with MUI theme, Typography, Button; uses shared User type.
- **Dependencies**: react, @mui/material, @emotion/react, vite, @shared/utils.
- **Config**: vite.config.ts with React plugin, proxy to API Gateway, alias for @shared.

## TypeScript Consistency
- **Base Config**: `tsconfig.base.json` (ES2020, strict, paths: `@shared/*` -> `packages/shared/src/*`).
- **Per-Service**: Each extends base with composite: true for incremental compilation.
- **Root**: `tsconfig.json` references all packages for monorepo builds (`tsc -b`).
- **Shared Linking**: Workspace deps (`"@shared/utils": "workspace:*"`) and path aliases ensure type sharing without duplication.

## Docker Configuration
- **Per-Service Dockerfiles**: Multi-stage Node builds (builder: npm ci + tsc; runner: copy dist/node_modules, CMD npm start). Frontend uses nginx for static serve.
- **docker-compose.yml**:
  - **Postgres**: Official image, persistent volume, env vars for DB.
  - **Services**: Build from `./packages/*`, expose ports, env vars (e.g., DATABASE_URL points to postgres service).
  - **Networks**: `smart-ai-hub` bridge for inter-service communication.
  - **Depends On**: core -> postgres; api-gateway -> auth/core/mcp; frontend -> api-gateway.
  - **Ports**: postgres:5432, api-gateway:3000, auth:3001, core:3002, mcp:3003, frontend:3004.
- **Run**: `docker-compose up -d` for production; add volumes for dev hot-reload.

## Deployment & Development
- **Install**: `npm install` (installs all workspaces).
- **Dev**: `npm run dev` (parallel ts-node-dev for backends, vite for frontend).
- **Build**: `npm run build` (tsc for all, vite build for frontend).
- **Docker Build/Run**: `docker-compose build && docker-compose up`.
- **Env Vars**: Use `.env` (e.g., JWT_SECRET, DATABASE_URL, OAUTH_CLIENT_ID); example in `.env.example`.
- **Future**: Add CI/CD (e.g., GitHub Actions), tests (Jest), monitoring (Prometheus).

This setup provides a scalable, type-safe foundation for Smart AI Hub.

## Docker Development Environment

### Services
- **PostgreSQL**: Persistent DB for core-service (healthcheck: pg_isready).
- **Redis**: Caching/session store for services (healthcheck: redis-cli ping).
- **Nginx**: Reverse proxy for frontend and api-gateway (healthcheck: wget /health).

### Environment Variables
See `.env.example` for configuration (e.g., DATABASE_URL, JWT_SECRET, REDIS_URL, OAUTH_CLIENT_ID). Copy to `.env` and customize for local/dev/prod.

### Development Configuration
- **docker-compose.dev.yml**: Hot-reload for backends (volumes on src), frontend dev server (vite), builder target for Node services.
- **Run**: `docker-compose -f docker-compose.dev.yml up` (or `docker-compose -f docker-compose.dev.yml up -d` for detached).
- **Ports**: Same as base, with volumes for code changes without rebuild.

### Production Configuration
- **docker-compose.prod.yml**: No source volumes, uses full builds, env vars from .env (e.g., ${DATABASE_URL}).
- **Run**: `docker-compose -f docker-compose.prod.yml up` (builds optimized images).
- **Security**: Use secrets for sensitive vars; no dev volumes.

### Health Checks
All services have /health endpoints (or DB/Redis pings) for compose condition: service_healthy, ensuring startup order (e.g., core waits for postgres).

### Nginx Config
Create `nginx.conf` for prod/dev (proxy_pass to api-gateway:3000; serve frontend static). Example:
```
events {}
http {
  server {
    listen 80;
    location / {
      proxy_pass http://api-gateway:3000;
    }
    location /static {
      root /usr/share/nginx/html;
    }
  }
}
```
For dev, use `nginx.dev.conf` with frontend dev server proxy if needed.

### Usage
- Install deps: `npm install`.
- Dev: `docker-compose -f docker-compose.dev.yml up`.
- Prod: Build and run with prod compose.
- Logs: `docker-compose logs -f service_name`.
- Scale: Add replicas in compose for prod.