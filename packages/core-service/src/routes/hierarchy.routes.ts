import { Router } from 'express';
import {
  getHierarchyMembers,
  getHierarchyStats,
  getUserDetails,
  getHierarchyTree,
} from '../controllers/hierarchy.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { createCustomRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// Rate limiting for hierarchy operations
const hierarchyRateLimit = createCustomRateLimiter(
  {
    guest: 5, // 5 requests per minute for guests
    user: 30, // 30 requests per minute for users
    manager: 60, // 60 requests per minute for managers
    admin: 0, // No limit for admins
  },
  'hierarchy'
);

/**
 * GET /api/hierarchy/members
 * Get hierarchy members list with visibility filters
 */
router.get('/members', hierarchyRateLimit, getHierarchyMembers);

/**
 * GET /api/hierarchy/stats
 * Get hierarchy statistics
 */
router.get('/stats', hierarchyRateLimit, getHierarchyStats);

/**
 * GET /api/hierarchy/users/:userId
 * Get user details with visibility checks
 */
router.get('/users/:userId', hierarchyRateLimit, getUserDetails);

/**
 * GET /api/hierarchy/tree
 * Get hierarchy tree structure
 */
router.get('/tree', hierarchyRateLimit, getHierarchyTree);

export default router;
