import { Router } from 'express';
import {
  createUserAuditLogHandler,
  getUserAuditLogsHandler,
  getAllAuditLogsHandler,
  getAuditStatisticsHandler,
  cleanupOldAuditLogsHandler,
} from '../controllers/user-audit.controller';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route POST /api/user-audit
 * @desc Create a user audit log entry
 * @access Private
 */
router.post('/', authenticateJWT, requireRole(['admin', 'moderator']), createUserAuditLogHandler);

/**
 * @route GET /api/user-audit/user/:userId
 * @desc Get audit logs for a specific user
 * @access Private
 */
router.get(
  '/user/:userId',
  authenticateJWT,
  requireRole(['admin', 'moderator']),
  getUserAuditLogsHandler
);

/**
 * @route GET /api/user-audit/all
 * @desc Get all audit logs (admin only)
 * @access Admin
 */
router.get('/all', authenticateJWT, requireRole(['admin']), getAllAuditLogsHandler);

/**
 * @route GET /api/user-audit/statistics
 * @desc Get audit statistics (admin only)
 * @access Admin
 */
router.get('/statistics', authenticateJWT, requireRole(['admin']), getAuditStatisticsHandler);

/**
 * @route DELETE /api/user-audit/cleanup
 * @desc Clean up old audit logs (admin only)
 * @access Admin
 */
router.delete('/cleanup', authenticateJWT, requireRole(['admin']), cleanupOldAuditLogsHandler);

export default router;
