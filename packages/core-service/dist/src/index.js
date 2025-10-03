"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const credit_routes_1 = __importDefault(require("./routes/credit.routes"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const redis_1 = require("./config/redis");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api', credit_routes_1.default);
// Error handling middleware (must be last)
app.use(errorHandler_middleware_1.errorHandler);
// Health check with DB connection
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'OK' });
    }
    catch (error) {
        res.status(500).json({ error: 'DB connection failed' });
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