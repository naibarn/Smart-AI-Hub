import { Request, Response } from 'express';
import { SkillsService } from '@/services/SkillsService';
import { ApiResponse, ErrorCode, HttpStatus } from '@/types';
import { logger } from '@/utils/logger';

export class SkillsController {
  constructor(private skillsService: SkillsService) {}

  /**
   * Get all categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.skillsService.getCategories();
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: categories,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getCategories controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get categories'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Get skills by category
   */
  async getSkillsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const { limit, offset, sortBy, sortOrder } = req.query;

      if (!categoryId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Category ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.skillsService.getSkillsByCategory(
        categoryId,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined,
        sortBy as string,
        sortOrder as 'asc' | 'desc'
      );
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getSkillsByCategory controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get skills'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Search skills
   */
  async searchSkills(req: Request, res: Response): Promise<void> {
    try {
      const { q, category, platform, minRating, maxPrice, limit, offset } = req.query;

      if (!q) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Search query is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.skillsService.searchSkills(
        q as string,
        {
          category: category as string,
          platform: platform as string,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined
        }
      );
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in searchSkills controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to search skills'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Get skill details
   */
  async getSkillDetails(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;

      if (!skillId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const skill = await this.skillsService.getSkillDetails(skillId);
      
      if (!skill) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Skill not found'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: skill,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getSkillDetails controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get skill details'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Create skill
   */
  async createSkill(req: Request, res: Response): Promise<void> {
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

      const skillData = req.body;

      const result = await this.skillsService.createSkill(userId, skillData);

      if (result.success) {
        res.status(HttpStatus.CREATED).json({
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
      logger.error('Error in createSkill controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to create skill'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Update skill
   */
  async updateSkill(req: Request, res: Response): Promise<void> {
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

      const { skillId } = req.params;
      const updates = req.body;

      if (!skillId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.skillsService.updateSkill(userId, skillId, updates);

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
      logger.error('Error in updateSkill controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update skill'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Submit skill for review
   */
  async submitSkillForReview(req: Request, res: Response): Promise<void> {
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

      const { skillId } = req.params;

      if (!skillId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.skillsService.submitSkillForReview(userId, skillId);

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
      logger.error('Error in submitSkillForReview controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to submit skill for review'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Approve skill (admin only)
   */
  async approveSkill(req: Request, res: Response): Promise<void> {
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

      const { skillId } = req.params;

      if (!skillId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.skillsService.approveSkill(userId, skillId);

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
      logger.error('Error in approveSkill controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to approve skill'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Reject skill (admin only)
   */
  async rejectSkill(req: Request, res: Response): Promise<void> {
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

      const { skillId } = req.params;
      const { reason } = req.body;

      if (!skillId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.skillsService.rejectSkill(userId, skillId, reason);

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
      logger.error('Error in rejectSkill controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to reject skill'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Rate skill
   */
  async rateSkill(req: Request, res: Response): Promise<void> {
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

      const { skillId } = req.params;
      const { rating, review } = req.body;

      if (!skillId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      if (!rating || rating < 1 || rating > 5) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Rating must be between 1 and 5'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.skillsService.rateSkill(userId, skillId, rating, review);

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
      logger.error('Error in rateSkill controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to rate skill'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Purchase skill
   */
  async purchaseSkill(req: Request, res: Response): Promise<void> {
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

      const { skillId } = req.params;
      const { version } = req.body;

      if (!skillId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill ID is required'
          },
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.skillsService.purchaseSkill(userId, skillId, version);

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
      logger.error('Error in purchaseSkill controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to purchase skill'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Get user's skills
   */
  async getUserSkills(req: Request, res: Response): Promise<void> {
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

      const { limit, offset } = req.query;

      const result = await this.skillsService.getUserSkills(
        userId,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getUserSkills controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get user skills'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }

  /**
   * Get skills pending review (admin only)
   */
  async getSkillsPendingReview(req: Request, res: Response): Promise<void> {
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

      const { limit, offset } = req.query;

      const result = await this.skillsService.getSkillsPendingReview(
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        timestamp: new Date()
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getSkillsPendingReview controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get skills pending review'
        },
        timestamp: new Date()
      } as ApiResponse);
    }
  }
}