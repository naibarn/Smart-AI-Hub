import { Router, Request, Response } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { agentService } from '../services/agent.service';
import {
  validateAgentData,
  validateUpdateAgentData,
  validateFlowDefinition,
  validateInputSchema,
  validateExternalUrl,
} from '../middleware/agentValidation.middleware';
import {
  checkAgentVisibility,
  canExecuteAgent,
  canEditAgent,
} from '../middleware/agentAccess.middleware';

const router = Router();

/**
 * POST /api/agents
 * Create a new agent with DRAFT status
 */
router.post(
  '/',
  authenticateJWT,
  validateAgentData,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to create an agent',
        });
      }

      const {
        name,
        description,
        category,
        icon,
        type,
        visibility,
        flowDefinition,
        inputSchema,
        outputSchema,
        executionConfig,
        metadata,
        externalUrl,
        organizationId,
        agencyId,
      } = req.body;

      const agent = await agentService.createAgent(req.user.id, {
        name,
        description,
        category,
        icon,
        type,
        visibility,
        flowDefinition,
        inputSchema,
        outputSchema,
        executionConfig,
        metadata,
        externalUrl,
        organizationId,
        agencyId,
      });

      res.status(201).json({
        success: true,
        message: 'Agent created successfully',
        data: agent,
      });
    } catch (error: any) {
      console.error('Error creating agent:', error);
      res.status(400).json({
        error: 'Failed to create agent',
        message: error.message || 'An error occurred while creating the agent',
      });
    }
  }
);

/**
 * PUT /api/agents/:id
 * Update an existing agent (only DRAFT or REJECTED status)
 */
router.put(
  '/:id',
  authenticateJWT,
  canEditAgent,
  validateUpdateAgentData,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to update an agent',
        });
      }

      const { id } = req.params;
      const {
        name,
        description,
        category,
        icon,
        flowDefinition,
        inputSchema,
        outputSchema,
        executionConfig,
        metadata,
        externalUrl,
      } = req.body;

      const agent = await agentService.updateAgent(id, req.user.id, {
        name,
        description,
        category,
        icon,
        flowDefinition,
        inputSchema,
        outputSchema,
        executionConfig,
        metadata,
        externalUrl,
      });

      res.json({
        success: true,
        message: 'Agent updated successfully',
        data: agent,
      });
    } catch (error: any) {
      console.error('Error updating agent:', error);

      if (error.message === 'Agent not found') {
        return res.status(404).json({
          error: 'Agent not found',
          message: 'The agent you are trying to update does not exist',
        });
      }

      if (
        error.message === 'Not authorized to update this agent' ||
        error.message === 'Can only update agents with DRAFT or REJECTED status'
      ) {
        return res.status(403).json({
          error: 'Access denied',
          message: error.message,
        });
      }

      res.status(400).json({
        error: 'Failed to update agent',
        message: error.message || 'An error occurred while updating the agent',
      });
    }
  }
);

/**
 * POST /api/agents/:id/submit
 * Submit agent for approval (DRAFT → PENDING)
 */
router.post('/:id/submit', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to submit an agent',
      });
    }

    const { id } = req.params;
    const agent = await agentService.submitForApproval(id, req.user.id);

    res.json({
      success: true,
      message: 'Agent submitted for approval successfully',
      data: agent,
    });
  } catch (error: any) {
    console.error('Error submitting agent for approval:', error);

    if (error.message === 'Agent not found') {
      return res.status(404).json({
        error: 'Agent not found',
        message: 'The agent you are trying to submit does not exist',
      });
    }

    if (
      error.message === 'Not authorized to submit this agent' ||
      error.message === 'Can only submit agents with DRAFT status'
    ) {
      return res.status(403).json({
        error: 'Access denied',
        message: error.message,
      });
    }

    res.status(400).json({
      error: 'Failed to submit agent for approval',
      message: error.message || 'An error occurred while submitting the agent for approval',
    });
  }
});

/**
 * DELETE /api/agents/:id
 * Delete an agent (only DRAFT status)
 */
router.delete(
  '/:id',
  authenticateJWT,
  canEditAgent,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to delete an agent',
        });
      }

      const { id } = req.params;
      const result = await agentService.deleteAgent(id, req.user.id);

      res.json({
        success: true,
        message: 'Agent deleted successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Error deleting agent:', error);

      if (error.message === 'Agent not found') {
        return res.status(404).json({
          error: 'Agent not found',
          message: 'The agent you are trying to delete does not exist',
        });
      }

      if (
        error.message === 'Not authorized to delete this agent' ||
        error.message === 'Can only delete agents with DRAFT status'
      ) {
        return res.status(403).json({
          error: 'Access denied',
          message: error.message,
        });
      }

      res.status(400).json({
        error: 'Failed to delete agent',
        message: error.message || 'An error occurred while deleting the agent',
      });
    }
  }
);

/**
 * GET /api/agents/my
 * Get user's agents with filtering and pagination
 */
router.get('/my', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to view your agents',
      });
    }

    const { page = 1, limit = 10, status, type, visibility, search } = req.query;

    const options = {
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 10,
      status: status as any,
      type: type as any,
      visibility: visibility as any,
      search: search as string,
    };

    const result = await agentService.getMyAgents(req.user.id, options);

    res.json({
      success: true,
      data: result.agents,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error getting user agents:', error);
    res.status(500).json({
      error: 'Failed to get agents',
      message: error.message || 'An error occurred while retrieving your agents',
    });
  }
});

/**
 * GET /api/agents/:id
 * Get agent by ID with permission check
 */
router.get(
  '/:id',
  authenticateJWT,
  checkAgentVisibility,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to view an agent',
        });
      }

      const { id } = req.params;
      const agent = await agentService.getAgentById(id, req.user.id);

      res.json({
        success: true,
        data: agent,
      });
    } catch (error: any) {
      console.error('Error getting agent by ID:', error);

      if (error.message === 'Agent not found') {
        return res.status(404).json({
          error: 'Agent not found',
          message: 'The agent you are trying to view does not exist',
        });
      }

      if (error.message === 'Not authorized to view this agent') {
        return res.status(403).json({
          error: 'Access denied',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Failed to get agent',
        message: error.message || 'An error occurred while retrieving the agent',
      });
    }
  }
);

export default router;
