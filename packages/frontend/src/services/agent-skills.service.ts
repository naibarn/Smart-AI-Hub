import { apiService } from './api.service';
import {
  AgentSkill,
  SkillVersion,
  SkillCategory,
  SkillReview,
  CreateSkillInput,
  UpdateSkillInput,
  CreateReviewInput,
  UpdateReviewInput,
  SkillSearchFilters,
  MarketplaceSkillsRequest,
  MarketplaceSkillsResponse,
  SkillDetailResponse,
  CreateSkillVersionRequest,
  CreateSkillVersionResponse,
  CreateReviewRequest,
  CreateReviewResponse,
  UpdateReviewRequest,
  UpdateReviewResponse,
  PendingSkillsResponse,
  ApproveSkillResponse,
  RejectSkillRequest,
  RejectSkillResponse,
  SkillAnalyticsResponse,
  SkillInstallation,
  InstallSkillResponse,
} from '@shared/types/agent-skills';

/**
 * Service for Agent Skills Marketplace operations
 */
class AgentSkillsService {
  /**
   * Get list of agent skills
   * @param params - Query parameters
   * @returns List of agent skills
   */
  async getSkills(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: AgentSkill[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: AgentSkill[]; total: number }>(
      `/api/agent-skills/skills?${queryParams.toString()}`
    );
  }

  /**
   * Get skill by ID
   * @param id - Skill ID
   * @returns Skill information
   */
  async getSkill(id: string): Promise<AgentSkill> {
    return apiService.get<AgentSkill>(`/api/agent-skills/skills/${id}`);
  }

  /**
   * Create a new skill submission
   * @param request - Skill creation request
   * @returns Created skill
   */
  async submitSkill(request: CreateSkillInput): Promise<AgentSkill> {
    return apiService.post<AgentSkill>('/api/agent-skills/skills', request);
  }

  /**
   * Update a skill
   * @param id - Skill ID
   * @param request - Update request
   * @returns Updated skill
   */
  async updateSkill(id: string, request: UpdateSkillInput): Promise<AgentSkill> {
    return apiService.patch<AgentSkill>(`/api/agent-skills/skills/${id}`, request);
  }

  /**
   * Delete a skill
   * @param id - Skill ID
   * @returns Success response
   */
  async deleteSkill(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/api/agent-skills/skills/${id}`);
  }

  /**
   * Get skill versions
   * @param skillId - Skill ID
   * @param params - Query parameters
   * @returns List of skill versions
   */
  async getSkillVersions(
    skillId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: SkillVersion[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: SkillVersion[]; total: number }>(
      `/api/agent-skills/skills/${skillId}/versions?${queryParams.toString()}`
    );
  }

  /**
   * Get skill version by ID
   * @param skillId - Skill ID
   * @param versionId - Version ID
   * @returns Skill version information
   */
  async getSkillVersion(skillId: string, versionId: string): Promise<SkillVersion> {
    return apiService.get<SkillVersion>(
      `/api/agent-skills/skills/${skillId}/versions/${versionId}`
    );
  }

  /**
   * Create a new skill version
   * @param skillId - Skill ID
   * @param request - Version creation request
   * @returns Created skill version
   */
  async createSkillVersion(
    skillId: string,
    request: CreateSkillVersionRequest
  ): Promise<CreateSkillVersionResponse> {
    return apiService.post<CreateSkillVersionResponse>(
      `/api/agent-skills/skills/${skillId}/versions`,
      request
    );
  }

  /**
   * Install a skill
   * @param skillId - Skill ID
   * @param versionId - Version ID (optional, defaults to latest)
   * @returns Installation response
   */
  async installSkill(skillId: string, versionId?: string): Promise<InstallSkillResponse> {
    const request = versionId ? { versionId } : {};
    return apiService.post<InstallSkillResponse>(
      `/api/agent-skills/skills/${skillId}/install`,
      request
    );
  }

  /**
   * Uninstall a skill
   * @param skillId - Skill ID
   * @returns Success response
   */
  async uninstallSkill(skillId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/api/agent-skills/skills/${skillId}/install`);
  }

  /**
   * Get skill categories
   * @returns List of skill categories
   */
  async getSkillCategories(): Promise<SkillCategory[]> {
    return apiService.get<SkillCategory[]>('/api/agent-skills/categories');
  }

  /**
   * Create a new skill category
   * @param request - Category creation request
   * @returns Created category
   */
  async createSkillCategory(request: {
    name: string;
    description: string;
    icon?: string;
    color?: string;
  }): Promise<SkillCategory> {
    return apiService.post<SkillCategory>('/api/agent-skills/categories', request);
  }

  /**
   * Update a skill category
   * @param id - Category ID
   * @param request - Update request
   * @returns Updated category
   */
  async updateSkillCategory(
    id: string,
    request: Partial<{
      name: string;
      description: string;
      icon: string;
      color: string;
    }>
  ): Promise<SkillCategory> {
    return apiService.patch<SkillCategory>(`/api/agent-skills/categories/${id}`, request);
  }

  /**
   * Delete a skill category
   * @param id - Category ID
   * @returns Success response
   */
  async deleteSkillCategory(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/api/agent-skills/categories/${id}`);
  }

  /**
   * Get skill reviews
   * @param skillId - Skill ID
   * @param params - Query parameters
   * @returns List of skill reviews
   */
  async getSkillReviews(
    skillId: string,
    params?: { page?: number; limit?: number; rating?: number }
  ): Promise<{ data: SkillReview[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: SkillReview[]; total: number }>(
      `/api/agent-skills/skills/${skillId}/reviews?${queryParams.toString()}`
    );
  }

  /**
   * Create a skill review
   * @param skillId - Skill ID
   * @param request - Review creation request
   * @returns Created review
   */
  async createSkillReview(
    skillId: string,
    request: {
      rating: number;
      comment: string;
    }
  ): Promise<SkillReview> {
    return apiService.post<SkillReview>(`/api/agent-skills/skills/${skillId}/reviews`, request);
  }

  /**
   * Update a skill review
   * @param skillId - Skill ID
   * @param reviewId - Review ID
   * @param request - Update request
   * @returns Updated review
   */
  async updateSkillReview(
    skillId: string,
    reviewId: string,
    request: {
      rating?: number;
      comment?: string;
    }
  ): Promise<SkillReview> {
    return apiService.patch<SkillReview>(
      `/api/agent-skills/skills/${skillId}/reviews/${reviewId}`,
      request
    );
  }

  /**
   * Delete a skill review
   * @param skillId - Skill ID
   * @param reviewId - Review ID
   * @returns Success response
   */
  async deleteSkillReview(skillId: string, reviewId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(
      `/api/agent-skills/skills/${skillId}/reviews/${reviewId}`
    );
  }

  /**
   * Search for skills
   * @param request - Search request
   * @returns Search response
   */
  async searchSkills(request: MarketplaceSkillsRequest): Promise<MarketplaceSkillsResponse> {
    return apiService.post<MarketplaceSkillsResponse>('/api/agent-skills/search', request);
  }

  /**
   * Get skills pending approval
   * @param params - Query parameters
   * @returns List of skills pending approval
   */
  async getSkillsPendingApproval(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: AgentSkill[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: AgentSkill[]; total: number }>(
      `/api/agent-skills/skills/pending-approval?${queryParams.toString()}`
    );
  }

  /**
   * Approve a skill
   * @param id - Skill ID
   * @returns Updated skill
   */
  async approveSkill(id: string): Promise<ApproveSkillResponse> {
    return apiService.post<ApproveSkillResponse>(`/api/agent-skills/skills/${id}/approve`);
  }

  /**
   * Reject a skill
   * @param id - Skill ID
   * @param request - Rejection request
   * @returns Updated skill
   */
  async rejectSkill(id: string, request: RejectSkillRequest): Promise<RejectSkillResponse> {
    return apiService.post<RejectSkillResponse>(`/api/agent-skills/skills/${id}/reject`, request);
  }

  /**
   * Get skill statistics
   * @returns Skill statistics
   */
  async getSkillStats(): Promise<SkillAnalyticsResponse> {
    return apiService.get<SkillAnalyticsResponse>('/api/agent-skills/stats');
  }

  /**
   * Get user's submitted skills
   * @param params - Query parameters
   * @returns List of user's submitted skills
   */
  async getUserSkills(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: AgentSkill[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: AgentSkill[]; total: number }>(
      `/api/agent-skills/user/skills?${queryParams.toString()}`
    );
  }

  /**
   * Get user's favorite skills
   * @param params - Query parameters
   * @returns List of user's favorite skills
   */
  async getUserFavoriteSkills(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: AgentSkill[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: AgentSkill[]; total: number }>(
      `/api/agent-skills/user/favorites?${queryParams.toString()}`
    );
  }

  /**
   * Add skill to favorites
   * @param skillId - Skill ID
   * @returns Success response
   */
  async addToFavorites(skillId: string): Promise<{ success: boolean }> {
    return apiService.post<{ success: boolean }>(`/api/agent-skills/user/favorites`, { skillId });
  }

  /**
   * Remove skill from favorites
   * @param skillId - Skill ID
   * @returns Success response
   */
  async removeFromFavorites(skillId: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/api/agent-skills/user/favorites/${skillId}`);
  }
}

export const agentSkillsService = new AgentSkillsService();
export default agentSkillsService;
