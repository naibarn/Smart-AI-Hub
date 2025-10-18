import { Router } from 'express';
import ragRoutes from './rag';
import pricingRoutes from './pricing';
import skillsRoutes from './skills';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'agent-service',
    version: '1.0.0',
  });
});

// API routes
router.use('/rag', ragRoutes);
router.use('/pricing', pricingRoutes);
router.use('/skills', skillsRoutes);

export default router;
