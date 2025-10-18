import { Router } from 'express';
import {
  searchUsersController,
  getUserSearchSuggestionsController,
  getPopularSearchFiltersController,
  clearSearchCacheController,
} from '../controllers/user-search.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

/**
 * @route GET /api/users/search
 * @desc Search users with advanced filters
 * @access Private (requires 'users:read' permission)
 */
router.get(
  '/search',
  authenticateJWT,
  requirePermission('users:read', 'users'),
  searchUsersController
);

/**
 * @route GET /api/users/search/suggestions
 * @desc Get user search suggestions
 * @access Private (requires 'users:read' permission)
 */
router.get(
  '/search/suggestions',
  authenticateJWT,
  requirePermission('users:read', 'users'),
  getUserSearchSuggestionsController
);

/**
 * @route GET /api/users/search/filters/popular
 * @desc Get popular search filters
 * @access Private (requires 'users:read' permission)
 */
router.get(
  '/search/filters/popular',
  authenticateJWT,
  requirePermission('users:read', 'users'),
  getPopularSearchFiltersController
);

/**
 * @route DELETE /api/users/search/cache
 * @desc Clear search cache
 * @access Private (requires 'users:manage' permission)
 */
router.delete(
  '/search/cache',
  authenticateJWT,
  requirePermission('users:manage', 'users'),
  clearSearchCacheController
);

export default router;
