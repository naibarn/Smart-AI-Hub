import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LogAgentUsageData {
  agentId: string;
  userId: string;
  inputData?: any;
  outputData?: any;
  tokensUsed?: number;
  costInCredits?: number;
  executionTime?: number;
  status?: string;
  errorMessage?: string;
}

export class AgentUsageService {
  private static instance: AgentUsageService;

  private constructor() {}

  public static getInstance(): AgentUsageService {
    if (!AgentUsageService.instance) {
      AgentUsageService.instance = new AgentUsageService();
    }
    return AgentUsageService.instance;
  }

  /**
   * Log agent usage (for external agents, no credits are deducted)
   */
  async logAgentUsage(data: LogAgentUsageData) {
    try {
      const usageLog = await prisma.agentUsageLog.create({
        data: {
          agentId: data.agentId,
          userId: data.userId,
          inputData: data.inputData || {},
          outputData: data.outputData || null,
          tokensUsed: data.tokensUsed || 0,
          costInCredits: data.costInCredits || 0, // 0 for external agents
          executionTime: data.executionTime || 0,
          status: data.status || 'completed',
          errorMessage: data.errorMessage || null,
        },
      });

      return usageLog;
    } catch (error) {
      console.error('Error logging agent usage:', error);
      throw error;
    }
  }

  /**
   * Get agent usage statistics
   */
  async getAgentUsageStats(agentId: string, userId?: string) {
    try {
      const where: any = { agentId };
      if (userId) {
        where.userId = userId;
      }

      const stats = await prisma.agentUsageLog.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
        _sum: {
          tokensUsed: true,
          costInCredits: true,
          executionTime: true,
        },
      });

      const totalUsage = await prisma.agentUsageLog.count({
        where,
      });

      const recentUsage = await prisma.agentUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      return {
        totalUsage,
        stats,
        recentUsage,
      };
    } catch (error) {
      console.error('Error getting agent usage stats:', error);
      throw error;
    }
  }

  /**
   * Get user's agent usage history
   */
  async getUserAgentUsageHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      agentId?: string;
    } = {}
  ) {
    try {
      const { page = 1, limit = 20, agentId } = options;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (agentId) {
        where.agentId = agentId;
      }

      const [usageLogs, total] = await Promise.all([
        prisma.agentUsageLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                type: true,
                icon: true,
              },
            },
          },
        }),
        prisma.agentUsageLog.count({ where }),
      ]);

      return {
        usageLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting user agent usage history:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to use an agent
   */
  async canUseAgent(agentId: string, userId: string): Promise<boolean> {
    try {
      // Get agent details
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          status: true,
          visibility: true,
          createdBy: true,
          organizationId: true,
          agencyId: true,
        },
      });

      if (!agent) {
        return false;
      }

      // Agent must be approved
      if (agent.status !== 'APPROVED') {
        return false;
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          tier: true,
          parentOrganizationId: true,
          parentAgencyId: true,
          isBlocked: true,
        },
      });

      if (!user || user.isBlocked) {
        return false;
      }

      // Check visibility permissions
      if (agent.createdBy === userId) {
        return true; // Creator can always use their own agents
      }

      switch (agent.visibility) {
        case 'PRIVATE':
          return false; // Only creator can use private agents
        case 'ORGANIZATION':
          return agent.organizationId === user.parentOrganizationId;
        case 'AGENCY':
          return agent.agencyId === user.parentAgencyId;
        case 'PUBLIC':
          return true; // Any logged-in user can use public agents
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking agent usage permission:', error);
      return false;
    }
  }
}

export const agentUsageService = AgentUsageService.getInstance();
