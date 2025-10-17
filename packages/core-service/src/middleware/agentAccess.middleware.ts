import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AgentVisibility, AgentStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

/**
 * Check if user can view agent based on visibility and status
 */
export const checkAgentVisibility = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to view agents',
      });
      return;
    }

    const agentId = req.params.id || req.params.agentId;
    
    if (!agentId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Agent ID is required',
      });
      return;
    }

    // Get agent details
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        createdBy: true,
        visibility: true,
        status: true,
        organizationId: true,
        agencyId: true,
      }
    });

    if (!agent) {
      res.status(404).json({
        error: 'Agent not found',
        message: 'The agent you are trying to access does not exist',
      });
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        tier: true,
        parentOrganizationId: true,
        parentAgencyId: true,
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Authenticated user not found in the system',
      });
      return;
    }

    // Check if user can view the agent
    const canView = await canUserViewAgent(agent, user);

    if (!canView) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this agent',
      });
      return;
    }

    // Attach agent to request for use in subsequent middleware
    (req as any).agent = agent;
    
    next();
  } catch (error) {
    console.error('Error checking agent visibility:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking agent visibility',
    });
  }
};

/**
 * Check if user can execute/run agent
 */
export const canExecuteAgent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to execute agents',
      });
      return;
    }

    const agentId = req.params.id || req.params.agentId;
    
    if (!agentId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Agent ID is required',
      });
      return;
    }

    // Get agent details
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        createdBy: true,
        visibility: true,
        status: true,
        organizationId: true,
        agencyId: true,
      }
    });

    if (!agent) {
      res.status(404).json({
        error: 'Agent not found',
        message: 'The agent you are trying to execute does not exist',
      });
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        tier: true,
        parentOrganizationId: true,
        parentAgencyId: true,
        credits: true,
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Authenticated user not found in the system',
      });
      return;
    }

    // Check if user can view the agent (prerequisite for execution)
    const canView = await canUserViewAgent(agent, user);

    if (!canView) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this agent',
      });
      return;
    }

    // Check if agent is approved (only approved agents can be executed)
    if (agent.status !== AgentStatus.APPROVED) {
      res.status(403).json({
        error: 'Agent not available',
        message: 'Only approved agents can be executed',
      });
      return;
    }

    // Check if user has sufficient credits (basic check, detailed check will be done during execution)
    if (user.credits <= 0) {
      res.status(402).json({
        error: 'Insufficient credits',
        message: 'You need credits to execute agents',
      });
      return;
    }

    // Attach agent to request for use in subsequent middleware
    (req as any).agent = agent;
    
    next();
  } catch (error) {
    console.error('Error checking agent execution permission:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking agent execution permission',
    });
  }
};

/**
 * Check if user can edit agent
 */
export const canEditAgent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to edit agents',
      });
      return;
    }

    const agentId = req.params.id || req.params.agentId;
    
    if (!agentId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Agent ID is required',
      });
      return;
    }

    // Get agent details
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        createdBy: true,
        visibility: true,
        status: true,
        organizationId: true,
        agencyId: true,
      }
    });

    if (!agent) {
      res.status(404).json({
        error: 'Agent not found',
        message: 'The agent you are trying to edit does not exist',
      });
      return;
    }

    // Check if user is the creator (only creators can edit their agents)
    if (agent.createdBy !== req.user.id) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Only the agent creator can edit this agent',
      });
      return;
    }

    // Check if agent is in editable state (DRAFT or REJECTED)
    if (agent.status !== AgentStatus.DRAFT && agent.status !== AgentStatus.REJECTED) {
      res.status(403).json({
        error: 'Agent not editable',
        message: 'Only agents with DRAFT or REJECTED status can be edited',
      });
      return;
    }

    // Attach agent to request for use in subsequent middleware
    (req as any).agent = agent;
    
    next();
  } catch (error) {
    console.error('Error checking agent edit permission:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking agent edit permission',
    });
  }
};

/**
 * Helper function to determine if user can view agent
 */
async function canUserViewAgent(agent: any, user: any): Promise<boolean> {
  // If user is the creator, they can always view
  if (agent.createdBy === user.id) {
    return true;
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
 * Middleware to check if user is admin or has elevated permissions
 */
export const requireAdminOrElevated = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource',
      });
      return;
    }

    // Check if user has admin role or elevated tier
    const userRoles = req.user.roles.map((r: any) => r.name);
    const isAdmin = userRoles.includes('admin') || userRoles.includes('administrator');
    const isElevatedTier = ['administrator', 'agency', 'organization', 'admin'].includes(req.user.role);

    if (!isAdmin && !isElevatedTier) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You need admin or elevated permissions to access this resource',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking permissions',
    });
  }
};

/**
 * Middleware to check if user can manage organization/agency agents
 */
export const canManageOrganizationAgents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to manage organization agents',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        tier: true,
        parentOrganizationId: true,
        parentAgencyId: true,
      }
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Authenticated user not found in the system',
      });
      return;
    }

    // Check if user has elevated tier (organization, agency, or admin)
    const isElevatedTier = ['administrator', 'agency', 'organization', 'admin'].includes(user.tier);

    if (!isElevatedTier) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You need elevated permissions to manage organization agents',
      });
      return;
    }

    // Attach user details to request
    (req as any).userDetails = user;
    
    next();
  } catch (error) {
    console.error('Error checking organization management permissions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking permissions',
    });
  }
};