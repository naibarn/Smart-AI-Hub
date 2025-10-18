/**
 * Agent Skills Marketplace Types
 * Types for Agent Skills Marketplace Integration
 */

// Skill visibility levels
export enum SkillVisibility {
  PUBLIC = 'public',
  ORGANIZATION = 'organization',
  PRIVATE = 'private',
}

// Skill status
export enum SkillStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

// Agent skill
export interface AgentSkill {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  creatorId: string;
  categoryId: string;
  platformId: string;
  
  // Visibility
  visibility: SkillVisibility;
  organizationId?: string;
  
  // Status
  status: SkillStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Metrics
  installCount: number;
  averageRating: number;
  reviewCount: number;
  
  // Media
  iconUrl?: string;
  screenshotUrls: string[];
  
  // Metadata
  tags: string[];
  metadata: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

// Skill version
export interface SkillVersion {
  id: string;
  skillId: string;
  version: string; // 1.0.0
  changelog?: string;
  fileUrl: string;
  fileSize: number; // bytes
  fileHash: string;
  isLatest: boolean;
  downloadCount: number;
  createdAt: Date;
}

// Skill category
export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  parentId?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Skill review
export interface SkillReview {
  id: string;
  skillId: string;
  userId: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  isVerified: boolean; // verified purchase
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Skill installation
export interface SkillInstallation {
  id: string;
  skillId: string;
  userId: string;
  versionId: string;
  installedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

// Create skill input
export interface CreateSkillInput {
  name: string;
  description: string;
  longDescription?: string;
  categoryId: string;
  platformId: string;
  visibility: SkillVisibility;
  tags: string[];
}

// Update skill input
export interface UpdateSkillInput {
  name?: string;
  description?: string;
  longDescription?: string;
  categoryId?: string;
  visibility?: SkillVisibility;
  tags?: string[];
}

// Create review input
export interface CreateReviewInput {
  rating: number;
  title?: string;
  comment?: string;
}

// Update review input
export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
}

// Skill search filters
export interface SkillSearchFilters {
  q?: string; // search query
  category?: string;
  platform?: string;
  tags?: string[];
  visibility?: SkillVisibility;
  status?: SkillStatus;
  sort?: 'popular' | 'newest' | 'highest_rated' | 'name';
  limit?: number;
  offset?: number;
}

// Search result
export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Skill service interfaces
export interface SkillsService {
  createSkill(userId: string, data: CreateSkillInput): Promise<AgentSkill>;
  updateSkill(skillId: string, userId: string, data: UpdateSkillInput): Promise<AgentSkill>;
  publishSkill(skillId: string, userId: string): Promise<AgentSkill>;
  uploadVersion(
    skillId: string,
    userId: string,
    version: string,
    changelog: string,
    file: File | Buffer
  ): Promise<SkillVersion>;
  getSkillById(skillId: string): Promise<AgentSkill>;
  searchSkills(filters: SkillSearchFilters): Promise<SearchResult<AgentSkill>>;
  getMySkills(userId: string): Promise<AgentSkill[]>;
}

// Skill installation service interfaces
export interface SkillInstallationService {
  installSkill(userId: string, skillId: string): Promise<SkillInstallation>;
  uninstallSkill(userId: string, skillId: string): Promise<void>;
  getInstalledSkills(userId: string): Promise<AgentSkill[]>;
  trackUsage(userId: string, skillId: string): Promise<void>;
}

// Skill review service interfaces
export interface SkillReviewService {
  createReview(
    userId: string,
    skillId: string,
    data: CreateReviewInput
  ): Promise<SkillReview>;
  updateReview(
    reviewId: string,
    userId: string,
    data: UpdateReviewInput
  ): Promise<SkillReview>;
  deleteReview(reviewId: string, userId: string): Promise<void>;
  markHelpful(reviewId: string, userId: string): Promise<void>;
  getSkillReviews(
    skillId: string,
    filters: ReviewFilters
  ): Promise<SkillReview[]>;
}

// Review filters
export interface ReviewFilters {
  rating?: number;
  verified?: boolean;
  sort?: 'newest' | 'oldest' | 'helpful' | 'rating';
  limit?: number;
  offset?: number;
}

// Admin service interfaces
export interface AdminSkillsService {
  getPendingSkills(): Promise<AgentSkill[]>;
  approveSkill(skillId: string, adminId: string): Promise<AgentSkill>;
  rejectSkill(skillId: string, adminId: string, reason: string): Promise<AgentSkill>;
  getSkillAnalytics(filters: AnalyticsFilters): Promise<SkillAnalytics>;
}

// Analytics filters
export interface AnalyticsFilters {
  from?: Date;
  to?: Date;
  categoryId?: string;
  platformId?: string;
}

// Skill analytics
export interface SkillAnalytics {
  totalSkills: number;
  totalDownloads: number;
  totalReviews: number;
  averageRating: number;
  topCategories: CategoryStats[];
  topPlatforms: PlatformStats[];
  recentActivity: ActivityItem[];
}

// Category stats
export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  skillCount: number;
  downloadCount: number;
  averageRating: number;
}

// Platform stats
export interface PlatformStats {
  platformId: string;
  platformName: string;
  skillCount: number;
  downloadCount: number;
  averageRating: number;
}

// Activity item
export interface ActivityItem {
  type: 'skill_created' | 'skill_installed' | 'review_added';
  skillId: string;
  skillName: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

// API request/response types
export interface MarketplaceSkillsRequest {
  q?: string;
  category?: string;
  platform?: string;
  sort?: 'popular' | 'newest' | 'highest_rated' | 'name';
  limit?: number;
  offset?: number;
}

export interface MarketplaceSkillsResponse {
  skills: AgentSkill[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SkillDetailResponse {
  skill: AgentSkill;
  latestVersion: SkillVersion;
  reviews: SkillReview[];
  isInstalled: boolean;
}

export interface InstallSkillResponse {
  installation: SkillInstallation;
  downloadUrl: string;
}

export interface CreateSkillVersionRequest {
  version: string;
  changelog: string;
  file: File | Buffer;
}

export interface CreateSkillVersionResponse {
  version: SkillVersion;
}

export interface CreateReviewRequest {
  rating: number;
  title?: string;
  comment?: string;
}

export interface CreateReviewResponse {
  review: SkillReview;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface UpdateReviewResponse {
  review: SkillReview;
}

export interface PendingSkillsResponse {
  skills: AgentSkill[];
  total: number;
}

export interface ApproveSkillResponse {
  skill: AgentSkill;
}

export interface RejectSkillRequest {
  reason: string;
}

export interface RejectSkillResponse {
  skill: AgentSkill;
}

export interface SkillAnalyticsResponse {
  totalSkills: number;
  totalDownloads: number;
  totalReviews: number;
  averageRating: number;
  topCategories: CategoryStats[];
  topPlatforms: PlatformStats[];
  recentActivity: ActivityItem[];
}

// Skill constants
export const SKILLS_CONSTANTS = {
  // File limits
  FILE_LIMITS: {
    MAX_SKILL_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_ICON_SIZE: 1024 * 1024, // 1MB
    MAX_SCREENSHOT_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_SCREENSHOTS: 5,
  },
  
  // Supported file types
  SUPPORTED_TYPES: {
    SKILL_FILE: ['application/zip', 'application/x-zip-compressed'],
    ICON: ['image/png', 'image/jpeg', 'image/webp'],
    SCREENSHOT: ['image/png', 'image/jpeg', 'image/webp'],
  },
  
  // Rating constraints
  RATING: {
    MIN: 1,
    MAX: 5,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  
  // Search
  SEARCH: {
    MAX_QUERY_LENGTH: 100,
    MIN_QUERY_LENGTH: 2,
  },
  
  // Version constraints
  VERSION: {
    PATTERN: /^\d+\.\d+\.\d+$/, // semver pattern
    MAX_LENGTH: 20,
  },
} as const;