import { Router, Request, Response } from 'express';
import { PrismaClient, AgentVisibility, AgentStatus, AgentType, Prisma } from '@prisma/client';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const router = Router();

// Redis client for caching
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis for public marketplace');
  } catch (error) {
    console.error('Failed to connect to Redis for public marketplace:', error);
  }
};

connectRedis();

export interface GetPublicAgentsOptions {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  search?: string;
  type?: AgentType;
  sortBy?: 'newest' | 'oldest' | 'name' | 'popular';
  sortOrder?: 'asc' | 'desc';
}

/**
 * GET /api/public/agents
 * Get all public agents (visibility=PUBLIC, status=APPROVED) with filtering and pagination
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      tags,
      search,
      type,
      sortBy = 'newest',
      sortOrder = 'desc'
    } = req.query;

    // Parse query parameters
    const options: GetPublicAgentsOptions = {
      page: parseInt(page as string) || 1,
      limit: Math.min(parseInt(limit as string) || 12, 50), // Cap at 50 for performance
      category: category as string,
      tags: tags ? (tags as string).split(',').map(tag => tag.trim()) : undefined,
      search: search as string,
      type: type as AgentType,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    };

    // Generate cache key
    const cacheKey = `public_agents:${JSON.stringify(options)}`;
    
    // Try to get from cache first
    try {
      const cachedResult = await redisClient.get(cacheKey);
      if (cachedResult) {
        return res.json({
          success: true,
          data: JSON.parse(cachedResult).agents,
          pagination: JSON.parse(cachedResult).pagination,
          cached: true
        });
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
      // Continue with database query if Redis fails
    }

    const skip = (options.page! - 1) * options.limit!;

    // Build where clause for public agents
    const where: any = {
      visibility: AgentVisibility.PUBLIC,
      status: AgentStatus.APPROVED,
    };

    // Add category filter
    if (options.category) {
      where.category = {
        contains: options.category,
        mode: 'insensitive'
      };
    }

    // Add search filter
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { category: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Add type filter
    if (options.type) {
      where.type = options.type;
    }

    // Add tags filter (searching in metadata)
    if (options.tags && options.tags.length > 0) {
      where.metadata = {
        path: ['tags'],
        array_contains: options.tags
      };
    }

    // Build order by clause
    let orderBy: any = {};
    switch (options.sortBy) {
      case 'newest':
        orderBy = { createdAt: options.sortOrder };
        break;
      case 'oldest':
        orderBy = { createdAt: options.sortOrder === 'desc' ? 'asc' : 'desc' };
        break;
      case 'name':
        orderBy = { name: options.sortOrder };
        break;
      case 'popular':
        // For popularity, we would need to track usage/views
        // For now, sort by creation date as a proxy
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get total count
    const total = await prisma.agent.count({ where });

    // Get agents with limited fields for performance
    const agents = await prisma.agent.findMany({
      where,
      skip,
      take: options.limit,
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        icon: true,
        type: true,
        visibility: true,
        status: true,
        metadata: true,
        externalUrl: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        // Include usage stats for popularity sorting
        usageLogs: {
          select: {
            id: true,
          },
          where: {
            status: 'completed'
          }
        }
      }
    });

    // Process agents to add usage count and format creator name
    const processedAgents = agents.map(agent => ({
      ...agent,
      usageCount: agent.usageLogs.length,
      creator: {
        ...agent.creator,
        displayName: agent.creator.profile?.firstName 
          ? `${agent.creator.profile.firstName} ${agent.creator.profile?.lastName || ''}`.trim()
          : 'Anonymous'
      },
      // Remove usageLogs from final response
      usageLogs: undefined
    }));

    const result = {
      agents: processedAgents,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit!),
      }
    };

    // Cache the result for 5 minutes
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
      // Continue even if caching fails
    }

    res.json({
      success: true,
      data: result.agents,
      pagination: result.pagination,
      cached: false
    });
  } catch (error: any) {
    console.error('Error getting public agents:', error);
    res.status(500).json({
      error: 'Failed to get public agents',
      message: error.message || 'An error occurred while retrieving public agents',
    });
  }
});

/**
 * GET /api/public/agents/:id
 * Get agent details by ID (only for PUBLIC + APPROVED agents)
 */
router.get('/agents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Agent ID is required',
      });
    }

    // Generate cache key
    const cacheKey = `public_agent:${id}`;
    
    // Try to get from cache first
    try {
      const cachedAgent = await redisClient.get(cacheKey);
      if (cachedAgent) {
        return res.json({
          success: true,
          data: JSON.parse(cachedAgent),
          cached: true
        });
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
      // Continue with database query if Redis fails
    }

    // Get agent details
    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        icon: true,
        type: true,
        visibility: true,
        status: true,
        flowDefinition: true,
        inputSchema: true,
        outputSchema: true,
        executionConfig: true,
        metadata: true,
        externalUrl: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              }
            }
          }
        },
        // Include usage stats
        usageLogs: {
          select: {
            id: true,
            createdAt: true,
            status: true,
          },
          where: {
            status: 'completed'
          }
        }
      }
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: 'The agent you are looking for does not exist',
      });
    }

    // Check if agent is public and approved
    if (agent.visibility !== AgentVisibility.PUBLIC || agent.status !== AgentStatus.APPROVED) {
      return res.status(404).json({
        error: 'Agent not available',
        message: 'This agent is not publicly available',
      });
    }

    // Process agent data
    const processedAgent = {
      ...agent,
      usageCount: agent.usageLogs.length,
      creator: {
        ...agent.creator,
        displayName: agent.creator.profile?.firstName 
          ? `${agent.creator.profile.firstName} ${agent.creator.profile?.lastName || ''}`.trim()
          : 'Anonymous'
      },
      // Remove sensitive data
      usageLogs: undefined,
      // Don't expose full flow definition for security
      flowDefinition: undefined,
    };

    // Cache the result for 10 minutes
    try {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(processedAgent));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
      // Continue even if caching fails
    }

    res.json({
      success: true,
      data: processedAgent,
      cached: false
    });
  } catch (error: any) {
    console.error('Error getting public agent details:', error);
    res.status(500).json({
      error: 'Failed to get agent details',
      message: error.message || 'An error occurred while retrieving agent details',
    });
  }
});

/**
 * GET /api/public/categories
 * Get all available categories for filtering
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    // Generate cache key
    const cacheKey = 'public_categories';
    
    // Try to get from cache first
    try {
      const cachedCategories = await redisClient.get(cacheKey);
      if (cachedCategories) {
        return res.json({
          success: true,
          data: JSON.parse(cachedCategories),
          cached: true
        });
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
      // Continue with database query if Redis fails
    }

    // Get unique categories from public approved agents
    const categories = await prisma.agent.groupBy({
      by: ['category'],
      where: {
        visibility: AgentVisibility.PUBLIC,
        status: AgentStatus.APPROVED,
        category: {
          not: null
        }
      },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    // Process categories
    const processedCategories = categories
      .filter(cat => cat.category) // Remove null categories
      .map(cat => ({
        name: cat.category,
        count: cat._count.category
      }));

    // Cache the result for 1 hour
    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(processedCategories));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
      // Continue even if caching fails
    }

    res.json({
      success: true,
      data: processedCategories,
      cached: false
    });
  } catch (error: any) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      error: 'Failed to get categories',
      message: error.message || 'An error occurred while retrieving categories',
    });
  }
});

/**
 * GET /api/public/tags
 * Get all available tags for filtering
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    // Generate cache key
    const cacheKey = 'public_tags';
    
    // Try to get from cache first
    try {
      const cachedTags = await redisClient.get(cacheKey);
      if (cachedTags) {
        return res.json({
          success: true,
          data: JSON.parse(cachedTags),
          cached: true
        });
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
      // Continue with database query if Redis fails
    }

    // Get agents with tags in metadata
    const agents = await prisma.agent.findMany({
      where: {
        visibility: AgentVisibility.PUBLIC,
        status: AgentStatus.APPROVED,
        metadata: {
          not: Prisma.JsonNull
        }
      },
      select: {
        metadata: true
      }
    });

    // Extract and count tags
    const tagCounts: Record<string, number> = {};
    
    agents.forEach(agent => {
      // Type assertion for metadata
      const metadata = agent.metadata as any;
      const tags = metadata?.tags;
      if (Array.isArray(tags)) {
        tags.forEach((tag: any) => {
          if (typeof tag === 'string' && tag.trim()) {
            const normalizedTag = tag.trim().toLowerCase();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort by count
    const processedTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ name: tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Limit to top 50 tags

    // Cache the result for 1 hour
    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(processedTags));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
      // Continue even if caching fails
    }

    res.json({
      success: true,
      data: processedTags,
      cached: false
    });
  } catch (error: any) {
    console.error('Error getting tags:', error);
    res.status(500).json({
      error: 'Failed to get tags',
      message: error.message || 'An error occurred while retrieving tags',
    });
  }
});

/**
 * GET /api/public/stats
 * Get public marketplace statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Generate cache key
    const cacheKey = 'public_stats';
    
    // Try to get from cache first
    try {
      const cachedStats = await redisClient.get(cacheKey);
      if (cachedStats) {
        return res.json({
          success: true,
          data: JSON.parse(cachedStats),
          cached: true
        });
      }
    } catch (redisError) {
      console.error('Redis cache read error:', redisError);
      // Continue with database query if Redis fails
    }

    // Get statistics
    const [
      totalAgents,
      agentsByType,
      agentsByCategory,
      recentAgents
    ] = await Promise.all([
      // Total public agents
      prisma.agent.count({
        where: {
          visibility: AgentVisibility.PUBLIC,
          status: AgentStatus.APPROVED
        }
      }),
      
      // Agents by type
      prisma.agent.groupBy({
        by: ['type'],
        where: {
          visibility: AgentVisibility.PUBLIC,
          status: AgentStatus.APPROVED
        },
        _count: {
          type: true
        }
      }),
      
      // Agents by category
      prisma.agent.groupBy({
        by: ['category'],
        where: {
          visibility: AgentVisibility.PUBLIC,
          status: AgentStatus.APPROVED,
          category: {
            not: null
          }
        },
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        },
        take: 10
      }),
      
      // Recent agents (last 7 days)
      prisma.agent.count({
        where: {
          visibility: AgentVisibility.PUBLIC,
          status: AgentStatus.APPROVED,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          }
        }
      })
    ]);

    const stats = {
      totalAgents,
      recentAgents,
      agentsByType: agentsByType.map(stat => ({
        type: stat.type,
        count: stat._count.type
      })),
      agentsByCategory: agentsByCategory
        .filter(stat => stat.category)
        .map(stat => ({
          category: stat.category,
          count: stat._count.category
        }))
    };

    // Cache the result for 30 minutes
    try {
      await redisClient.setEx(cacheKey, 1800, JSON.stringify(stats));
    } catch (redisError) {
      console.error('Redis cache write error:', redisError);
      // Continue even if caching fails
    }

    res.json({
      success: true,
      data: stats,
      cached: false
    });
  } catch (error: any) {
    console.error('Error getting marketplace statistics:', error);
    res.status(500).json({
      error: 'Failed to get marketplace statistics',
      message: error.message || 'An error occurred while retrieving marketplace statistics',
    });
  }
});

export default router;