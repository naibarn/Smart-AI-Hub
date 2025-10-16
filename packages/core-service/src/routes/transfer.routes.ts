import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireUserVisibility } from '../middleware/visibilityCheckRaw';
import { createCustomRateLimiter } from '../middlewares/rateLimiter';
import transferController from '../controllers/transfer.controller';

const router = Router();

// Apply authentication to all transfer routes
router.use(authenticateJWT);

// Rate limiting for transfer endpoints (max 10 transfers per minute)
const transferRateLimit = createCustomRateLimiter(
  {
    guest: 2, // 2 transfers per minute for guests
    user: 10, // 10 transfers per minute for users
    manager: 20, // 20 transfers per minute for managers
    admin: 0, // No limit for admins
  },
  'transfer'
);

/**
 * POST /api/transfer/points
 * Transfer points to another user
 */
router.post('/points', 
  transferRateLimit,
  transferController.transferPoints
);

/**
 * POST /api/transfer/credits
 * Transfer credits to another user
 */
router.post('/credits', 
  transferRateLimit,
  transferController.transferCredits
);

/**
 * GET /api/transfer/history
 * View transfer history for the current user
 */
router.get('/history', 
  transferController.getTransferHistory
);

/**
 * GET /api/transfer/validate
 * Check if transfer is allowed to a specific user
 */
router.get('/validate', 
  transferController.validateTransfer
);

export default router;