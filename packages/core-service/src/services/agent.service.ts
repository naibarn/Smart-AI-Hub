import { PrismaClient, AgentType, AgentVisibility, AgentStatus, ApprovalAction } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { validateAgentData } from '../utils/agentValidation';

const prisma = new PrismaClient();

export interface CreateAgentData {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  type: AgentType;
  visibility?: AgentVisibility;
  flowDefinition?: any;
  inputSchema?: any;
  outputSchema?: any;
  executionConfig?: any;
  metadata?: any;
  externalUrl?: string;
  organizationId?: string;
  agencyId?: string;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  flowDefinition?: any;
  inputSchema?: any;
  outputSchema?: any;
  executionConfig?: any;
  metadata?: any;
  externalUrl?: string;
}

export interface GetMyAgentsOptions {
  page?: number;
  limit?: number;
  status?: AgentStatus;
  type?: AgentType;
  visibility?: AgentVisibility;
  search?: string;
}

export class AgentService {
  private static instance: AgentService;

  private constructor() {}

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  /**
   * Create a new agent with DRAFT status
   */
  async createAgent(userId: string, data: CreateAgentData) {
    try {
      // Validate agent data based on type
      const validation = validateAgentData(data.type, data.externalUrl, data.flowDefinition);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Validate user tier and organization/agency relationships
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          tier: true,
          parentOrganizationId: true,
          parentAgencyId: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Validate organization/agency access
      if (data.organizationId && data.organizationId !== user.parentOrganizationId) {
        throw new Error('Invalid organization access');
      }

      if (data.agencyId && data.agencyId !== user.parentAgencyId) {
        throw new Error('Invalid agency access');
      }

      const agent = await prisma.agent.create({
        data: {
          ...data,
          status: AgentStatus.DRAFT,
          visibility: data.visibility || AgentVisibility.PRIVATE,
          createdBy: userId,
          organizationId: data.organizationId || user.parentOrganizationId,
          agencyId: data.agencyId || user.parentAgencyId,
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

      return agent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  /**
   * Update an existing agent (only DRAFT or REJECTED status)
   */
  async updateAgent(agentId: string, userId: string, data: UpdateAgentData) {
    try {
      // Check if agent exists and user has permission
      const existingAgent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          createdBy: true,
          status: true,
          type: true,
          externalUrl: true,
          flowDefinition: true,
        }
      });

      if (!existingAgent) {
        throw new Error('Agent not found');
      }

      if (existingAgent.createdBy !== userId) {
        throw new Error('Not authorized to update this agent');
      }

      if (existingAgent.status !== AgentStatus.DRAFT && existingAgent.status !== AgentStatus.REJECTED) {
        throw new Error('Can only update agents with DRAFT or REJECTED status');
      }

      // Validate agent data based on type (use existing type if not being updated)
      const agentType = (data as any).type || existingAgent.type;
      const externalUrl = data.externalUrl !== undefined ? data.externalUrl : existingAgent.externalUrl || undefined;
      const flowDefinition = data.flowDefinition !== undefined ? data.flowDefinition : existingAgent.flowDefinition || undefined;
      
      const validation = validateAgentData(agentType, externalUrl, flowDefinition);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          ...data,
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

      return agent;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  /**
   * Delete an agent (only DRAFT status)
   */
  async deleteAgent(agentId: string, userId: string) {
    try {
      // Check if agent exists and user has permission
      const existingAgent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          createdBy: true,
          status: true,
        }
      });

      if (!existingAgent) {
        throw new Error('Agent not found');
      }

      if (existingAgent.createdBy !== userId) {
        throw new Error('Not authorized to delete this agent');
      }

      if (existingAgent.status !== AgentStatus.DRAFT) {
        throw new Error('Can only delete agents with DRAFT status');
      }

      await prisma.agent.delete({
        where: { id: agentId }
      });

      return { success: true, message: 'Agent deleted successfully' };
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  /**
   * Get user's agents with filtering and pagination
   */
  async getMyAgents(userId: string, options: GetMyAgentsOptions = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        visibility,
        search
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        createdBy: userId,
      };

      if (status) {
        where.status = status;
      }

      if (type) {
        where.type = type;
      }

      if (visibility) {
        where.visibility = visibility;
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
        orderBy: { updatedAt: 'desc' },
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
            select: {
              id: true,
              action: true,
              reason: true,
              createdAt: true,
            },
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
      console.error('Error getting user agents:', error);
      throw error;
    }
  }

  /**
   * Submit agent for approval (DRAFT → PENDING)
   */
  async submitForApproval(agentId: string, userId: string) {
    try {
      // Check if agent exists and user has permission
      const existingAgent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          createdBy: true,
          status: true,
          name: true,
        }
      });

      if (!existingAgent) {
        throw new Error('Agent not found');
      }

      if (existingAgent.createdBy !== userId) {
        throw new Error('Not authorized to submit this agent');
      }

      if (existingAgent.status !== AgentStatus.DRAFT) {
        throw new Error('Can only submit agents with DRAFT status');
      }

      // Update agent status to PENDING
      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: AgentStatus.PENDING,
          updatedAt: new Date(),
        }
      });

      // Log approval action
      await this.logApprovalAction(agentId, ApprovalAction.SUBMITTED, userId, 'Agent submitted for approval');

      return agent;
    } catch (error) {
      console.error('Error submitting agent for approval:', error);
      throw error;
    }
  }

  /**
   * Get agent by ID with permission check
   */
  async getAgentById(agentId: string, userId?: string) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
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
            include: {
              agent: false, // We don't need to include the agent again
            }
          }
        }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Check visibility permissions if userId is provided
      if (userId) {
        const canView = await this.checkAgentVisibility(agent, userId);
        if (!canView) {
          throw new Error('Not authorized to view this agent');
        }
      }

      return agent;
    } catch (error) {
      console.error('Error getting agent by ID:', error);
      throw error;
    }
  }

  /**
   * Check if user can view agent based on visibility
   */
  private async checkAgentVisibility(agent: any, userId: string): Promise<boolean> {
    // If user is the creator, they can always view
    if (agent.createdBy === userId) {
      return true;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tier: true,
        parentOrganizationId: true,
        parentAgencyId: true,
      }
    });

    if (!user) {
      return false;
    }

    // Check visibility based on agent status and visibility setting
    if (agent.status !== AgentStatus.APPROVED) {
      return false;
    }

    switch (agent.visibility) {
      case AgentVisibility.PRIVATE:
        return false; // Only creator can view (handled above)
      
      case AgentVisibility.ORGANIZATION:
        return agent.organizationId === user.parentOrganizationId;
      
      case AgentVisibility.AGENCY:
        return agent.agencyId === user.parentAgencyId;
      
      case AgentVisibility.PUBLIC:
        return true; // Any logged-in user can view approved public agents
      
      default:
        return false;
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

export const agentService = AgentService.getInstance();