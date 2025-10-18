import { PrismaClient, Prisma, UserTier } from '@prisma/client';
import { createClient } from 'redis';
import {
  User,
  UserWithProfile,
  UserSearchOptions,
  UserSearchResult,
  UserServiceResponse,
  UserManagementTier,
  UserValidationError,
} from '@smart-ai-hub/shared';

const prisma = new PrismaClient();
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Convert UserManagementTier to Prisma UserTier
const convertToPrismaTier = (tier?: UserManagementTier): UserTier | undefined => {
  if (!tier) return undefined;
  switch (tier) {
    case UserManagementTier.ADMINISTRATOR:
      return UserTier.administrator;
    case UserManagementTier.AGENCY:
      return UserTier.agency;
    case UserManagementTier.ORGANIZATION:
      return UserTier.organization;
    case UserManagementTier.ADMIN:
      return UserTier.admin;
    case UserManagementTier.GENERAL:
      return UserTier.general;
    default:
      return UserTier.general;
  }
};

// Convert Prisma UserTier to UserManagementTier
const convertFromPrismaTier = (tier: UserTier): UserManagementTier => {
  switch (tier) {
    case UserTier.administrator:
      return UserManagementTier.ADMINISTRATOR;
    case UserTier.agency:
      return UserManagementTier.AGENCY;
    case UserTier.organization:
      return UserManagementTier.ORGANIZATION;
    case UserTier.admin:
      return UserManagementTier.ADMIN;
    case UserTier.general:
      return UserManagementTier.GENERAL;
    default:
      return UserManagementTier.GENERAL;
  }
};

/**
 * Transform Prisma user to UserWithProfile format
 */
const transformPrismaUser = async (user: any): Promise<UserWithProfile> => {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash || undefined,
    verified: user.verified,
    googleId: user.googleId || undefined,
    tier: convertFromPrismaTier(user.tier),
    parentAgencyId: user.parentAgencyId || undefined,
    parentOrganizationId: user.parentOrganizationId || undefined,
    inviteCode: user.inviteCode || undefined,
    invitedBy: user.invitedBy || undefined,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason || undefined,
    blockedAt: user.blockedAt || undefined,
    blockedBy: user.blockedBy || undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    credits: user.credits,
    points: user.points,
    profile: user.profile
      ? {
          userId: user.profile.userId,
          firstName: user.profile.firstName || undefined,
          lastName: user.profile.lastName || undefined,
          avatarUrl: user.profile.avatarUrl || undefined,
          preferences: user.profile.preferences as Record<string, any>,
          updatedAt: user.profile.updatedAt,
        }
      : undefined,
    userRoles: user.userRoles.map((ur: any) => ({
      id: ur.id,
      userId: ur.userId,
      roleId: ur.roleId,
      assignedAt: ur.assignedAt,
    })),
    roles: user.userRoles.map((ur: any) => ur.role),
  };
};

/**
 * Advanced user search with multiple filters
 */
export const searchUsersAdvanced = async (
  options: UserSearchOptions
): Promise<UserServiceResponse<UserSearchResult>> => {
  try {
    const {
      query,
      tier,
      isBlocked,
      isVerified,
      roleId,
      parentAgencyId,
      parentOrganizationId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Validate pagination parameters
    if (page < 1) {
      return {
        success: false,
        error: 'Page must be a positive integer',
      };
    }

    if (limit < 1 || limit > 100) {
      return {
        success: false,
        error: 'Limit must be between 1 and 100',
      };
    }

    // Validate sort field
    const validSortFields = ['createdAt', 'updatedAt', 'email', 'tier', 'credits', 'points'];
    if (!validSortFields.includes(sortBy)) {
      return {
        success: false,
        error: `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`,
      };
    }

    // Validate sort order
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      return {
        success: false,
        error: 'Sort order must be either "asc" or "desc"',
      };
    }

    const skip = (page - 1) * limit;

    // Create cache key based on search options
    const cacheKey = `user_search:${JSON.stringify(options)}`;

    // Check cache first
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return {
          success: true,
          data: JSON.parse(cachedResult) as UserSearchResult,
        };
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
    }

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Text search across multiple fields
    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { profile: { firstName: { contains: query, mode: 'insensitive' } } },
        { profile: { lastName: { contains: query, mode: 'insensitive' } } },
        { inviteCode: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Tier filter
    if (tier) {
      where.tier = convertToPrismaTier(tier);
    }

    // Status filters
    if (isBlocked !== undefined) {
      where.isBlocked = isBlocked;
    }

    if (isVerified !== undefined) {
      where.verified = isVerified;
    }

    // Role filter
    if (roleId) {
      where.userRoles = {
        some: {
          roleId,
        },
      };
    }

    // Hierarchy filters
    if (parentAgencyId) {
      where.parentAgencyId = parentAgencyId;
    }

    if (parentOrganizationId) {
      where.parentOrganizationId = parentOrganizationId;
    }

    // Date range filters
    if (options.createdAfter) {
      where.createdAt = {
        ...(where.createdAt as Prisma.DateTimeFilter | undefined),
        gte: options.createdAfter,
      };
    }

    if (options.createdBefore) {
      where.createdAt = {
        ...(where.createdAt as Prisma.DateTimeFilter | undefined),
        lte: options.createdBefore,
      };
    }

    if (options.lastActiveAfter) {
      where.updatedAt = {
        ...(where.updatedAt as Prisma.DateTimeFilter | undefined),
        gte: options.lastActiveAfter,
      };
    }

    // Credit/Points range filters
    if (options.minCredits !== undefined) {
      where.credits = {
        ...(where.credits as Prisma.IntFilter | undefined),
        gte: options.minCredits,
      };
    }

    if (options.maxCredits !== undefined) {
      where.credits = {
        ...(where.credits as Prisma.IntFilter | undefined),
        lte: options.maxCredits,
      };
    }

    if (options.minPoints !== undefined) {
      where.points = {
        ...(where.points as Prisma.IntFilter | undefined),
        gte: options.minPoints,
      };
    }

    if (options.maxPoints !== undefined) {
      where.points = {
        ...(where.points as Prisma.IntFilter | undefined),
        lte: options.maxPoints,
      };
    }

    // Build order by clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Get total count and users
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // Transform users to UserWithProfile format
    const usersWithProfile: UserWithProfile[] = [];
    for (const user of users) {
      const userWithProfile = await transformPrismaUser(user);
      usersWithProfile.push(userWithProfile);
    }

    const totalPages = Math.ceil(total / limit);
    const result: UserSearchResult = {
      users: usersWithProfile,
      total,
      page,
      limit,
      totalPages,
    };

    // Cache the result for 5 minutes (300 seconds)
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      error: 'Failed to search users',
    };
  }
};

/**
 * Get user search suggestions based on partial input
 */
export const getUserSearchSuggestions = async (
  query: string,
  limit: number = 10
): Promise<UserServiceResponse<Array<{ id: string; email: string; name?: string }>>> => {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        error: 'Query must be at least 2 characters long',
      };
    }

    if (limit < 1 || limit > 20) {
      return {
        success: false,
        error: 'Limit must be between 1 and 20',
      };
    }

    const cacheKey = `user_suggestions:${query}:${limit}`;

    // Check cache first
    try {
      const cachedSuggestions = await redisClient.get(cacheKey);
      if (cachedSuggestions) {
        return {
          success: true,
          data: JSON.parse(cachedSuggestions),
        };
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { profile: { firstName: { contains: query, mode: 'insensitive' } } },
          { profile: { lastName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        profile: true,
      },
      take: limit,
      orderBy: {
        email: 'asc',
      },
    });

    const suggestions = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.profile
        ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || undefined
        : undefined,
    }));

    // Cache the result for 10 minutes (600 seconds)
    try {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(suggestions));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
    }

    return {
      success: true,
      data: suggestions,
    };
  } catch (error) {
    console.error('Error getting user search suggestions:', error);
    return {
      success: false,
      error: 'Failed to get user search suggestions',
    };
  }
};

/**
 * Get popular search terms/filters
 */
export const getPopularSearchFilters = async (): Promise<
  UserServiceResponse<{
    popularTiers: Array<{ tier: UserManagementTier; count: number }>;
    popularRoles: Array<{ roleId: string; roleName: string; count: number }>;
    recentSearches: Array<{ query: string; count: number }>;
  }>
> => {
  try {
    const cacheKey = 'popular_search_filters';

    // Check cache first
    try {
      const cachedFilters = await redisClient.get(cacheKey);
      if (cachedFilters) {
        return {
          success: true,
          data: JSON.parse(cachedFilters),
        };
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
    }

    // Get popular tiers
    const tierCounts = await prisma.user.groupBy({
      by: ['tier'],
      _count: true,
    });

    const popularTiers = tierCounts.map((item) => ({
      tier: convertFromPrismaTier(item.tier),
      count: item._count,
    }));

    // Get popular roles
    const roleCounts = await prisma.userRole.groupBy({
      by: ['roleId'],
      _count: true,
      orderBy: {
        _count: {
          roleId: 'desc',
        },
      },
      take: 10,
    });

    const popularRoles = await Promise.all(
      roleCounts.map(async (item) => {
        const role = await prisma.role.findUnique({
          where: { id: item.roleId },
          select: { name: true },
        });
        return {
          roleId: item.roleId,
          roleName: role?.name || 'Unknown',
          count: item._count,
        };
      })
    );

    // In a real implementation, you would track recent searches in a separate table
    // For now, we'll return an empty array
    const recentSearches: Array<{ query: string; count: number }> = [];

    const result = {
      popularTiers,
      popularRoles,
      recentSearches,
    };

    // Cache the result for 1 hour (3600 seconds)
    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error getting popular search filters:', error);
    return {
      success: false,
      error: 'Failed to get popular search filters',
    };
  }
};

/**
 * Clear search cache
 */
export const clearSearchCache = async (pattern?: string): Promise<UserServiceResponse<null>> => {
  try {
    const keysToDelete = pattern
      ? await redisClient.keys(pattern)
      : await redisClient.keys('user_search:*');

    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('Error clearing search cache:', error);
    return {
      success: false,
      error: 'Failed to clear search cache',
    };
  }
};
