# MCP Server

## Overview
The MCP Server provides real-time communication for Smart AI Hub using Node.js, Express for HTTP, TypeScript, and WebSocket (ws library). It includes a health check and basic echo functionality for connections.

## Setup Instructions

### Prerequisites
- Node.js 20+
- TypeScript 5+
- npm or yarn

### Installation
1. Navigate to the service directory:
   ```
   cd mcp-server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` as needed (e.g., PORT=3003).

### Development
1. Run in development mode (with hot-reload):
   ```
   npm run dev
   ```
   The server will start on PORT (default 3003).

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
   docker build -t mcp-server .
   ```

2. Run the container:
   ```
   docker run -p 3003:3003 -e NODE_ENV=production mcp-server
   ```

### Endpoints
- `GET /health`: Health check (returns { status: 'OK' }).
- WebSocket: Connect to ws://localhost:3003 (echo messages, welcome on connect).

### Dependencies
- ws: WebSocket library.
- express: HTTP server.
- cors: Cross-origin resource sharing.

### TypeScript Configuration
Extends root `tsconfig.base.json` for consistency. Uses composite builds for monorepo integration.

### Troubleshooting
- If TS errors occur, ensure `@types/node` is installed and tsconfig paths are correct.
- For WS issues, check console logs for connection events.

For more details, see the main project README.