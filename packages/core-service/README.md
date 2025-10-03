# Core Service

## Overview

The Core Service manages business logic and data persistence for Smart AI Hub using Node.js, Express, TypeScript, and Prisma ORM with PostgreSQL. It includes user management routes and DB connection.

## Setup Instructions

### Prerequisites

- Node.js 20+
- TypeScript 5+
- PostgreSQL 15+
- npm or yarn

### Installation

1. Navigate to the service directory:

   ```
   cd core-service
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Copy environment variables:

   ```
   cp .env.example .env
   ```

   Edit `.env` (e.g., DATABASE_URL).

4. Generate Prisma client:

   ```
   npm run prisma:generate
   ```

5. Run migrations (if schema changes):
   ```
   npm run prisma:migrate
   ```

### Development

1. Run in development mode (with hot-reload):

   ```
   npm run dev
   ```

   The server will start on PORT (default 3002).

2. Build for production:

   ```
   npm run build
   ```

3. Start production build:
   ```
   npm start
   ```

### Docker

1. Build the image:

   ```
   docker build -t core-service .
   ```

2. Run the container (with DB):
   ```
   docker run -p 3002:3002 -e NODE_ENV=production -e DATABASE_URL=postgresql://postgres:password@host:5432/smart_ai_hub core-service
   ```

### Endpoints

- `GET /health`: Health check with DB query (returns { status: 'OK' }).
- `GET /users`: Fetch all users.
- `POST /users`: Create user (body: { email, name }).

### Dependencies

- express: Web framework.
- prisma: ORM for PostgreSQL.
- @prisma/client: Prisma client.
- cors: Cross-origin resource sharing.

### TypeScript Configuration

Extends root `tsconfig.base.json` for consistency. Uses composite builds for monorepo integration.

### Prisma Schema

See `prisma/schema.prisma` for models (e.g., User).

### Troubleshooting

- If Prisma errors, ensure DATABASE_URL is correct and run `prisma generate`.
- For TS errors, ensure `@types/node` is installed.

For more details, see the main project README.
