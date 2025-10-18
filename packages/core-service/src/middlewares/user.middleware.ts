import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  AuthenticatedRequest,
  CreateUserRequest,
  UpdateProfileRequest,
  UserSearchOptions,
  BulkUserOperationRequest,
  UserValidationError,
  UpdateUserRequest,
} from '@smart-ai-hub/shared';
import * as userService from '../services/user.service';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateDateOfBirth,
  validateTimezone,
  validateLanguage,
  validateUrl,
  validatePagination,
  validateUuid,
  validateRequired,
  validateLength,
  validateBoolean,
  validateArray,
  validateEnum,
  validateObject,
} from '../utils/validation';

/**
 * Validate user creation data
 */
export const validateCreateUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const userData: CreateUserRequest = req.body;
    const validationErrors: UserValidationError[] = [];

    // Validate email
    const emailError = validateEmail(userData.email);
    if (emailError) validationErrors.push(emailError);

    // Validate password if provided
    if (userData.password) {
      const passwordError = validatePassword(userData.password);
      if (passwordError) validationErrors.push(passwordError);
    }

    // Validate name fields
    const firstNameError = validateName(userData.firstName || '', 'firstName');
    if (firstNameError) validationErrors.push(firstNameError);

    const lastNameError = validateName(userData.lastName || '', 'lastName');
    if (lastNameError) validationErrors.push(lastNameError);

    // Note: phone is not in CreateUserRequest interface, it's only in UpdateUserRequest
    // If phone validation is needed for user creation, add it to the CreateUserRequest interface

    if (validationErrors.length > 0) {
      const error = new AppError('Validation failed', 400);
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 *Validate user profile update data
 */
export const validateUpdateProfile = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const profileData: UpdateProfileRequest = req.body;
    const validationErrors: UserValidationError[] = [];

    // Check if at least one field is provided
    if (Object.keys(profileData).length === 0) {
      validationErrors.push({
        field: 'general',
        message: 'At least one field must be provided for update',
        code: 'NO_FIELDS_PROVIDED',
      });
    }

    // Validate name fields
    if (profileData.firstName && profileData.firstName.length > 100) {
      validationErrors.push({
        field: 'firstName',
        message: 'First name must be less than 100 characters',
        code: 'FIELD_TOO_LONG',
      });
    }

    if (profileData.lastName && profileData.lastName.length > 100) {
      validationErrors.push({
        field: 'lastName',
        message: 'Last name must be less than 100 characters',
        code: 'FIELD_TOO_LONG',
      });
    }

    // Validate phone number if provided
    if (profileData.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(profileData.phone)) {
        validationErrors.push({
          field: 'phone',
          message: 'Invalid phone number format',
          code: 'INVALID_FORMAT',
        });
      }
    }

    // Validate date of birth if provided
    if (profileData.dateOfBirth) {
      const dob = new Date(profileData.dateOfBirth);
      const now = new Date();
      const minAge = 13;
      const maxAge = 120;

      if (isNaN(dob.getTime())) {
        validationErrors.push({
          field: 'dateOfBirth',
          message: 'Invalid date format',
          code: 'INVALID_FORMAT',
        });
      } else {
        const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < minAge || age > maxAge) {
          validationErrors.push({
            field: 'dateOfBirth',
            message: `Age must be between ${minAge} and ${maxAge} years`,
            code: 'INVALID_AGE',
          });
        }
      }
    }

    // Validate timezone if provided
    if (profileData.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: profileData.timezone });
      } catch {
        validationErrors.push({
          field: 'timezone',
          message: 'Invalid timezone',
          code: 'INVALID_TIMEZONE',
        });
      }
    }

    // Validate language if provided
    if (profileData.language) {
      const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
      if (!languageRegex.test(profileData.language)) {
        validationErrors.push({
          field: 'language',
          message: 'Invalid language format (e.g., en, en-US)',
          code: 'INVALID_FORMAT',
        });
      }
    }

    // Validate avatar URL if provided
    if (profileData.avatarUrl) {
      try {
        new URL(profileData.avatarUrl);
      } catch {
        validationErrors.push({
          field: 'avatarUrl',
          message: 'Invalid URL format',
          code: 'INVALID_FORMAT',
        });
      }
    }

    if (validationErrors.length > 0) {
      const error = new AppError('Validation failed', 400);
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate user search options
 */
export const validateUserSearch = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const searchOptions: UserSearchOptions = req.query as any;
    const validationErrors: UserValidationError[] = [];

    // Validate pagination parameters
    const paginationErrors = validatePagination(searchOptions.page, searchOptions.limit);
    validationErrors.push(...paginationErrors);

    // Validate sort options
    if (searchOptions.sortBy !== undefined) {
      const sortError = validateEnum(searchOptions.sortBy, 'sortBy', [
        'createdAt',
        'updatedAt',
        'email',
        'tier',
      ]);
      if (sortError) validationErrors.push(sortError);
    }

    if (searchOptions.sortOrder !== undefined) {
      const sortError = validateEnum(searchOptions.sortOrder, 'sortOrder', ['asc', 'desc']);
      if (sortError) validationErrors.push(sortError);
    }

    // Validate boolean parameters
    // Note: isBlocked and isVerified are boolean types in UserSearchOptions
    // No need to validate them as strings since they should already be boolean

    if (validationErrors.length > 0) {
      const error = new AppError('Validation failed', 400);
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate bulk user operation data
 */
export const validateBulkUserOperation = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const operationData: BulkUserOperationRequest = req.body;
    const validationErrors: UserValidationError[] = [];

    // Validate user IDs array
    const arrayError = validateArray(operationData.userIds, 'userIds', 1, 100);
    if (arrayError) validationErrors.push(arrayError);

    // Validate operation
    const operationError = validateEnum(operationData.operation, 'operation', [
      'deactivate',
      'activate',
      'assignRole',
      'removeRole',
    ]);
    if (operationError) validationErrors.push(operationError);

    // Validate role ID for role operations
    if (operationData.operation === 'assignRole' || operationData.operation === 'removeRole') {
      const roleIdError = validateRequired(operationData.roleId, 'roleId');
      if (roleIdError) validationErrors.push(roleIdError);
    }

    // Validate reason
    const reasonError = validateRequired(operationData.reason, 'reason');
    if (reasonError) validationErrors.push(reasonError);

    if (operationData.reason) {
      const reasonLengthError = validateLength(operationData.reason, 'reason', 1, 500);
      if (reasonLengthError) validationErrors.push(reasonLengthError);
    }

    if (validationErrors.length > 0) {
      const error = new AppError('Validation failed', 400);
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user exists and attach to request
 */
export const attachUserToRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new AppError('User ID is required', 400));
    }

    const userResult = await userService.getUserById(id);
    if (!userResult.success || !userResult.data) {
      return next(new AppError('User not found', 404));
    }

    // Attach user to request for use in subsequent middleware
    (req as any).targetUser = userResult.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can access target user (admin or self-access)
 */
export const requireUserAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const currentUserId = req.user?.id;
    const targetUser = (req as any).targetUser;

    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!targetUser) {
      return next(new AppError('Target user not found', 404));
    }

    // Check if user has admin role or is accessing their own profile
    const isAdmin = req.user?.roles.some((role) => ['admin', 'administrator'].includes(role.name));
    const isSelfAccess = currentUserId === targetUser.id;

    if (!isAdmin && !isSelfAccess) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can modify target user (admin only)
 */
export const requireUserModificationAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const currentUserId = req.user?.id;
    const targetUser = (req as any).targetUser;

    if (!currentUserId) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!targetUser) {
      return next(new AppError('Target user not found', 404));
    }

    // Check if user has admin role
    const isAdmin = req.user?.roles.some((role) => ['admin', 'administrator'].includes(role.name));

    if (!isAdmin) {
      return next(new AppError('Insufficient permissions', 403));
    }

    // Prevent admins from modifying other admins (unless they are administrators)
    const isTargetAdmin = targetUser.roles.some((role: any) =>
      ['admin', 'administrator'].includes(role.name)
    );
    const isCurrentUserAdministrator = req.user?.roles.some(
      (role) => role.name === 'administrator'
    );

    if (isTargetAdmin && !isCurrentUserAdministrator) {
      return next(new AppError('Cannot modify other admin users', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate deactivation/reactivation reason
 */
export const validateAccountStatusChange = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { reason, notifyUser } = req.body;
    const validationErrors: UserValidationError[] = [];

    const reasonError = validateRequired(reason, 'reason');
    if (reasonError) validationErrors.push(reasonError);

    if (reason) {
      const reasonLengthError = validateLength(reason, 'reason', 1, 500);
      if (reasonLengthError) validationErrors.push(reasonLengthError);
    }

    const notifyUserError = validateBoolean(notifyUser, 'notifyUser');
    if (notifyUserError) validationErrors.push(notifyUserError);

    if (validationErrors.length > 0) {
      const error = new AppError('Validation failed', 400);
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
};
