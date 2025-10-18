import {
  AgentSkill,
  SkillVersion,
  SkillCategory,
  SkillReview,
  SkillInstallation,
  SkillVisibility,
  SkillStatus,
  CreateSkillInput,
  UpdateSkillInput,
  CreateSkillVersionInput,
  CreateReviewInput,
  UpdateReviewInput,
  SkillSearchFilters,
  SkillSortOption,
  SearchResult,
  SkillDetailResponse,
  InstallSkillResponse,
  ReviewFilters,
  ReviewSortOption,
  PendingSkillApproval,
  ApprovalAction,
  SkillAnalytics,
  User,
  ApiResponse,
  ErrorCode,
} from '@/types';

export class SkillsService {
  /**
   * Create a new skill
   */
  async createSkill(userId: string, data: CreateSkillInput): Promise<ApiResponse<AgentSkill>> {
    try {
      // Check if user can create skills
      const canCreate = await this.canUserCreateSkill(userId);
      if (!canCreate) {
        return {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'User does not have permission to create skills',
          },
          timestamp: new Date(),
        };
      }

      // Generate unique slug
      const slug = await this.generateUniqueSlug(data.name);

      // Create skill
      const skill: AgentSkill = {
        id: this.generateId(),
        name: data.name,
        slug,
        description: data.description,
        longDescription: data.longDescription,
        creatorId: userId,
        categoryId: data.categoryId,
        platformId: data.platformId,
        visibility: data.visibility,
        organizationId: await this.getUserOrganizationId(userId),
        status: SkillStatus.DRAFT,
        installCount: 0,
        averageRating: 0,
        reviewCount: 0,
        iconUrl: undefined,
        screenshotUrls: [],
        tags: data.tags,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      await this.saveSkill(skill);

      return {
        success: true,
        data: skill,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error creating skill:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to create skill',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update a skill
   */
  async updateSkill(
    userId: string,
    skillId: string,
    data: UpdateSkillInput
  ): Promise<ApiResponse<AgentSkill>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.SKILL_NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Check if user is the owner or has permission
      if (skill.creatorId !== userId && !(await this.canUserEditSkill(userId, skillId))) {
        return {
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Only skill owner can update skill',
          },
          timestamp: new Date(),
        };
      }

      // Update skill
      if (data.name) {
        skill.name = data.name;
        skill.slug = await this.generateUniqueSlug(data.name, skillId);
      }
      if (data.description) skill.description = data.description;
      if (data.longDescription) skill.longDescription = data.longDescription;
      if (data.categoryId) skill.categoryId = data.categoryId;
      if (data.visibility) skill.visibility = data.visibility;
      if (data.iconUrl) skill.iconUrl = data.iconUrl;
      if (data.screenshotUrls) skill.screenshotUrls = data.screenshotUrls;
      if (data.tags) skill.tags = data.tags;

      skill.updatedAt = new Date();

      // Save to database
      await this.updateSkillInDatabase(skill);

      return {
        success: true,
        data: skill,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error updating skill:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update skill',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Upload a new version of a skill
   */
  async uploadSkillVersion(
    userId: string,
    skillId: string,
    version: string,
    changelog?: string,
    file?: Buffer
  ): Promise<ApiResponse<SkillVersion>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.SKILL_NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Check if user is the owner or has permission
      if (skill.creatorId !== userId && !(await this.canUserEditSkill(userId, skillId))) {
        return {
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Only skill owner can upload new versions',
          },
          timestamp: new Date(),
        };
      }

      // Check if version already exists
      const existingVersion = await this.getSkillVersion(skillId, version);
      if (existingVersion) {
        return {
          success: false,
          error: {
            code: ErrorCode.CONFLICT,
            message: 'Version already exists',
          },
          timestamp: new Date(),
        };
      }

      // Create version record
      const skillVersion: SkillVersion = {
        id: this.generateId(),
        skillId,
        version,
        changelog,
        fileUrl: '', // Will be set after file upload
        fileSize: file ? file.length : 0,
        fileHash: file ? this.generateFileHash(file) : '',
        isLatest: true,
        downloadCount: 0,
        createdAt: new Date(),
      };

      // Upload file to storage if provided
      if (file) {
        const uploadResult = await this.uploadSkillFile(skillId, version, file);
        if (uploadResult.success) {
          skillVersion.fileUrl = uploadResult.data!;
        } else {
          return {
            success: false,
            error: uploadResult.error,
            timestamp: new Date(),
          };
        }
      }

      // Mark previous versions as not latest
      await this.markPreviousVersionsNotLatest(skillId);

      // Save version to database
      await this.saveSkillVersion(skillVersion);

      return {
        success: true,
        data: skillVersion,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error uploading skill version:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to upload skill version',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Publish skill (submit for approval)
   */
  async publishSkill(userId: string, skillId: string): Promise<ApiResponse<AgentSkill>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.SKILL_NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Check if user is the owner
      if (skill.creatorId !== userId) {
        return {
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Only skill owner can publish skill',
          },
          timestamp: new Date(),
        };
      }

      // Check if skill has a version
      const latestVersion = await this.getLatestSkillVersion(skillId);
      if (!latestVersion) {
        return {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill must have at least one version before publishing',
          },
          timestamp: new Date(),
        };
      }

      // Update status to pending
      skill.status = SkillStatus.PENDING;
      skill.updatedAt = new Date();

      await this.updateSkillInDatabase(skill);

      // Notify admins for approval
      await this.notifyAdminsForApproval(skillId);

      return {
        success: true,
        data: skill,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error publishing skill:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to publish skill',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Search skills
   */
  async searchSkills(
    query: string,
    filters?: {
      category?: string;
      platform?: string;
      minRating?: number;
      maxPrice?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<SearchResult<AgentSkill>>> {
    try {
      const searchFilters: SkillSearchFilters = {
        q: query,
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
        category: filters?.category,
        platform: filters?.platform,
      };

      const skills = await this.searchSkillsInDatabase(searchFilters);
      const total = await this.countSkills(searchFilters);

      return {
        success: true,
        data: {
          items: skills,
          total,
          page: Math.floor((searchFilters.offset || 0) / (searchFilters.limit || 20)) + 1,
          pageSize: searchFilters.limit || 20,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error searching skills:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to search skills',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get skills by category
   */
  async getSkillsByCategory(
    categoryId: string,
    limit?: number,
    offset?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ApiResponse<SearchResult<AgentSkill>>> {
    try {
      const filters: SkillSearchFilters = {
        category: categoryId,
        limit,
        offset,
        sort: sortBy as any,
      };

      const skills = await this.searchSkillsInDatabase(filters);
      const total = await this.countSkills(filters);

      return {
        success: true,
        data: {
          items: skills,
          total,
          page: Math.floor((offset || 0) / (limit || 20)) + 1,
          pageSize: limit || 20,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting skills by category:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get skills by category',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get skill details
   */
  async getSkillDetails(
    skillId: string,
    userId?: string
  ): Promise<ApiResponse<SkillDetailResponse>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Check if user has access to the skill
      if (userId) {
        const hasAccess = await this.checkSkillAccess(userId, skill);
        if (!hasAccess) {
          return {
            success: false,
            error: {
              code: ErrorCode.ACCESS_DENIED,
              message: 'Access denied',
            },
            timestamp: new Date(),
          };
        }
      }

      // Get latest version
      const latestVersion = await this.getLatestSkillVersion(skillId);

      // Get reviews
      const reviews = await this.getSkillReviews(skillId);

      // Check if user has installed the skill
      const isInstalled = userId ? await this.isSkillInstalled(userId, skillId) : false;

      return {
        success: true,
        data: {
          skill,
          latestVersion: latestVersion!,
          reviews,
          isInstalled,
          installCount: skill.installCount,
          averageRating: skill.averageRating,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting skill details:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get skill details',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get user's skills
   */
  async getUserSkills(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<SearchResult<AgentSkill>>> {
    try {
      const skills = await this.getSkillsByUserId(userId, limit, offset);
      const total = await this.countUserSkills(userId);

      return {
        success: true,
        data: {
          items: skills,
          total,
          page: Math.floor((offset || 0) / (limit || 20)) + 1,
          pageSize: limit || 20,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting user skills:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get user skills',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Submit skill for review
   */
  async submitSkillForReview(userId: string, skillId: string): Promise<ApiResponse<AgentSkill>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Check if user is the owner
      if (skill.creatorId !== userId) {
        return {
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Only skill owner can submit for review',
          },
          timestamp: new Date(),
        };
      }

      // Update status to pending
      skill.status = SkillStatus.PENDING;
      skill.updatedAt = new Date();

      await this.updateSkillInDatabase(skill);

      // Notify admins for approval
      await this.notifyAdminsForApproval(skillId);

      return {
        success: true,
        data: skill,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error submitting skill for review:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to submit skill for review',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Approve skill (admin only)
   */
  async approveSkill(adminId: string, skillId: string): Promise<ApiResponse<AgentSkill>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Update status to approved
      skill.status = SkillStatus.APPROVED;
      skill.updatedAt = new Date();

      await this.updateSkillInDatabase(skill);

      // Notify skill creator
      await this.notifySkillCreator(skillId, 'approved');

      return {
        success: true,
        data: skill,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error approving skill:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to approve skill',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Reject skill (admin only)
   */
  async rejectSkill(
    adminId: string,
    skillId: string,
    reason?: string
  ): Promise<ApiResponse<AgentSkill>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Update status to rejected
      skill.status = SkillStatus.REJECTED;
      skill.updatedAt = new Date();

      await this.updateSkillInDatabase(skill);

      // Notify skill creator with reason
      await this.notifySkillCreator(skillId, 'rejected', reason);

      return {
        success: true,
        data: skill,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error rejecting skill:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to reject skill',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Rate skill
   */
  async rateSkill(
    userId: string,
    skillId: string,
    rating: number,
    review?: string
  ): Promise<ApiResponse<SkillReview>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Check if user has installed the skill
      const isInstalled = await this.isSkillInstalled(userId, skillId);
      if (!isInstalled) {
        return {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'You must install the skill before rating it',
          },
          timestamp: new Date(),
        };
      }

      // Check if user already rated
      const existingReview = await this.getUserReview(userId, skillId);
      if (existingReview) {
        return {
          success: false,
          error: {
            code: ErrorCode.CONFLICT,
            message: 'You have already rated this skill',
          },
          timestamp: new Date(),
        };
      }

      // Create review
      const newReview: SkillReview = {
        id: this.generateId(),
        skillId,
        userId,
        rating,
        comment: review,
        isVerified: false,
        helpfulCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveReview(newReview);

      // Update skill rating
      await this.updateSkillRating(skillId);

      return {
        success: true,
        data: newReview,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error rating skill:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to rate skill',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Purchase skill
   */
  async purchaseSkill(
    userId: string,
    skillId: string,
    version?: string
  ): Promise<ApiResponse<InstallSkillResponse>> {
    try {
      const skill = await this.getSkillById(skillId);
      if (!skill) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Skill not found',
          },
          timestamp: new Date(),
        };
      }

      // Check if skill is approved
      if (skill.status !== SkillStatus.APPROVED) {
        return {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Skill is not available for purchase',
          },
          timestamp: new Date(),
        };
      }

      // Check if user already has the skill
      const alreadyInstalled = await this.isSkillInstalled(userId, skillId);
      if (alreadyInstalled) {
        return {
          success: false,
          error: {
            code: ErrorCode.CONFLICT,
            message: 'You already have this skill',
          },
          timestamp: new Date(),
        };
      }

      // Get version to install
      const skillVersion = version
        ? await this.getSkillVersion(skillId, version)
        : await this.getLatestSkillVersion(skillId);

      if (!skillVersion) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Skill version not found',
          },
          timestamp: new Date(),
        };
      }

      // Process payment (if skill is not free)
      // This would integrate with payment system

      // Create installation record
      const installation: SkillInstallation = {
        id: this.generateId(),
        skillId,
        userId,
        versionId: skillVersion.id,
        installedAt: new Date(),
        usageCount: 0,
      };

      await this.saveInstallation(installation);

      // Update install count
      skill.installCount += 1;
      await this.updateSkillInDatabase(skill);

      return {
        success: true,
        data: {
          installation,
          downloadUrl: skillVersion.fileUrl,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error purchasing skill:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to purchase skill',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get skills pending review (admin only)
   */
  async getSkillsPendingReview(
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<SearchResult<AgentSkill>>> {
    try {
      const skills = await this.getPendingSkills(limit, offset);
      const total = await this.countPendingSkills();

      return {
        success: true,
        data: {
          items: skills,
          total,
          page: Math.floor((offset || 0) / (limit || 20)) + 1,
          pageSize: limit || 20,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting skills pending review:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get skills pending review',
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<ApiResponse<SkillCategory[]>> {
    try {
      const categories = await this.getAllCategories();

      return {
        success: true,
        data: categories,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get categories',
        },
        timestamp: new Date(),
      };
    }
  }

  // Private helper methods

  private generateId(): string {
    return `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    // Implementation would generate unique slug from name
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
  }

  private generateFileHash(file: Buffer): string {
    // Implementation would generate file hash
    return 'hash_' + Date.now();
  }

  private async canUserCreateSkill(userId: string): Promise<boolean> {
    // Implementation would check user permissions
    return true;
  }

  private async canUserEditSkill(userId: string, skillId: string): Promise<boolean> {
    // Implementation would check if user can edit skill (admin, etc.)
    return false;
  }

  private async getUserOrganizationId(userId: string): Promise<string | undefined> {
    // Implementation would get user's organization
    return undefined;
  }

  private async checkSkillAccess(userId: string, skill: AgentSkill): Promise<boolean> {
    // Implementation would check if user has access to skill based on visibility
    return true;
  }

  private async isSkillInstalled(userId: string, skillId: string): Promise<boolean> {
    // Implementation would check if user has installed the skill
    return false;
  }

  private async notifyAdminsForApproval(skillId: string): Promise<void> {
    // Implementation would notify admins
  }

  // Database methods (placeholders)

  private async saveSkill(skill: AgentSkill): Promise<void> {
    // Implementation would save to database
  }

  private async updateSkillInDatabase(skill: AgentSkill): Promise<void> {
    // Implementation would update in database
  }

  private async getSkillById(skillId: string): Promise<AgentSkill | null> {
    // Implementation would query from database
    return null;
  }

  private async getSkillsByUserId(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<AgentSkill[]> {
    // Implementation would query from database
    return [];
  }

  private async countUserSkills(userId: string): Promise<number> {
    // Implementation would count user skills in database
    return 0;
  }

  private async getUserReview(userId: string, skillId: string): Promise<SkillReview | null> {
    // Implementation would query from database
    return null;
  }

  private async saveReview(review: SkillReview): Promise<void> {
    // Implementation would save to database
  }

  private async updateSkillRating(skillId: string): Promise<void> {
    // Implementation would recalculate and update skill rating
  }

  private async saveInstallation(installation: SkillInstallation): Promise<void> {
    // Implementation would save to database
  }

  private async getPendingSkills(limit?: number, offset?: number): Promise<AgentSkill[]> {
    // Implementation would query from database
    return [];
  }

  private async countPendingSkills(): Promise<number> {
    // Implementation would count in database
    return 0;
  }

  private async notifySkillCreator(
    skillId: string,
    action: 'approved' | 'rejected',
    reason?: string
  ): Promise<void> {
    // Implementation would notify skill creator
  }

  private async searchSkillsInDatabase(filters: SkillSearchFilters): Promise<AgentSkill[]> {
    // Implementation would search in database
    return [];
  }

  private async countSkills(filters: SkillSearchFilters): Promise<number> {
    // Implementation would count in database
    return 0;
  }

  private async getAllCategories(): Promise<SkillCategory[]> {
    // Implementation would query from database
    return [];
  }

  private async getSkillVersion(skillId: string, version: string): Promise<SkillVersion | null> {
    // Implementation would query from database
    return null;
  }

  private async getLatestSkillVersion(skillId: string): Promise<SkillVersion | null> {
    // Implementation would query from database
    return null;
  }

  private async saveSkillVersion(version: SkillVersion): Promise<void> {
    // Implementation would save to database
  }

  private async markPreviousVersionsNotLatest(skillId: string): Promise<void> {
    // Implementation would update previous versions
  }

  private async getSkillReviews(skillId: string): Promise<SkillReview[]> {
    // Implementation would query from database
    return [];
  }

  private async uploadSkillFile(
    skillId: string,
    version: string,
    file: Buffer
  ): Promise<ApiResponse<string>> {
    // Implementation would upload file to storage
    return {
      success: true,
      data: `https://storage.example.com/skills/${skillId}/${version}`,
      timestamp: new Date(),
    };
  }
}
