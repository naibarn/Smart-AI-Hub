import { Router, Request, Response } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { agentApprovalService } from '../services/agentApproval.service';
import {
  requireAdmin,
  requireApprovalPermissions,
  requireDashboardAccess,
  validateAdminAction,
  logAdminAction
} from '../middleware/admin.middleware';

const router = Router();

/**
 * GET /api/admin/agents/pending
 * Get all agents with PENDING status for admin review
 */
router.get('/agents/pending',
  authenticateJWT,
  requireApprovalPermissions,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to view pending agents',
        });
      }

      const {
        page = 1,
        limit = 10,
        type,
        search
      } = req.query;

      const options = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        type: type as string,
        search: search as string
      };

      const result = await agentApprovalService.getPendingAgents(options);

      res.json({
        success: true,
        data: result.agents,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error getting pending agents:', error);
      res.status(500).json({
        error: 'Failed to get pending agents',
        message: error.message || 'An error occurred while retrieving pending agents',
      });
    }
  }
);

/**
 * POST /api/admin/agents/:id/approve
 * Approve an agent (PENDING → APPROVED)
 */
router.post('/agents/:id/approve',
  authenticateJWT,
  requireApprovalPermissions,
  validateAdminAction,
  logAdminAction('APPROVE_AGENT'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to approve agents',
        });
      }

      const { id } = req.params;
      const { notes } = req.body;

      const agent = await agentApprovalService.approveAgent(id, req.user.id, notes);

      res.json({
        success: true,
        message: 'Agent approved successfully',
        data: agent
      });
    } catch (error: any) {
      console.error('Error approving agent:', error);
      
      if (error.message === 'Agent not found') {
        return res.status(404).json({
          error: 'Agent not found',
          message: 'The agent you are trying to approve does not exist',
        });
      }

      if (error.message === 'Can only approve agents with PENDING status') {
        return res.status(400).json({
          error: 'Invalid agent status',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Failed to approve agent',
        message: error.message || 'An error occurred while approving the agent',
      });
    }
  }
);

/**
 * POST /api/admin/agents/:id/reject
 * Reject an agent (PENDING → REJECTED)
 */
router.post('/agents/:id/reject',
  authenticateJWT,
  requireApprovalPermissions,
  validateAdminAction,
  logAdminAction('REJECT_AGENT'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to reject agents',
        });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const agent = await agentApprovalService.rejectAgent(id, req.user.id, reason);

      res.json({
        success: true,
        message: 'Agent rejected successfully',
        data: agent
      });
    } catch (error: any) {
      console.error('Error rejecting agent:', error);
      
      if (error.message === 'Agent not found') {
        return res.status(404).json({
          error: 'Agent not found',
          message: 'The agent you are trying to reject does not exist',
        });
      }

      if (error.message === 'Can only reject agents with PENDING status') {
        return res.status(400).json({
          error: 'Invalid agent status',
          message: error.message,
        });
      }

      if (error.message === 'Rejection reason is required') {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Failed to reject agent',
        message: error.message || 'An error occurred while rejecting the agent',
      });
    }
  }
);

/**
 * GET /api/admin/agents/:id/history
 * Get approval history for an agent
 */
router.get('/agents/:id/history',
  authenticateJWT,
  requireApprovalPermissions,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to view agent approval history',
        });
      }

      const { id } = req.params;
      const history = await agentApprovalService.getAgentApprovalHistory(id);

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      console.error('Error getting agent approval history:', error);
      res.status(500).json({
        error: 'Failed to get approval history',
        message: error.message || 'An error occurred while retrieving approval history',
      });
    }
  }
);

/**
 * GET /api/admin/dashboard/stats
 * Get approval statistics for admin dashboard
 */
router.get('/dashboard/stats',
  authenticateJWT,
  requireDashboardAccess,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to view dashboard statistics',
        });
      }

      const stats = await agentApprovalService.getApprovalStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error getting dashboard statistics:', error);
      res.status(500).json({
        error: 'Failed to get dashboard statistics',
        message: error.message || 'An error occurred while retrieving dashboard statistics',
      });
    }
  }
);

/**
 * GET /api/admin/agents/oldest-pending
 * Get agents waiting for approval the longest
 */
router.get('/agents/oldest-pending',
  authenticateJWT,
  requireApprovalPermissions,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to view oldest pending agents',
        });
      }

      const { limit = 5 } = req.query;
      const agents = await agentApprovalService.getOldestPendingAgents(parseInt(limit as string) || 5);

      res.json({
        success: true,
        data: agents
      });
    } catch (error: any) {
      console.error('Error getting oldest pending agents:', error);
      res.status(500).json({
        error: 'Failed to get oldest pending agents',
        message: error.message || 'An error occurred while retrieving oldest pending agents',
      });
    }
  }
);

/**
 * POST /api/admin/agents/bulk-approve
 * Bulk approve multiple agents
 */
router.post('/agents/bulk-approve',
  authenticateJWT,
  requireApprovalPermissions,
  validateAdminAction,
  logAdminAction('BULK_APPROVE_AGENTS'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to bulk approve agents',
        });
      }

      const { agentIds, notes } = req.body;

      const result = await agentApprovalService.bulkApproveAgents(agentIds, req.user.id, notes);

      res.json({
        success: true,
        message: `Successfully approved ${result.successCount} out of ${result.totalProcessed} agents`,
        data: result
      });
    } catch (error: any) {
      console.error('Error in bulk agent approval:', error);
      res.status(500).json({
        error: 'Failed to bulk approve agents',
        message: error.message || 'An error occurred while bulk approving agents',
      });
    }
  }
);

/**
 * POST /api/admin/agents/bulk-reject
 * Bulk reject multiple agents
 */
router.post('/agents/bulk-reject',
  authenticateJWT,
  requireApprovalPermissions,
  validateAdminAction,
  logAdminAction('BULK_REJECT_AGENTS'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to bulk reject agents',
        });
      }

      const { agentIds, reason } = req.body;

      const result = await agentApprovalService.bulkRejectAgents(agentIds, req.user.id, reason);

      res.json({
        success: true,
        message: `Successfully rejected ${result.successCount} out of ${result.totalProcessed} agents`,
        data: result
      });
    } catch (error: any) {
      console.error('Error in bulk agent rejection:', error);
      res.status(500).json({
        error: 'Failed to bulk reject agents',
        message: error.message || 'An error occurred while bulk rejecting agents',
      });
    }
  }
);

/**
 * GET /api/admin/audit-log
 * Get admin action audit log (placeholder for future implementation)
 */
router.get('/audit-log',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to view audit log',
        });
      }

      const {
        page = 1,
        limit = 50,
        action,
        startDate,
        endDate
      } = req.query;

      // This is a placeholder - in a real implementation, you would
      // store admin actions in a dedicated audit log table
      res.json({
        success: true,
        message: 'Audit log feature coming soon',
        data: {
          actions: [],
          pagination: {
            page: parseInt(page as string) || 1,
            limit: parseInt(limit as string) || 50,
            total: 0,
            pages: 0,
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting audit log:', error);
      res.status(500).json({
        error: 'Failed to get audit log',
        message: error.message || 'An error occurred while retrieving audit log',
      });
    }
  }
);

export default router;