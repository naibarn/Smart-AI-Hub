import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:3002';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:3004';
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:3005';

// Security middleware (API-specific - no CSP needed)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: process.env.NODE_ENV === 'production',
    },
  })
);

// CORS middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// API Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth Service Proxy
const authProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth', // Keep the same path
  },
});

// Core Service Proxy for credits
const creditsProxy = createProxyMiddleware({
  target: CORE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/mcp/v1/credits': '/api/mcp/v1/credits', // Keep the same path
  },
});

// OAuth Success Page Proxy
const oauthSuccessProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
});

// MCP Server Proxy (for WebSocket connections)
const mcpProxy = createProxyMiddleware({
  target: MCP_SERVER_URL,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  pathRewrite: {
    '^/api/mcp': '/api/mcp', // Keep the same path
  },
});

// Generic Core Service Proxy (for other core endpoints)
const coreProxy = createProxyMiddleware({
  target: CORE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/core': '/api', // Remove /api/core prefix
  },
});

// Generic Auth Service Proxy (for other auth endpoints)
const usersProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
});

const creditsAuthProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
});

// Analytics Service Proxy
const analyticsProxy = createProxyMiddleware({
  target: CORE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/analytics': '/api/v1/analytics', // Route to versioned analytics endpoints
  },
});

// RAG Service Proxy
const ragProxy = createProxyMiddleware({
  target: RAG_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/rag': '/api/rag', // Keep the same path
  },
});

// Agent Skills Marketplace Proxy
const marketplaceProxy = createProxyMiddleware({
  target: AGENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/marketplace': '/api/marketplace', // Keep the same path
  },
});

// Skills Management Proxy
const skillsProxy = createProxyMiddleware({
  target: AGENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/skills': '/api/skills', // Keep the same path
  },
});

// Pricing Service Proxy
const pricingProxy = createProxyMiddleware({
  target: CORE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/pricing': '/api/v1/pricing', // Route to versioned pricing endpoints
  },
});

// Agent Execution Proxy
const agentExecutionProxy = createProxyMiddleware({
  target: CORE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/agents': '/api/v1/agents', // Route to versioned agent endpoints
  },
});

// Apply proxy middleware with error handling
app.use('/api/auth', (req, res, next) => {
  authProxy(req, res, (err) => {
    if (err) {
      console.error('Auth Service Proxy Error:', err);
      return res.status(502).json({ error: 'Auth service unavailable' });
    }
    next();
  });
});

app.use('/api/mcp/v1/credits', (req, res, next) => {
  creditsProxy(req, res, (err) => {
    if (err) {
      console.error('Core Service Proxy Error:', err);
      return res.status(502).json({ error: 'Core service unavailable' });
    }
    next();
  });
});

app.use('/oauth-success.html', (req, res, next) => {
  oauthSuccessProxy(req, res, (err) => {
    if (err) {
      console.error('Auth Service Proxy Error:', err);
      return res.status(502).json({ error: 'Auth service unavailable' });
    }
    next();
  });
});

app.use('/api/mcp', (req, res, next) => {
  mcpProxy(req, res, (err) => {
    if (err) {
      console.error('MCP Server Proxy Error:', err);
      return res.status(502).json({ error: 'MCP server unavailable' });
    }
    next();
  });
});

app.use('/api/core', (req, res, next) => {
  coreProxy(req, res, (err) => {
    if (err) {
      console.error('Core Service Proxy Error:', err);
      return res.status(502).json({ error: 'Core service unavailable' });
    }
    next();
  });
});

app.use('/api/users', (req, res, next) => {
  usersProxy(req, res, (err) => {
    if (err) {
      console.error('Auth Service Proxy Error:', err);
      return res.status(502).json({ error: 'Auth service unavailable' });
    }
    next();
  });
});

app.use('/api/credits', (req, res, next) => {
  creditsAuthProxy(req, res, (err) => {
    if (err) {
      console.error('Auth Service Proxy Error:', err);
      return res.status(502).json({ error: 'Auth service unavailable' });
    }
    next();
  });
});

app.use('/api/analytics', (req, res, next) => {
  analyticsProxy(req, res, (err) => {
    if (err) {
      console.error('Core Service Proxy Error:', err);
      return res.status(502).json({ error: 'Analytics service unavailable' });
    }
    next();
  });
});

app.use('/api/rag', (req, res, next) => {
  ragProxy(req, res, (err) => {
    if (err) {
      console.error('RAG Service Proxy Error:', err);
      return res.status(502).json({ error: 'RAG service unavailable' });
    }
    next();
  });
});

app.use('/api/marketplace', (req, res, next) => {
  marketplaceProxy(req, res, (err) => {
    if (err) {
      console.error('Agent Service Proxy Error:', err);
      return res.status(502).json({ error: 'Agent service unavailable' });
    }
    next();
  });
});

app.use('/api/skills', (req, res, next) => {
  skillsProxy(req, res, (err) => {
    if (err) {
      console.error('Agent Service Proxy Error:', err);
      return res.status(502).json({ error: 'Agent service unavailable' });
    }
    next();
  });
});

app.use('/api/pricing', (req, res, next) => {
  pricingProxy(req, res, (err) => {
    if (err) {
      console.error('Core Service Proxy Error:', err);
      return res.status(502).json({ error: 'Pricing service unavailable' });
    }
    next();
  });
});

app.use('/api/agents', (req, res, next) => {
  agentExecutionProxy(req, res, (err) => {
    if (err) {
      console.error('Core Service Proxy Error:', err);
      return res.status(502).json({ error: 'Agent execution service unavailable' });
    }
    next();
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Auth Service: ${AUTH_SERVICE_URL}`);
  console.log(`Core Service: ${CORE_SERVICE_URL}`);
  console.log(`MCP Server: ${MCP_SERVER_URL}`);
  console.log(`RAG Service: ${RAG_SERVICE_URL}`);
  console.log(`Agent Service: ${AGENT_SERVICE_URL}`);
});

export default app;
