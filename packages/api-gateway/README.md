# API Gateway Service

## Overview
The API Gateway serves as the entry point for all requests in the Smart AI Hub, using Express.js with TypeScript. It handles CORS, proxies requests to other services (auth, core, mcp), and provides a health check endpoint.

## Setup Instructions

### Prerequisites
- Node.js 20+
- TypeScript 5+
- npm or yarn

### Installation
1. Navigate to the service directory:
   ```
   cd api-gateway
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` as needed (e.g., PORT=3000).

### Development
1. Run in development mode (with hot-reload):
   ```
   npm run dev
   ```
   The server will start on PORT (default 3000).

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
   docker build -t api-gateway .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 -e NODE_ENV=production api-gateway
   ```

### Endpoints
- `GET /health`: Health check (returns { status: 'OK' }).
- `GET /api/auth/*`: Proxy to auth-service.
- `GET /api/core/*`: Proxy to core-service.
- `GET /api/mcp/*`: Proxy to mcp-server.

### Dependencies
- express: Web framework.
- cors: Cross-origin resource sharing.
- http-proxy-middleware: Request proxying.

### TypeScript Configuration
Extends root `tsconfig.base.json` for consistency. Uses composite builds for monorepo integration.

### Troubleshooting
- If TS errors occur, ensure `@types/node` is installed and tsconfig paths are correct.
- For proxy issues, check service URLs in code.

For more details, see the main project README.