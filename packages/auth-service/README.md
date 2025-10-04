# Auth Service

## Overview

The Auth Service handles authentication for Smart AI Hub using Node.js, Express, TypeScript, JWT for token management, and OAuth (Passport) for external providers like Google. It includes registration, login, and protected routes.

## Setup Instructions

### Prerequisites

- Node.js 20+
- TypeScript 5+
- npm or yarn

### Installation

1. Navigate to the service directory:

   ```
   cd auth-service
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Copy environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` (e.g., JWT_SECRET, OAUTH_CLIENT_ID).

### Development

1. Run in development mode (with hot-reload):

   ```
   npm run dev
   ```

   The server will start on PORT (default 3001).

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
   docker build -t auth-service .
   ```

2. Run the container:
   ```
   docker run -p 3001:3001 -e NODE_ENV=production auth-service
   ```

### Endpoints

- `GET /health`: Health check (returns { status: 'OK' }).
- `POST /register`: User registration (body: { email, password }).
- `POST /login`: User login (body: { email, password }).
- `GET /protected`: Protected route (requires JWT).

### Dependencies

- express: Web framework.
- jsonwebtoken: JWT handling.
- passport: OAuth/JWT strategies.
- bcryptjs: Password hashing.
- cors: Cross-origin resource sharing.

### TypeScript Configuration

Extends root `tsconfig.base.json` for consistency. Uses composite builds for monorepo integration.

### Troubleshooting

- If TS errors occur, ensure `@types/node` is installed and tsconfig paths are correct.
- For OAuth issues, verify client IDs/secrets in .env.

For more details, see the main project README.
