import { PrismaClient } from '@prisma/client';
import { deductCredits, getBalance, adjustCredits } from './credit.service';

const prisma = new PrismaClient();

export class AgentCostService {
  private static instance: AgentCostService;
  private agentSettingsCache: Map<string, any> = new Map();
  private lastCacheUpdate: Date = new Date(0);
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): AgentCostService {
    if (!AgentCostService.instance) {
      AgentCostService.instance = new AgentCostService();
    }
    return AgentCostService.instance;
  }

  /**
   * Calculate agent cost with markup
   */
  async calculateAgentCost(
    tokensUsed: number,
    modelName: string
  ): Promise<{
    baseCost: number;
    markupCost: number;
    totalCost: number;
    markupPercentage: number;
  }> {
    // Get base cost from OpenAI pricing
    const baseCost = this.calculateBaseCost(tokensUsed, modelName);

    // Get markup percentage from settings
    const markupPercentage = await this.getMarkupPercentage();

    // Calculate markup cost
    const markupCost = baseCost * (markupPercentage / 100);

    // Calculate total cost
    const totalCost = baseCost + markupCost;

    return {
      baseCost: Math.round(baseCost),
      markupCost: Math.round(markupCost),
      totalCost: Math.round(totalCost),
      markupPercentage,
    };
  }

  /**
   * Calculate base cost from OpenAI token pricing
   */
  private calculateBaseCost(tokensUsed: number, modelName: string): number {
    // OpenAI pricing per 1K tokens (in credits)
    const pricing: { [key: string]: number } = {
      'gpt-4': 30, // $0.03 per 1K tokens
      'gpt-4-32k': 60, // $0.06 per 1K tokens
      'gpt-4-turbo': 10, // $0.01 per 1K tokens
      'gpt-4-turbo-preview': 10, // $0.01 per 1K tokens
      'gpt-3.5-turbo': 1, // $0.001 per 1K tokens
      'gpt-3.5-turbo-16k': 2, // $0.002 per 1K tokens
      'text-davinci-003': 20, // $0.02 per 1K tokens
      'text-curie-001': 2, // $0.002 per 1K tokens
      'text-babbage-001': 0.5, // $0.0005 per 1K tokens
      'text-ada-001': 0.4, // $0.0004 per 1K tokens
    };

    // Get price for model, default to gpt-3.5-turbo pricing
    const pricePer1K = pricing[modelName] || pricing['gpt-3.5-turbo'];

    // Calculate cost (tokens are in units, convert to thousands)
    return (tokensUsed / 1000) * pricePer1K;
  }

  /**
   * Get markup percentage from agent settings
   */
  private async getMarkupPercentage(): Promise<number> {
    try {
      const setting = await this.getAgentSetting('agentmarkuppercentage');
      return parseFloat(setting.value) || 15; // Default 15% markup
    } catch (error) {
      console.warn('Failed to get markup percentage, using default:', error);
      return 15; // Default 15% markup
    }
  }

  /**
   * Get agent setting with caching
   */
  private async getAgentSetting(
    key: string
  ): Promise<{ key: string; value: string; dataType: string }> {
    // Check cache first
    if (this.isCacheValid()) {
      const cached = this.agentSettingsCache.get(key);
      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const setting = await prisma.agentSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new Error(`Agent setting not found: ${key}`);
    }

    // Update cache
    this.updateCache();

    return {
      key: setting.key,
      value: setting.value,
      dataType: setting.dataType,
    };
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate.getTime() < this.CACHE_TTL;
  }

  /**
   * Update cache with all agent settings
   */
  private async updateCache(): Promise<void> {
    try {
      const settings = await prisma.agentSetting.findMany();

      this.agentSettingsCache.clear();
      settings.forEach((setting) => {
        this.agentSettingsCache.set(setting.key, {
          key: setting.key,
          value: setting.value,
          dataType: setting.dataType,
        });
      });

      this.lastCacheUpdate = new Date();
    } catch (error) {
      console.error('Failed to update agent settings cache:', error);
    }
  }

  /**
   * Get cost estimation for agent execution
   */
  async getCostEstimation(
    agentId: string,
    inputTokens: number,
    modelName: string = 'gpt-3.5-turbo'
  ): Promise<{
    estimatedInputCost: number;
    estimatedOutputCost: number;
    estimatedTotalCost: number;
    estimatedTokens: number;
  }> {
    // Get agent details to estimate output tokens
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        flowDefinition: true,
        executionConfig: true,
      },
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Estimate output tokens based on input and agent complexity
    const estimatedOutputTokens = this.estimateOutputTokens(
      inputTokens,
      agent.flowDefinition,
      agent.executionConfig
    );

    const estimatedTotalTokens = inputTokens + estimatedOutputTokens;

    // Calculate costs
    const inputCost = await this.calculateAgentCost(inputTokens, modelName);
    const outputCost = await this.calculateAgentCost(estimatedOutputTokens, modelName);

    return {
      estimatedInputCost: inputCost.totalCost,
      estimatedOutputCost: outputCost.totalCost,
      estimatedTotalCost: inputCost.totalCost + outputCost.totalCost,
      estimatedTokens: estimatedTotalTokens,
    };
  }

  /**
   * Estimate output tokens based on agent complexity
   */
  private estimateOutputTokens(
    inputTokens: number,
    flowDefinition: any,
    executionConfig: any
  ): number {
    // Base estimation: output is typically 1.5x input for simple responses
    let multiplier = 1.5;

    // Adjust based on flow complexity
    if (flowDefinition && flowDefinition.steps) {
      const stepCount = flowDefinition.steps.length;

      // More complex flows with more steps generate more output
      if (stepCount > 5) {
        multiplier += 0.5;
      } else if (stepCount > 10) {
        multiplier += 1.0;
      }

      // Check for LLM calls which generate more output
      const llmSteps = flowDefinition.steps.filter((step: any) => step.type === 'llm_call').length;

      multiplier += llmSteps * 0.3;
    }

    // Adjust based on execution config
    if (executionConfig) {
      if (executionConfig.maxTokens) {
        // Cap estimation to max tokens
        const maxEstimate = executionConfig.maxTokens * 0.8; // 80% of max as safe estimate
        const currentEstimate = inputTokens * multiplier;
        return Math.min(currentEstimate, maxEstimate);
      }

      if (executionConfig.temperature && executionConfig.temperature > 0.7) {
        // Higher temperature might generate more varied/longer responses
        multiplier += 0.2;
      }
    }

    return Math.round(inputTokens * multiplier);
  }

  /**
   * Check if user has sufficient credits for agent execution
   */
  async checkSufficientCredits(
    userId: string,
    agentId: string,
    inputTokens: number,
    modelName: string = 'gpt-3.5-turbo'
  ): Promise<boolean> {
    try {
      // Get cost estimation
      const estimation = await this.getCostEstimation(agentId, inputTokens, modelName);

      // Check user's credit balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      return user.credits >= estimation.estimatedTotalCost;
    } catch (error) {
      console.error('Error checking sufficient credits:', error);
      return false;
    }
  }

  /**
   * Deduct credits for agent execution
   */
  async deductCredits(
    userId: string,
    agentId: string,
    actualTokensUsed: number,
    modelName: string = 'gpt-3.5-turbo',
    requestId?: string
  ): Promise<{
    success: boolean;
    costBreakdown: {
      baseCost: number;
      markupCost: number;
      totalCost: number;
      markupPercentage: number;
    };
    remainingCredits: number;
  }> {
    try {
      // Calculate actual cost
      const costBreakdown = await this.calculateAgentCost(actualTokensUsed, modelName);

      // Use existing credit service to deduct credits
      const deductionResult = await deductCredits(
        userId,
        requestId || `agent_${Date.now()}`,
        actualTokensUsed,
        modelName
      );
      const deductionSuccess = deductionResult.status === 'ok';

      if (!deductionSuccess) {
        throw new Error('Failed to deduct credits');
      }

      // Get remaining credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      const remainingCredits = user?.credits || 0;

      return {
        success: true,
        costBreakdown,
        remainingCredits,
      };
    } catch (error) {
      console.error('Error deducting credits:', error);
      return {
        success: false,
        costBreakdown: {
          baseCost: 0,
          markupCost: 0,
          totalCost: 0,
          markupPercentage: 0,
        },
        remainingCredits: 0,
      };
    }
  }

  /**
   * Refund credits for failed agent execution
   */
  async refundCredits(
    userId: string,
    tokensUsed: number,
    modelName: string = 'gpt-3.5-turbo',
    reason?: string
  ): Promise<boolean> {
    try {
      // Calculate cost to refund
      const costBreakdown = await this.calculateAgentCost(tokensUsed, modelName);

      // Use existing credit service to refund (adjust credits with negative amount)
      try {
        const result = await adjustCredits(userId, -tokensUsed, reason || 'Agent execution failed');
        return result > 0;
      } catch (error) {
        console.error('Error refunding credits:', error);
        return false;
      }
    } catch (error) {
      console.error('Error refunding credits:', error);
      return false;
    }
  }

  /**
   * Get agent cost statistics
   */
  async getAgentCostStats(
    agentId: string,
    timeRange?: { from: Date; to: Date }
  ): Promise<{
    totalExecutions: number;
    totalTokensUsed: number;
    totalCost: number;
    averageCostPerExecution: number;
    averageTokensPerExecution: number;
  }> {
    try {
      const whereClause: any = { agentId };

      if (timeRange) {
        whereClause.createdAt = {
          gte: timeRange.from,
          lte: timeRange.to,
        };
      }

      const stats = await prisma.agentUsageLog.aggregate({
        where: whereClause,
        _sum: {
          tokensUsed: true,
          costInCredits: true,
        },
        _count: {
          id: true,
        },
        _avg: {
          tokensUsed: true,
          costInCredits: true,
        },
      });

      return {
        totalExecutions: stats._count.id || 0,
        totalTokensUsed: stats._sum.tokensUsed || 0,
        totalCost: stats._sum.costInCredits || 0,
        averageCostPerExecution: Math.round(stats._avg.costInCredits || 0),
        averageTokensPerExecution: Math.round(stats._avg.tokensUsed || 0),
      };
    } catch (error) {
      console.error('Error getting agent cost stats:', error);
      return {
        totalExecutions: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        averageCostPerExecution: 0,
        averageTokensPerExecution: 0,
      };
    }
  }

  /**
   * Update agent setting
   */
  async updateAgentSetting(
    key: string,
    value: string,
    updatedBy: string,
    description?: string
  ): Promise<boolean> {
    try {
      await prisma.agentSetting.upsert({
        where: { key },
        update: {
          value,
          description,
          updatedBy,
          updatedAt: new Date(),
        },
        create: {
          key,
          value,
          description: description || `Setting for ${key}`,
          dataType: this.inferDataType(value),
          updatedBy,
        },
      });

      // Invalidate cache
      this.lastCacheUpdate = new Date(0);

      return true;
    } catch (error) {
      console.error('Error updating agent setting:', error);
      return false;
    }
  }

  /**
   * Infer data type from value
   */
  private inferDataType(value: string): string {
    // Try to parse as number
    if (!isNaN(Number(value)) && isFinite(Number(value))) {
      return 'number';
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return 'boolean';
    }

    // Try to parse as JSON
    try {
      JSON.parse(value);
      return 'json';
    } catch {
      // Default to string
      return 'string';
    }
  }

  /**
   * Get all agent settings
   */
  async getAllAgentSettings(): Promise<
    Array<{ key: string; value: string; description: string; dataType: string }>
  > {
    try {
      const settings = await prisma.agentSetting.findMany({
        select: {
          key: true,
          value: true,
          description: true,
          dataType: true,
        },
        orderBy: {
          key: 'asc',
        },
      });

      return settings.map((setting) => ({
        key: setting.key,
        value: setting.value,
        description: setting.description || '',
        dataType: setting.dataType,
      }));
    } catch (error) {
      console.error('Error getting all agent settings:', error);
      return [];
    }
  }
}

export const agentCostService = AgentCostService.getInstance();
