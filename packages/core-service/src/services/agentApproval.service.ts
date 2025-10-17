import { PrismaClient, AgentStatus, ApprovalAction } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export interface GetPendingAgentsOptions {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}

export class AgentApprovalService {
  private static instance: AgentApprovalService;

  private constructor() {}

  public static getInstance(): AgentApprovalService {
    if (!AgentApprovalService.instance) {
      AgentApprovalService.instance = new AgentApprovalService();
    }
    return AgentApprovalService.instance;
  }

  /**
   * Get all agents with PENDING status for admin review
   */
  async getPendingAgents(options: GetPendingAgentsOptions = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        search
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        status: AgentStatus.PENDING,
      };

      if (type) {
        where.type = type;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await prisma.agent.count({ where });

      // Get agents
      const agents = await prisma.agent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // Oldest first for fair review
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          approvalLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          }
        }
      });

      return {
        agents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      };
    } catch (error) {
      console.error('Error getting pending agents:', error);
      throw error;
    }
  }

  /**
   * Approve an agent (PENDING → APPROVED)
   */
  async approveAgent(agentId: string, adminId: string, notes?: string) {
    try {
      // Check if agent exists and is in PENDING status
      const existingAgent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          status: true,
          name: true,
          createdBy: true,
        }
      });

      if (!existingAgent) {
        throw new Error('Agent not found');
      }

      if (existingAgent.status !== AgentStatus.PENDING) {
        throw new Error('Can only approve agents with PENDING status');
      }

      // Update agent status to APPROVED
      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: AgentStatus.APPROVED,
          updatedAt: new Date(),
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        }
      });

      // Log approval action
      await this.logApprovalAction(agentId, ApprovalAction.APPROVED, adminId, notes);

      return agent;
    } catch (error) {
      console.error('Error approving agent:', error);
      throw error;
    }
  }

  /**
   * Reject an agent (PENDING → REJECTED)
   */
  async rejectAgent(agentId: string, adminId: string, reason: string) {
    try {
      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      // Check if agent exists and is in PENDING status
      const existingAgent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          status: true,
          name: true,
          createdBy: true,
        }
      });

      if (!existingAgent) {
        throw new Error('Agent not found');
      }

      if (existingAgent.status !== AgentStatus.PENDING) {
        throw new Error('Can only reject agents with PENDING status');
      }

      // Update agent status to REJECTED
      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: AgentStatus.REJECTED,
          updatedAt: new Date(),
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        }
      });

      // Log rejection action
      await this.logApprovalAction(agentId, ApprovalAction.REJECTED, adminId, reason);

      return agent;
    } catch (error) {
      console.error('Error rejecting agent:', error);
      throw error;
    }
  }

  /**
   * Get approval history for an agent
   */
  async getAgentApprovalHistory(agentId: string) {
    try {
      const approvalLogs = await prisma.agentApprovalLog.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              status: true,
            }
          }
        }
      });

      return approvalLogs;
    } catch (error) {
      console.error('Error getting agent approval history:', error);
      throw error;
    }
  }

  /**
   * Get approval statistics for admin dashboard
   */
  async getApprovalStatistics() {
    try {
      const stats = await prisma.agent.groupBy({
        by: ['status'],
        _count: {
          id: true,
        }
      });

      const result: Record<string, number> = {};
      
      // Initialize all statuses with 0
      Object.values(AgentStatus).forEach(status => {
        result[status] = 0;
      });

      // Fill in actual counts
      stats.forEach(stat => {
        result[stat.status] = stat._count.id;
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await prisma.agentApprovalLog.groupBy({
        by: ['action'],
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        _count: {
          id: true,
        }
      });

      const activity: Record<string, number> = {};
      
      // Initialize all actions with 0
      Object.values(ApprovalAction).forEach(action => {
        activity[action] = 0;
      });

      // Fill in actual counts
      recentActivity.forEach(stat => {
        activity[stat.action] = stat._count.id;
      });

      return {
        byStatus: result,
        recentActivity: activity,
        totalPending: result[AgentStatus.PENDING] || 0,
      };
    } catch (error) {
      console.error('Error getting approval statistics:', error);
      throw error;
    }
  }

  /**
   * Get agents waiting for approval the longest
   */
  async getOldestPendingAgents(limit: number = 5) {
    try {
      const agents = await prisma.agent.findMany({
        where: {
          status: AgentStatus.PENDING,
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        }
      });

      return agents;
    } catch (error) {
      console.error('Error getting oldest pending agents:', error);
      throw error;
    }
  }

  /**
   * Bulk approve multiple agents
   */
  async bulkApproveAgents(agentIds: string[], adminId: string, notes?: string) {
    try {
      if (!agentIds || agentIds.length === 0) {
        throw new Error('Agent IDs are required for bulk approval');
      }

      const results = [];
      const errors = [];

      for (const agentId of agentIds) {
        try {
          const result = await this.approveAgent(agentId, adminId, notes);
          results.push({ agentId, success: true, agent: result });
        } catch (error: any) {
          errors.push({ agentId, success: false, error: error.message });
        }
      }

      return {
        results,
        errors,
        totalProcessed: agentIds.length,
        successCount: results.length,
        errorCount: errors.length,
      };
    } catch (error) {
      console.error('Error in bulk agent approval:', error);
      throw error;
    }
  }

  /**
   * Bulk reject multiple agents
   */
  async bulkRejectAgents(agentIds: string[], adminId: string, reason: string) {
    try {
      if (!agentIds || agentIds.length === 0) {
        throw new Error('Agent IDs are required for bulk rejection');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required for bulk rejection');
      }

      const results = [];
      const errors = [];

      for (const agentId of agentIds) {
        try {
          const result = await this.rejectAgent(agentId, adminId, reason);
          results.push({ agentId, success: true, agent: result });
        } catch (error: any) {
          errors.push({ agentId, success: false, error: error.message });
        }
      }

      return {
        results,
        errors,
        totalProcessed: agentIds.length,
        successCount: results.length,
        errorCount: errors.length,
      };
    } catch (error) {
      console.error('Error in bulk agent rejection:', error);
      throw error;
    }
  }

  /**
   * Log approval action
   */
  private async logApprovalAction(
    agentId: string,
    action: ApprovalAction,
    performedBy: string,
    reason?: string
  ) {
    try {
      await prisma.agentApprovalLog.create({
        data: {
          agentId,
          action,
          performedBy,
          reason,
        }
      });
    } catch (error) {
      console.error('Error logging approval action:', error);
      // Don't throw error here, as it's not critical
    }
  }
}

export const agentApprovalService = AgentApprovalService.getInstance();