"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const shared_1 = require("@smart-ai-hub/shared");
const credit_routes_1 = __importDefault(require("./routes/credit.routes"));
const point_routes_1 = __importDefault(require("./routes/point.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const monitoring_routes_1 = __importDefault(require("./routes/monitoring.routes"));
const transfer_routes_1 = __importDefault(require("./routes/transfer.routes"));
const referral_routes_1 = __importDefault(require("./routes/referral.routes"));
const block_routes_1 = __importDefault(require("./routes/block.routes"));
const hierarchy_routes_1 = __importDefault(require("./routes/hierarchy.routes"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const requestId_1 = require("./middlewares/requestId");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const redis_1 = require("./config/redis");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// Initialize monitoring
const metrics = (0, shared_1.initializeMetrics)({
    serviceName: 'core-service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: typeof PORT === 'string' ? parseInt(PORT, 10) : PORT,
    defaultLabels: {
        service: 'core-service',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    },
});
// Security middleware (API-specific - no CSP needed)
app.use(shared_1.apiSecurityHeaders);
// CORS middleware
app.use((0, cors_1.default)());
// Basic metrics middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route?.path || req.path || 'unknown';
        // Record basic metrics
        metrics.incrementHttpRequests(req.method, route, res.statusCode);
        metrics.recordHttpRequestDuration(req.method, route, res.statusCode, duration);
    });
    next();
});
// Raw body parser for Stripe webhooks (must be before express.json)
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use('/api/payments/stripe-webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
// Request ID middleware (must be before auth)
app.use(requestId_1.requestIdMiddleware);
// Rate limiting middleware
app.use(rateLimiter_1.rateLimiter);
// Routes - Versioned (v1)
app.use('/api/v1', credit_routes_1.default);
app.use('/api/v1', point_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/monitoring', monitoring_routes_1.default);
app.use('/api/v1/transfer', transfer_routes_1.default);
app.use('/api/v1/referral', referral_routes_1.default);
app.use('/api/v1/block', block_routes_1.default);
app.use('/api/v1/hierarchy', hierarchy_routes_1.default);
// Legacy routes for backward compatibility with deprecation headers
app.use('/api', (req, res, next) => {
    // Set deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
    res.setHeader('Link', '</api/v1' + req.url + '>; rel="successor-version"');
    // Forward to versioned routes
    req.url = '/api/v1' + req.url;
    next();
}, credit_routes_1.default);
// Legacy point routes for backward compatibility
app.use('/api', (req, res, next) => {
    // Set deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
    res.setHeader('Link', '</api/v1' + req.url + '>; rel="successor-version"');
    // Forward to versioned routes
    req.url = '/api/v1' + req.url;
    next();
}, point_routes_1.default);
// Legacy analytics routes for backward compatibility
app.use('/api/analytics', (req, res, next) => {
    // Set deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days from now
    res.setHeader('Link', '</api/v1/analytics' + req.url + '>; rel="successor-version"');
    // Forward to versioned routes
    req.url = '/api/v1/analytics' + req.url;
    next();
}, analytics_routes_1.default);
// Error handling middleware (must be last)
app.use(errorHandler_middleware_1.errorHandler);
// Metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        const metricsText = await metrics.getMetricsAsText();
        res.set('Content-Type', 'text/plain');
        res.send(metricsText);
    }
    catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).send('Error generating metrics');
    }
});
// Enhanced health check endpoint
app.get('/health', async (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            service: 'core-service',
        };
        // Test database connection
        await prisma.$queryRaw `SELECT 1`;
        healthStatus.database = 'connected';
        res.json(healthStatus);
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Basic users route
app.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
app.post('/users', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.create({
            data: { email },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});
app.listen(PORT, async () => {
    await prisma.$connect();
    // Initialize Redis connection
    await (0, redis_1.connectRedis)();
    console.log(`Core Service running on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await (0, redis_1.disconnectRedis)();
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await (0, redis_1.disconnectRedis)();
    await prisma.$disconnect();
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map