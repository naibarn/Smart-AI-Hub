import { Router } from 'express';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkIfBlocked,
} from '../controllers/block.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requireUserVisibility } from '../middleware/visibilityCheckRaw';
import { createCustomRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Rate limiting for block operations (max 5 blocks per minute)
const blockRateLimit = createCustomRateLimiter(
  {
    guest: 1, // 1 block per minute for guests
    user: 5, // 5 blocks per minute for users
    manager: 10, // 10 blocks per minute for managers
    admin: 0, // No limit for admins
  },
  'block'
);

/**
 * POST /api/block/block
 * Block a user
 */
router.post('/block', blockRateLimit, blockUser);

/**
 * POST /api/block/unblock
 * Unblock a user
 */
router.post('/unblock', blockRateLimit, unblockUser);

/**
 * GET /api/block/blocked
 * Get list of blocked users
 */
router.get('/blocked', getBlockedUsers);

/**
 * GET /api/block/check/:targetUserId
 * Check if current user is blocked by target user
 */
router.get('/check/:targetUserId', requireUserVisibility, checkIfBlocked);

export default router;
