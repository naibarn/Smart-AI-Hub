// Skills Marketplace Types
import { AgentPlatform } from './pricing';

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

export enum SkillVisibility {
  PUBLIC = 'public',
  ORGANIZATION = 'organization',
  PRIVATE = 'private'
}

export enum SkillStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived'
}

export interface SkillVersion {
  id: string;
  skillId: string;
  version: string;
  changelog?: string;
  fileUrl: string;
  fileSize: number;
  fileHash: string;
  isLatest: boolean;
  downloadCount: number;
  createdAt: Date;
}

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

export interface SkillReview {
  id: string;
  skillId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillInstallation {
  id: string;
  skillId: string;
  userId: string;
  versionId: string;
  installedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

// API Request/Response Types
export interface CreateSkillInput {
  name: string;
  description: string;
  longDescription?: string;
  categoryId: string;
  platformId: string;
  visibility: SkillVisibility;
  tags: string[];
}

export interface UpdateSkillInput {
  name?: string;
  description?: string;
  longDescription?: string;
  categoryId?: string;
  visibility?: SkillVisibility;
  tags?: string[];
  iconUrl?: string;
  screenshotUrls?: string[];
}

export interface CreateSkillVersionInput {
  version: string;
  changelog?: string;
  file: File;
}

export interface CreateReviewInput {
  rating: number;
  title?: string;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface SkillSearchFilters {
  q?: string;
  category?: string;
  platform?: string;
  tags?: string[];
  sort?: SkillSortOption;
  limit?: number;
  offset?: number;
}

export enum SkillSortOption {
  POPULAR = 'popular',
  NEWEST = 'newest',
  HIGHEST_RATED = 'highest_rated',
  MOST_INSTALLED = 'most_installed'
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SkillDetailResponse {
  skill: AgentSkill;
  latestVersion: SkillVersion;
  reviews: SkillReview[];
  isInstalled: boolean;
  installCount: number;
  averageRating: number;
}

export interface InstallSkillResponse {
  installation: SkillInstallation;
  downloadUrl: string;
}

export interface ReviewFilters {
  rating?: number;
  sort?: ReviewSortOption;
  limit?: number;
  offset?: number;
}

export enum ReviewSortOption {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  HIGHEST_RATED = 'highest_rated',
  LOWEST_RATED = 'lowest_rated',
  MOST_HELPFUL = 'most_helpful'
}

// Admin Types
export interface PendingSkillApproval {
  skill: AgentSkill;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  category: SkillCategory;
  platform: AgentPlatform;
  submittedAt: Date;
}

export interface ApprovalAction {
  approved: boolean;
  reason?: string;
  approvedBy: string;
}

export interface SkillAnalytics {
  totalSkills: number;
  approvedSkills: number;
  pendingSkills: number;
  totalInstalls: number;
  totalReviews: number;
  averageRating: number;
  topCategories: CategoryStats[];
  topCreators: CreatorStats[];
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  skillCount: number;
  installCount: number;
  averageRating: number;
}

export interface CreatorStats {
  creatorId: string;
  creatorName: string;
  skillCount: number;
  totalInstalls: number;
  averageRating: number;
}

// Skill File Types
export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  platform: string;
  entryPoint: string;
  permissions: string[];
  dependencies: Record<string, string>;
  metadata: Record<string, any>;
}

export interface SkillPackage {
  manifest: SkillManifest;
  files: SkillFile[];
}

export interface SkillFile {
  path: string;
  content: string | Buffer;
  type: 'code' | 'config' | 'asset' | 'doc';
}

// Validation Types
export interface SkillValidationError {
  field: string;
  message: string;
  code: string;
}

export interface SkillValidationResult {
  valid: boolean;
  errors: SkillValidationError[];
  warnings: SkillValidationError[];
}

// Import/Export Types
export interface SkillExportOptions {
  includeVersions: boolean;
  includeReviews: boolean;
  includeAnalytics: boolean;
  format: 'json' | 'csv';
}

export interface SkillImportData {
  skills: AgentSkill[];
  versions?: SkillVersion[];
  reviews?: SkillReview[];
  categories?: SkillCategory[];
}