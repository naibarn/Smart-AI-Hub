import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  AuthenticatedRequest,
  CreateUserRequest,
  UpdateProfileRequest,
  UserSearchOptions,
  DeactivateUserRequest,
  ReactivateUserRequest,
  BulkUserOperationRequest,
  UserManagementTier,
} from '@smart-ai-hub/shared';
import * as userService from '../services/user.service';
import * as permissionService from '../services/permission.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import RedisService from '../services/redis.service';

/**
 * Get current user profile
 *
 * @route GET /users/me
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Get user from service
    const userResult = await userService.getUserById(userId);

    if (!userResult.success || !userResult.data) {
      return next(new AppError('User not found', 404));
    }

    successResponse(userResult.data, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 *
 * @route PUT /users/me
 * @access Private (JWT required)
 * @param req - Express request object with authenticated user and profile data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const updateCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Get profile data from request body
    const profileData: UpdateProfileRequest = req.body;

    // Validate profile data
    if (Object.keys(profileData).length === 0) {
      return next(new AppError('At least one field must be provided for update', 400));
    }

    // Update user profile
    const updateResult = await userService.updateUserProfile(userId, profileData, userId);

    if (!updateResult.success || !updateResult.data) {
      return next(new AppError(updateResult.error || 'Failed to update profile', 400));
    }

    successResponse(updateResult.data, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin or self-access)
 *
 * @route GET /users/:id
 * @access Private (admin or self-access)
 * @param req - Express request object with authenticated user and userId in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Get target userId from params
    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    // Check if user has permission (admin or self-access)
    const isAdmin = req.user?.roles.some((role) => ['admin', 'administrator'].includes(role.name));
    const isSelfAccess = currentUserId === id;

    if (!isAdmin && !isSelfAccess) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Get user from service
    const userResult = await userService.getUserById(id);

    if (!userResult.success || !userResult.data) {
      return next(new AppError('User not found', 404));
    }

    successResponse(userResult.data, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user (admin only)
 *
 * @route POST /users
 * @access Private (admin only)
 * @param req - Express request object with user creation data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const createUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user has admin permission
    const hasPermission = await permissionService.hasPermission(currentUserId, 'users', 'create');
    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Get user data from request body
    const userData: CreateUserRequest = req.body;

    // Validate required fields
    if (!userData.email) {
      return next(new AppError('Email is required', 400));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return next(new AppError('Invalid email format', 400));
    }

    // Create user
    const createResult = await userService.createUser(userData, currentUserId);

    if (!createResult.success || !createResult.data) {
      return next(new AppError(createResult.error || 'Failed to create user', 400));
    }

    successResponse(createResult.data, res, 201, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Search and filter users (admin only)
 *
 * @route GET /users
 * @access Private (admin only)
 * @param req - Express request object with search options in query params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const searchUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user has admin permission
    const hasPermission = await permissionService.hasPermission(currentUserId, 'users', 'read');
    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Build search options from query params
    const searchOptions: UserSearchOptions = {
      query: req.query.query as string,
      tier: req.query.tier as any,
      isBlocked:
        req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined,
      isVerified:
        req.query.isVerified === 'true'
          ? true
          : req.query.isVerified === 'false'
            ? false
            : undefined,
      roleId: req.query.roleId as string,
      parentAgencyId: req.query.parentAgencyId as string,
      parentOrganizationId: req.query.parentOrganizationId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as any) || 'createdAt',
      sortOrder: (req.query.sortOrder as any) || 'desc',
    };

    // Validate pagination parameters
    if (searchOptions.page !== undefined && searchOptions.page < 1) {
      return next(new AppError('Page must be a positive integer', 400));
    }
    if (
      searchOptions.limit !== undefined &&
      (searchOptions.limit < 1 || searchOptions.limit > 100)
    ) {
      return next(new AppError('Limit must be between 1 and 100', 400));
    }

    // Search users
    const searchResult = await userService.searchUsers(searchOptions);

    if (!searchResult.success || !searchResult.data) {
      return next(new AppError(searchResult.error || 'Failed to search users', 400));
    }

    paginatedResponse(
      searchResult.data.users,
      {
        page: searchResult.data.page,
        per_page: searchResult.data.limit,
        total: searchResult.data.total,
        total_pages: searchResult.data.totalPages,
      },
      res,
      200,
      req.requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile (admin only)
 *
 * @route PUT /users/:id
 * @access Private (admin only)
 * @param req - Express request object with userId in params and profile data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user has admin permission
    const hasPermission = await permissionService.hasPermission(currentUserId, 'users', 'update');
    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Get target userId from params
    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    // Get profile data from request body
    const profileData: UpdateProfileRequest = req.body;

    // Validate profile data
    if (Object.keys(profileData).length === 0) {
      return next(new AppError('At least one field must be provided for update', 400));
    }

    // Update user profile
    const updateResult = await userService.updateUserProfile(id, profileData, currentUserId);

    if (!updateResult.success || !updateResult.data) {
      return next(new AppError(updateResult.error || 'Failed to update user', 400));
    }

    successResponse(updateResult.data, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user account (admin only)
 *
 * @route POST /users/:id/deactivate
 * @access Private (admin only)
 * @param req - Express request object with userId in params and deactivation data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const deactivateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user has admin permission
    const hasPermission = await permissionService.hasPermission(
      currentUserId,
      'users',
      'deactivate'
    );
    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Get target userId from params
    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    // Get deactivation data from request body
    const deactivationData: DeactivateUserRequest = req.body;

    // Validate deactivation data
    if (!deactivationData.reason || deactivationData.reason.trim().length === 0) {
      return next(new AppError('Reason is required and must be a non-empty string', 400));
    }

    // Deactivate user
    const deactivateResult = await userService.deactivateUser(id, deactivationData, currentUserId);

    if (!deactivateResult.success || !deactivateResult.data) {
      return next(new AppError(deactivateResult.error || 'Failed to deactivate user', 400));
    }

    successResponse(deactivateResult.data, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate user account (admin only)
 *
 * @route POST /users/:id/reactivate
 * @access Private (admin only)
 * @param req - Express request object with userId in params and reactivation data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const reactivateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user has admin permission
    const hasPermission = await permissionService.hasPermission(
      currentUserId,
      'users',
      'reactivate'
    );
    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Get target userId from params
    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    // Get reactivation data from request body
    const reactivationData: ReactivateUserRequest = req.body;

    // Validate reactivation data
    if (!reactivationData.reason || reactivationData.reason.trim().length === 0) {
      return next(new AppError('Reason is required and must be a non-empty string', 400));
    }

    // Reactivate user
    const reactivateResult = await userService.reactivateUser(id, reactivationData, currentUserId);

    if (!reactivateResult.success || !reactivateResult.data) {
      return next(new AppError(reactivateResult.error || 'Failed to reactivate user', 400));
    }

    successResponse(reactivateResult.data, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics (admin only)
 *
 * @route GET /users/statistics
 * @access Private (admin only)
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const getUserStatistics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user has admin permission
    const hasPermission = await permissionService.hasPermission(currentUserId, 'users', 'read');
    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Get user statistics
    const statsResult = await userService.getUserStatistics();

    if (!statsResult.success || !statsResult.data) {
      return next(new AppError(statsResult.error || 'Failed to get user statistics', 400));
    }

    successResponse(statsResult.data, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Perform bulk operations on users (admin only)
 *
 * @route POST /users/bulk
 * @access Private (admin only)
 * @param req - Express request object with bulk operation data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const bulkUserOperation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user has admin permission
    const hasPermission = await permissionService.hasPermission(currentUserId, 'users', 'update');
    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Get bulk operation data from request body
    const operationData: BulkUserOperationRequest = req.body;

    // Validate operation data
    if (
      !operationData.userIds ||
      !Array.isArray(operationData.userIds) ||
      operationData.userIds.length === 0
    ) {
      return next(new AppError('User IDs array is required and must not be empty', 400));
    }

    if (
      !operationData.operation ||
      !['deactivate', 'activate', 'assignRole', 'removeRole'].includes(operationData.operation)
    ) {
      return next(
        new AppError(
          'Valid operation is required (deactivate, activate, assignRole, removeRole)',
          400
        )
      );
    }

    if (!operationData.reason || operationData.reason.trim().length === 0) {
      return next(new AppError('Reason is required and must be a non-empty string', 400));
    }

    if (
      (operationData.operation === 'assignRole' || operationData.operation === 'removeRole') &&
      !operationData.roleId
    ) {
      return next(new AppError('Role ID is required for role assignment operations', 400));
    }

    // Perform bulk operation
    const operationResult = await userService.bulkUserOperation(operationData, currentUserId);

    if (!operationResult.success || !operationResult.data) {
      return next(new AppError(operationResult.error || 'Failed to perform bulk operation', 400));
    }

    successResponse(operationResult.data, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account (admin only)
 *
 * @route DELETE /users/:id
 * @access Private (admin only)
 * @param req - Express request object with userId in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId from authenticated user
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Check if user has admin permission
    const hasPermission = await permissionService.hasPermission(currentUserId, 'users', 'delete');
    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Get target userId from params
    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    // Prevent self-deletion
    if (currentUserId === id) {
      return next(new AppError('Cannot delete your own account', 400));
    }

    // In a real implementation, you would soft-delete the user
    // For now, we'll just deactivate the account
    const deactivateResult = await userService.deactivateUser(
      id,
      { reason: 'Account deleted by admin', notifyUser: false },
      currentUserId
    );

    if (!deactivateResult.success) {
      return next(new AppError(deactivateResult.error || 'Failed to delete user', 400));
    }

    successResponse({ message: 'User deleted successfully' }, res, 200, req.requestId);
  } catch (error) {
    next(error);
  }
};
