import { Request, Response } from 'express';
import { agentService } from '../services/agent.service';
import { agentUsageService } from '../services/agentUsage.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AgentController {
  /**
   * Create a new agent
   */
  async createAgent(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const agentData = req.body;

      const agent = await agentService.createAgent(userId, agentData);

      res.status(201).json({
        success: true,
        data: agent,
        message: 'Agent created successfully',
      });
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create agent',
      });
    }
  }

  /**
   * Update an existing agent
   */
  async updateAgent(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { agentId } = req.params;
      const updateData = req.body;

      const agent = await agentService.updateAgent(agentId, userId, updateData);

      res.json({
        success: true,
        data: agent,
        message: 'Agent updated successfully',
      });
    } catch (error) {
      console.error('Error updating agent:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update agent',
      });
    }
  }

  /**
   * Delete an agent
   */
  async deleteAgent(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { agentId } = req.params;

      const result = await agentService.deleteAgent(agentId, userId);

      res.json({
        success: true,
        data: result,
        message: 'Agent deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting agent:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete agent',
      });
    }
  }

  /**
   * Get user's agents
   */
  async getMyAgents(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const options = req.query;

      const result = await agentService.getMyAgents(userId, options as any);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error getting user agents:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agents',
      });
    }
  }

  /**
   * Get agent by ID
   */
  async getAgentById(req: AuthenticatedRequest, res: Response) {
    try {
      const { agentId } = req.params;
      const userId = req.user?.id;

      const agent = await agentService.getAgentById(agentId, userId);

      res.json({
        success: true,
        data: agent,
      });
    } catch (error) {
      console.error('Error getting agent:', error);
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Agent not found',
      });
    }
  }

  /**
   * Submit agent for approval
   */
  async submitForApproval(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { agentId } = req.params;

      const agent = await agentService.submitForApproval(agentId, userId);

      res.json({
        success: true,
        data: agent,
        message: 'Agent submitted for approval',
      });
    } catch (error) {
      console.error('Error submitting agent for approval:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit agent',
      });
    }
  }

  /**
   * Run external agent (Custom GPT or Gemini Gem) - redirects to external URL
   */
  async runExternalAgent(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { agentId } = req.params;
      const inputData = req.body;

      // Get agent details
      const agent = await agentService.getAgentById(agentId, userId);

      // Check if agent is external type
      if (agent.type !== 'CUSTOMGPT' && agent.type !== 'GEMINI_GEM') {
        return res.status(400).json({
          success: false,
          message: 'This endpoint is only for external agents (Custom GPT or Gemini Gem)',
        });
      }

      // Check if user can use this agent
      const canUse = await agentUsageService.canUseAgent(agentId, userId);
      if (!canUse) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to use this agent',
        });
      }

      // Log usage (no credits deducted for external agents)
      await agentUsageService.logAgentUsage({
        agentId,
        userId,
        inputData,
        status: 'redirected',
        tokensUsed: 0,
        costInCredits: 0,
        executionTime: 0,
      });

      // Return the external URL for frontend to handle redirect
      res.json({
        success: true,
        data: {
          externalUrl: agent.externalUrl,
          agentType: agent.type,
          agentName: agent.name,
        },
        message: 'External agent access logged successfully',
      });
    } catch (error) {
      console.error('Error running external agent:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to run external agent',
      });
    }
  }

  /**
   * Get agent usage statistics
   */
  async getAgentUsageStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { agentId } = req.params;
      const userId = req.user?.id;

      const stats = await agentUsageService.getAgentUsageStats(agentId, userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting agent usage stats:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get usage stats',
      });
    }
  }

  /**
   * Get user's agent usage history
   */
  async getUserAgentUsageHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const options = req.query;

      const result = await agentUsageService.getUserAgentUsageHistory(userId, options as any);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error getting user agent usage history:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get usage history',
      });
    }
  }
}

export const agentController = new AgentController();