import crypto from 'crypto';
import { User, UserProfile, UserRole } from '@smart-ai-hub/shared';

/**
 * Simple password hashing (in production, use bcrypt)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const hash = crypto.createHash('sha256');
  hash.update(password + 'smart-ai-hub-salt'); // Add salt
  return hash.digest('hex');
};

/**
 * Compare a password with its hash
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  const hash = crypto.createHash('sha256');
  hash.update(password + 'smart-ai-hub-salt'); // Add salt
  return hash.digest('hex') === hashedPassword;
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a unique username from email
 */
export const generateUsernameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0];
  const cleanUsername = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return cleanUsername || 'user';
};

/**
 * Generate a unique referral code
 */
export const generateReferralCode = (userId: string): string => {
  const prefix = 'REF';
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  const referralCode = `${prefix}-${randomPart}-${userId.substring(0, 8)}`;
  return referralCode;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize user data for public display
 */
export const sanitizeUser = (user: any): Partial<User> => {
  const { password, ...sanitized } = user;
  return sanitized as Partial<User>;
};

/**
 * Create a user display name
 */
export const createDisplayName = (user: User, profile?: UserProfile): string => {
  if (profile?.firstName && profile?.lastName) {
    return `${profile.firstName} ${profile.lastName}`;
  }
  if (profile?.firstName) {
    return profile.firstName;
  }
  return user.email;
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user: User, profile?: UserProfile): string => {
  if (profile?.firstName && profile?.lastName) {
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  }
  if (profile?.firstName) {
    return profile.firstName.substring(0, 2).toUpperCase();
  }
  return user.email.substring(0, 2).toUpperCase();
};

/**
 * Check if user has specific role
 */
export const hasRole = (userWithProfile: any, role: string): boolean => {
  return userWithProfile?.roles?.some((r: any) => r.name === role) || false;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (userWithProfile: any, roles: string[]): boolean => {
  return roles.some((role) => hasRole(userWithProfile, role));
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (userWithProfile: any, roles: string[]): boolean => {
  return roles.every((role) => hasRole(userWithProfile, role));
};

/**
 * Get user's highest priority role
 */
export const getHighestPriorityRole = (userWithProfile: any): any => {
  if (!userWithProfile?.roles || userWithProfile.roles.length === 0) {
    return null;
  }

  // Define role priorities (lower number = higher priority)
  const rolePriorities: Record<string, number> = {
    administrator: 1,
    agency: 2,
    organization: 3,
    admin: 4,
    general: 5,
  };

  return userWithProfile.roles.reduce((highest: any, current: any) => {
    const currentPriority = rolePriorities[current.name || ''] || 999;
    const highestPriority = rolePriorities[highest.name || ''] || 999;

    return currentPriority < highestPriority ? current : highest;
  });
};

/**
 * Calculate profile completion percentage
 */
export const calculateProfileCompletion = (profile: UserProfile | null): number => {
  if (!profile) {
    return 0;
  }

  const fields = [profile.firstName, profile.lastName, profile.avatarUrl];

  const completedFields = fields.filter((field) => field && field.toString().trim() !== '').length;
  return Math.round((completedFields / fields.length) * 100);
};

/**
 * Generate a password reset token
 */
export const generatePasswordResetToken = (): {
  token: string;
  expiresAt: Date;
} => {
  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

  return { token, expiresAt };
};

/**
 * Generate an email verification token
 */
export const generateEmailVerificationToken = (): {
  token: string;
  expiresAt: Date;
} => {
  const token = generateSecureToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

  return { token, expiresAt };
};

/**
 * Format user data for API response
 */
export const formatUserForResponse = (user: User, profile?: UserProfile, roles?: any[]): any => {
  return {
    id: user.id,
    email: user.email,
    tier: user.tier,
    verified: user.verified,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason,
    blockedAt: user.blockedAt,
    blockedBy: user.blockedBy,
    credits: user.credits,
    points: user.points,
    parentAgencyId: user.parentAgencyId,
    parentOrganizationId: user.parentOrganizationId,
    inviteCode: user.inviteCode,
    invitedBy: user.invitedBy,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile,
    roles: roles?.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    })),
  };
};

/**
 * Extract user information from JWT token
 */
export const extractUserFromToken = (token: string): any => {
  try {
    // This would typically use a JWT library to decode the token
    // For now, return a placeholder
    return null;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

/**
 * Check if user account is locked
 */
export const isAccountLocked = (user: User): boolean => {
  return user.isBlocked || false;
};

/**
 * Get user's subscription status
 */
export const getUserSubscriptionStatus = (
  user: User
): {
  isSubscribed: boolean;
  plan: string | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
} => {
  // This would typically check the user's subscription in the database
  // For now, return a placeholder
  return {
    isSubscribed: false,
    plan: null,
    expiresAt: null,
    daysRemaining: null,
  };
};

/**
 * Generate a unique API key for user
 */
export const generateApiKey = (userId: string): string => {
  const prefix = 'sak'; // Smart AI Hub API Key
  const randomPart = crypto.randomBytes(16).toString('hex').toLowerCase();
  const timestamp = Date.now().toString(36);
  const apiKey = `${prefix}_${randomPart}_${timestamp}`;
  return apiKey;
};

/**
 * Validate API key format
 */
export const isValidApiKey = (apiKey: string): boolean => {
  const apiKeyRegex = /^sak_[a-f0-9]{32}_[a-z0-9]+$/;
  return apiKeyRegex.test(apiKey);
};
