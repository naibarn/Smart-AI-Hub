import { Request } from 'express';

// Base User interface
export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  verified: boolean;
  googleId?: string;
  tier: UserManagementTier;
  parentAgencyId?: string;
  parentOrganizationId?: string;
  inviteCode?: string;
  invitedBy?: string;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: Date;
  blockedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  credits: number;
  points: number;
}

// User Profile interface
export interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  preferences: Record<string, any>;
  updatedAt: Date;
}

// User Role interface
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
}

// User Tier enum
export enum UserManagementTier {
  ADMINISTRATOR = 'administrator',
  AGENCY = 'agency',
  ORGANIZATION = 'organization',
  ADMIN = 'admin',
  GENERAL = 'general',
}

// Extended User with Profile and Roles
export interface UserWithProfile extends User {
  profile?: UserProfile;
  userRoles: UserRole[];
  roles: Role[];
}

// Role interface
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Permission interface
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User creation request interface
export interface CreateUserRequest {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  tier?: UserManagementTier;
  parentAgencyId?: string;
  parentOrganizationId?: string;
  inviteCode?: string;
  roles?: string[];
}

// User update request interface
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
  dateOfBirth?: Date;
  timezone?: string;
  language?: string;
  preferences?: Record<string, any>;
}

// User profile update request interface
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
  dateOfBirth?: Date;
  timezone?: string;
  language?: string;
  preferences?: Record<string, any>;
}

// Role assignment request interface
export interface AssignRoleRequest {
  roleId: string;
}

// User search and filter options
export interface UserSearchOptions {
  query?: string;
  tier?: UserManagementTier;
  isBlocked?: boolean;
  isVerified?: boolean;
  roleId?: string;
  parentAgencyId?: string;
  parentOrganizationId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'tier' | 'credits' | 'points';
  sortOrder?: 'asc' | 'desc';
  createdAfter?: Date;
  createdBefore?: Date;
  lastActiveAfter?: Date;
  minCredits?: number;
  maxCredits?: number;
  minPoints?: number;
  maxPoints?: number;
}

// User search result interface
export interface UserSearchResult {
  users: UserWithProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User account deactivation request
export interface DeactivateUserRequest {
  reason: string;
  notifyUser?: boolean;
}

// User account reactivation request
export interface ReactivateUserRequest {
  reason: string;
  notifyUser?: boolean;
}

// User audit log entry
export interface UserAuditLog {
  id: string;
  userId: string;
  action: UserAuditAction;
  performedBy: string;
  reason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// User audit actions enum
export enum UserAuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DEACTIVATED = 'deactivated',
  REACTIVATED = 'reactivated',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REMOVED = 'role_removed',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_CHANGED = 'email_changed',
  PROFILE_UPDATED = 'profile_updated',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

// Extended Request interface for user management
export interface UserRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    roles: Array<{ name: string }>;
    tier: UserManagementTier;
  };
  targetUser?: UserWithProfile;
}

// User validation error interface
export interface UserValidationError {
  field: string;
  message: string;
  code: string;
}

// User service response interface
export interface UserServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: UserValidationError[];
}

// User statistics interface
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  verifiedUsers: number;
  usersByTier: Record<UserManagementTier, number>;
  recentRegistrations: number;
  recentActivity: number;
}

// User export options
export interface UserExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  fields: (keyof UserWithProfile)[];
  filters?: UserSearchOptions;
}

// User bulk operation request
export interface BulkUserOperationRequest {
  userIds: string[];
  operation: 'deactivate' | 'activate' | 'assignRole' | 'removeRole';
  roleId?: string;
  reason: string;
}

// User bulk operation result
export interface BulkUserOperationResult {
  successful: string[];
  failed: Array<{
    userId: string;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// Block Log interface for user account management
export interface BlockLog {
  id: string;
  userId: string;
  blockedBy: string;
  action: BlockAction;
  reason?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// Block Action enum (matching Prisma schema)
export enum BlockAction {
  block = 'block',
  unblock = 'unblock',
}

// User block logs result interface
export interface UserBlockLogsResult {
  logs: BlockLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Blocked users statistics interface
export interface BlockedUsersStatistics {
  totalBlockedUsers: number;
  recentlyBlocked: number;
  blockedByReason: Record<string, number>;
}

// User profile completion interface
export interface UserProfileCompletion {
  userId: string;
  completionPercentage: number;
  completedFields: string[];
  missingFields: string[];
  isComplete: boolean;
}

// User preferences interface
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  [key: string]: any;
}

// User session interface
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
}

// User activity log interface
export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}
