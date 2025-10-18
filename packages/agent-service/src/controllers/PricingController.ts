import { Request, Response } from 'express';
import { PricingService } from '@/services/PricingService';
import { ApiResponse, ErrorCode, HttpStatus } from '@/types';
import { logger } from '@/utils/logger';

export class PricingController {
  constructor(private pricingService: PricingService) {}

  /**
   * Get all platforms
   */
  async getPlatforms(req: Request, res: Response): Promise<void> {
    try {
      const platforms = await this.pricingService.getPlatforms();
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: platforms,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getPlatforms controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get platforms'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Get models for a platform
   */
  async getModels(req: Request, res: Response): Promise<void> {
    try {
      const { platformId } = req.params;

      if (!platformId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Platform ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const models = await this.pricingService.getModels(platformId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: models,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getModels controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get models'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Get pricing rules for a model
   */
  async getPricingRules(req: Request, res: Response): Promise<void> {
    try {
      const { modelId } = req.params;

      if (!modelId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Model ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // We need platformId to get pricing rules, but we can get it from the model
      const models = await this.pricingService.getModels(''); // This would need to be implemented properly
      const model = models.find(m => m.id === modelId);
      
      if (!model) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Model not found'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const pricingRules = await this.pricingService.getPricingRules(model.platformId, modelId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: { rules: pricingRules },
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getPricingRules controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get pricing rules'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Estimate cost
   */
  async estimateCost(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const { platformId, modelId, estimatedInputTokens, estimatedOutputTokens, ragOperations, toolCalls } = req.body;

      if (!platformId || !modelId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Platform ID and Model ID are required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.pricingService.estimateCost(
        userId,
        platformId,
        modelId,
        {
          input: estimatedInputTokens,
          output: estimatedOutputTokens
        }
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in estimateCost controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to estimate cost'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Execute agent with cost tracking
   */
  async executeAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const { platformId, modelId, agentId, sessionId, parentCallId, input } = req.body;

      if (!platformId || !modelId || !input) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Platform ID, Model ID, and input are required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // This would integrate with actual agent execution
      // For now, return a mock response
      const mockResponse = {
        output: "Mock agent response",
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          ragEmbeddings: 2,
          ragSearches: 2,
          toolCalls: 1
        },
        cost: {
          totalCostUsd: 0.01,
          totalCredits: 1.0,
          breakdown: [
            {
              componentType: 'llm_input',
              units: 100,
              costPerUnit: 0.000003,
              totalCost: 0.0003,
              credits: 0.03
            },
            {
              componentType: 'llm_output',
              units: 50,
              costPerUnit: 0.000015,
              totalCost: 0.00075,
              credits: 0.075
            },
            {
              componentType: 'rag_embedding',
              units: 2,
              costPerUnit: 0.001,
              totalCost: 0.002,
              credits: 0.2
            },
            {
              componentType: 'rag_search',
              units: 2,
              costPerUnit: 0.0005,
              totalCost: 0.001,
              credits: 0.1
            },
            {
              componentType: 'tool_call',
              units: 1,
              costPerUnit: 0.005,
              totalCost: 0.005,
              credits: 0.5
            }
          ]
        },
        balanceAfter: 99.0
      };

      res.status(HttpStatus.OK).json({
        success: true,
        data: mockResponse,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in executeAgent controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to execute agent'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Get usage history
   */
  async getUsageHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const { from, to, limit, offset } = req.query;

      // This would query the usage logs
      // For now, return mock data
      const mockHistory = {
        logs: [],
        total: 0,
        summary: {
          totalCalls: 0,
          totalCredits: 0,
          totalCostUsd: 0
        }
      };

      res.status(HttpStatus.OK).json({
        success: true,
        data: mockHistory,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getUsageHistory controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get usage history'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Update pricing rule (admin only)
   */
  async updatePricingRule(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Check if user is admin
      if (req.user?.role !== 'admin') {
        res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Admin access required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const { ruleId } = req.params;
      const updates = req.body;

      if (!ruleId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Rule ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.pricingService.updatePricingRule(ruleId, updates);

      if (result.success) {
        res.status(HttpStatus.OK).json({
          ...result,
          timestamp: new Date()
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          ...result,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error in updatePricingRule controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update pricing rule'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Get pricing analytics (admin only)
   */
  async getPricingAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // Check if user is admin
      if (req.user?.role !== 'admin') {
        res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Admin access required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      // This would calculate analytics
      // For now, return mock data
      const mockAnalytics = {
        totalRevenue: 1000.0,
        totalCost: 600.0,
        profit: 400.0,
        profitMargin: 40.0,
        topModels: [],
        topUsers: []
      };

      res.status(HttpStatus.OK).json({
        success: true,
        data: mockAnalytics,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getPricingAnalytics controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get pricing analytics'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }
}