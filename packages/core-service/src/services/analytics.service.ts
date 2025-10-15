import { PrismaClient, Prisma } from '@prisma/client';
import { createInternalServerError } from '@smart-ai-hub/shared';

const prisma = new PrismaClient();

// Interfaces for type safety
export interface UsageMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCredits: number;
  averageResponseTime?: number;
  errorRate?: number;
  costPerRequest?: number;
}

export interface UsageByService {
  service: string;
  requests: number;
  tokens: number;
  credits: number;
  averageResponseTime?: number;
}

export interface UsageByModel {
  model: string;
  requests: number;
  tokens: number;
  credits: number;
  averageResponseTime?: number;
}

export interface UsageByTimePeriod {
  period: string;
  requests: number;
  tokens: number;
  credits: number;
  uniqueUsers: number;
}

export interface UserUsageSummary {
  userId: string;
  email: string;
  totalRequests: number;
  totalTokens: number;
  totalCredits: number;
  lastActivity: Date;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  service?: string;
  model?: string;
  userId?: string;
}

export interface DashboardData {
  overview: UsageMetrics;
  services: UsageByService[];
  models: UsageByModel[];
  timeSeries: UsageByTimePeriod[];
  topUsers: UserUsageSummary[];
}

/**
 * Record usage data for analytics
 */
export const recordUsage = async (
  userId: string,
  service: string,
  model: string | undefined,
  tokens: number | undefined,
  credits: number,
  metadata?: any
): Promise<void> => {
  try {
    await prisma.usageLog.create({
      data: {
        userId,
        service,
        model,
        tokens,
        credits,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error('Error recording usage:', error);
    // Don't throw error to avoid disrupting main service flow
  }
};

/**
 * Get usage metrics with optional filters
 */
export const getUsageMetrics = async (
  filters: AnalyticsFilters = {}
): Promise<UsageMetrics> => {
  try {
    const whereClause: Prisma.UsageLogWhereInput = {};

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.service) {
      whereClause.service = filters.service;
    }

    if (filters.model) {
      whereClause.model = filters.model;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    const [totalRequests, totalTokens, totalCredits] = await Promise.all([
      prisma.usageLog.count({ where: whereClause }),
      prisma.usageLog.aggregate({
        where: whereClause,
        _sum: { tokens: true },
      }),
      prisma.usageLog.aggregate({
        where: whereClause,
        _sum: { credits: true },
      }),
    ]);

    return {
      totalRequests,
      totalTokens: totalTokens._sum.tokens || 0,
      totalCredits: totalCredits._sum.credits || 0,
    };
  } catch (error) {
    console.error('Error getting usage metrics:', error);
    throw createInternalServerError('Failed to get usage metrics');
  }
};

/**
 * Get usage breakdown by service
 */
export const getUsageByService = async (
  filters: AnalyticsFilters = {}
): Promise<UsageByService[]> => {
  try {
    const whereClause: Prisma.UsageLogWhereInput = {};

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    const serviceUsage = await prisma.usageLog.groupBy({
      by: ['service'],
      where: whereClause,
      _count: { id: true },
      _sum: { tokens: true, credits: true },
    });

    return serviceUsage.map(item => ({
      service: item.service,
      requests: item._count.id,
      tokens: item._sum.tokens || 0,
      credits: item._sum.credits || 0,
    }));
  } catch (error) {
    console.error('Error getting usage by service:', error);
    throw createInternalServerError('Failed to get usage by service');
  }
};

/**
 * Get usage breakdown by model
 */
export const getUsageByModel = async (
  filters: AnalyticsFilters = {}
): Promise<UsageByModel[]> => {
  try {
    const whereClause: Prisma.UsageLogWhereInput = {
      model: { not: null },
    };

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.service) {
      whereClause.service = filters.service;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    const modelUsage = await prisma.usageLog.groupBy({
      by: ['model'],
      where: whereClause,
      _count: { id: true },
      _sum: { tokens: true, credits: true },
    });

    return modelUsage.map(item => ({
      model: item.model!,
      requests: item._count.id,
      tokens: item._sum.tokens || 0,
      credits: item._sum.credits || 0,
    }));
  } catch (error) {
    console.error('Error getting usage by model:', error);
    throw createInternalServerError('Failed to get usage by model');
  }
};

/**
 * Get usage time series data
 */
export const getUsageTimeSeries = async (
  filters: AnalyticsFilters = {},
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<UsageByTimePeriod[]> => {
  try {
    const whereClause: Prisma.UsageLogWhereInput = {};

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.service) {
      whereClause.service = filters.service;
    }

    if (filters.model) {
      whereClause.model = filters.model;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    // SQL for grouping by time period
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const timeSeries = await prisma.$queryRaw<Array<{
      period: string;
      requests: bigint;
      tokens: bigint;
      credits: bigint;
      uniqueUsers: bigint;
    }>>`
      SELECT 
        TO_CHAR(created_at, ${dateFormat}) as period,
        COUNT(*) as requests,
        COALESCE(SUM(tokens), 0) as tokens,
        COALESCE(SUM(credits), 0) as credits,
        COUNT(DISTINCT user_id) as unique_users
      FROM usage_logs
      WHERE ${Prisma.sql([whereClause])}
      GROUP BY period
      ORDER BY period ASC
    `;

    return timeSeries.map(item => ({
      period: item.period,
      requests: Number(item.requests),
      tokens: Number(item.tokens),
      credits: Number(item.credits),
      uniqueUsers: Number(item.uniqueUsers),
    }));
  } catch (error) {
    console.error('Error getting usage time series:', error);
    throw createInternalServerError('Failed to get usage time series');
  }
};

/**
 * Get top users by usage
 */
export const getTopUsers = async (
  filters: AnalyticsFilters = {},
  limit: number = 10
): Promise<UserUsageSummary[]> => {
  try {
    const whereClause: Prisma.UsageLogWhereInput = {};

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.service) {
      whereClause.service = filters.service;
    }

    if (filters.model) {
      whereClause.model = filters.model;
    }

    const topUsers = await prisma.usageLog.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: { id: true },
      _sum: { tokens: true, credits: true },
      _max: { createdAt: true },
      orderBy: {
        _sum: { credits: 'desc' },
      },
      take: limit,
    });

    // Get user emails for the top users
    const userIds = topUsers.map(item => item.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    const userMap = users.reduce((map, user) => {
      map[user.id] = user.email;
      return map;
    }, {} as Record<string, string>);

    return topUsers.map(item => ({
      userId: item.userId,
      email: userMap[item.userId] || 'Unknown',
      totalRequests: item._count.id,
      totalTokens: item._sum.tokens || 0,
      totalCredits: item._sum.credits || 0,
      lastActivity: item._max.createdAt!,
    }));
  } catch (error) {
    console.error('Error getting top users:', error);
    throw createInternalServerError('Failed to get top users');
  }
};

/**
 * Get comprehensive dashboard data
 */
export const getDashboardData = async (
  filters: AnalyticsFilters = {}
): Promise<DashboardData> => {
  try {
    const [overview, services, models, timeSeries, topUsers] = await Promise.all([
      getUsageMetrics(filters),
      getUsageByService(filters),
      getUsageByModel(filters),
      getUsageTimeSeries(filters),
      getTopUsers(filters, 5),
    ]);

    return {
      overview,
      services,
      models,
      timeSeries,
      topUsers,
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw createInternalServerError('Failed to get dashboard data');
  }
};

/**
 * Get usage data for CSV export
 */
export const getUsageDataForExport = async (
  filters: AnalyticsFilters = {},
  page: number = 1,
  limit: number = 1000
): Promise<{ data: any[]; total: number }> => {
  try {
    const skip = (page - 1) * limit;

    const whereClause: Prisma.UsageLogWhereInput = {};

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.service) {
      whereClause.service = filters.service;
    }

    if (filters.model) {
      whereClause.model = filters.model;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    const [total, data] = await Promise.all([
      prisma.usageLog.count({ where: whereClause }),
      prisma.usageLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedData = data.map(item => ({
      id: item.id,
      userId: item.userId,
      email: item.user.email,
      service: item.service,
      model: item.model || 'N/A',
      tokens: item.tokens || 0,
      credits: item.credits,
      metadata: JSON.stringify(item.metadata),
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      data: formattedData,
      total,
    };
  } catch (error) {
    console.error('Error getting usage data for export:', error);
    throw createInternalServerError('Failed to get usage data for export');
  }
};