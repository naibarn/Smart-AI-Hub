// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import monitoring and security
const { initializeMetrics, createMetricsEndpoint, createHealthCheckEndpoint, createMetricsMiddleware } = require('@smart-ai-hub/shared/monitoring');
const { apiSecurityHeaders } = require('@smart-ai-hub/shared/security/headers');

// Import Redis connection
const { connectRedis } = require('./config/redis');

// Import Passport configuration
const passport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth.routes');
const oauthRoutes = require('./routes/oauth.routes');
const sessionRoutes = require('./routes/session.routes');
const userRoutes = require('./routes/user.routes');
const creditRoutes = require('./routes/credit.routes');
const securityRoutes = require('./routes/security.routes');
const securityStatusRoutes = require('./routes/security-status.routes');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const requestIdMiddleware = require('./middleware/requestId');
const { rateLimiter } = require('./middleware/rateLimiter');

// Initialize monitoring
const metrics = initializeMetrics({
  serviceName: 'auth-service',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  defaultLabels: {
    service: 'auth-service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
});

// Create Express app
const app = express();

// Security middleware (API-specific - no CSP needed)
app.use(apiSecurityHeaders);

// Metrics middleware (before routes)
app.use(createMetricsMiddleware(metrics));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static('public'));

// Request ID middleware (must be before auth)
app.use(requestIdMiddleware);

// Initialize Passport
app.use(passport.initialize());

// Rate limiting middleware
app.use(rateLimiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Metrics endpoint
app.get('/metrics', createMetricsEndpoint(metrics));

// Enhanced health check endpoint
app.get('/health', createHealthCheckEndpoint(metrics));

// API Routes - Versioned (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', oauthRoutes);
app.use('/api/v1/auth', sessionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/credits', creditRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/security', securityStatusRoutes);

// Legacy routes for backward compatibility with deprecation headers
app.use('/api/auth', (req, res, next) => {
  // Set deprecation headers
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', '</api/v1/auth' + req.url + '>; rel="successor-version"');
  
  // Forward to versioned routes
  req.url = '/api/v1/auth' + req.url;
  next();
}, authRoutes);

app.use('/api/users', (req, res, next) => {
  // Set deprecation headers
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', '</api/v1/users' + req.url + '>; rel="successor-version"');
  
  // Forward to versioned routes
  req.url = '/api/v1/users' + req.url;
  next();
}, userRoutes);

app.use('/api/credits', (req, res, next) => {
  // Set deprecation headers
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
  res.setHeader('Link', '</api/v1/credits' + req.url + '>; rel="successor-version"');
  
  // Forward to versioned routes
  req.url = '/api/v1/credits' + req.url;
  next();
}, creditRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize Redis connection
const initializeApp = async () => {
  try {
    await connectRedis();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    // Continue running even if Redis fails
  }
};

// Call initialization
initializeApp();

module.exports = app;