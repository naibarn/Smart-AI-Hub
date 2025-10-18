import {
  CostCalculationInput,
  CostBreakdown,
  CostBreakdownItem,
  PricingRule,
  AgentModel,
  AgentPlatform,
  UserTier,
  ComponentType,
  UnitType,
  ModelType,
  CostEstimationRequest,
  CostEstimationResponse,
  User,
  ApiResponse,
  ErrorCode,
} from '@/types';

export class PricingService {
  /**
   * Calculate cost for agent usage
   */
  async calculateCost(input: CostCalculationInput): Promise<CostBreakdown> {
    try {
      // Get pricing rules for the model
      const pricingRules = await this.getPricingRules(input.platformId, input.modelId);
      if (!pricingRules || pricingRules.length === 0) {
        throw new Error('No pricing rules found for the specified model');
      }

      // Get tier multiplier
      const tierMultiplier = this.getTierMultiplier(input.userTier || UserTier.FREE);

      // Calculate costs for each component
      const breakdown: CostBreakdownItem[] = [];
      let totalCostUsd = 0;
      let totalCredits = 0;

      // LLM Input cost
      if (input.inputTokens && input.inputTokens > 0) {
        const inputRule = pricingRules.find((r) => r.componentType === ComponentType.LLM_INPUT);
        if (inputRule) {
          const cost = this.calculateComponentCost(
            input.inputTokens,
            inputRule.pricePerUnit,
            tierMultiplier
          );
          const credits = this.calculateComponentCredits(
            input.inputTokens,
            inputRule.creditsPerUnit,
            tierMultiplier
          );

          breakdown.push({
            componentType: ComponentType.LLM_INPUT,
            units: input.inputTokens,
            costPerUnit: inputRule.pricePerUnit,
            totalCost: cost,
            credits,
          });

          totalCostUsd += cost;
          totalCredits += credits;
        }
      }

      // LLM Output cost
      if (input.outputTokens && input.outputTokens > 0) {
        const outputRule = pricingRules.find((r) => r.componentType === ComponentType.LLM_OUTPUT);
        if (outputRule) {
          const cost = this.calculateComponentCost(
            input.outputTokens,
            outputRule.pricePerUnit,
            tierMultiplier
          );
          const credits = this.calculateComponentCredits(
            input.outputTokens,
            outputRule.creditsPerUnit,
            tierMultiplier
          );

          breakdown.push({
            componentType: ComponentType.LLM_OUTPUT,
            units: input.outputTokens,
            costPerUnit: outputRule.pricePerUnit,
            totalCost: cost,
            credits,
          });

          totalCostUsd += cost;
          totalCredits += credits;
        }
      }

      // RAG Embedding cost
      if (input.ragEmbeddings && input.ragEmbeddings > 0) {
        const ragEmbedRule = pricingRules.find(
          (r) => r.componentType === ComponentType.RAG_EMBEDDING
        );
        if (ragEmbedRule) {
          const cost = this.calculateComponentCost(
            input.ragEmbeddings,
            ragEmbedRule.pricePerUnit,
            tierMultiplier
          );
          const credits = this.calculateComponentCredits(
            input.ragEmbeddings,
            ragEmbedRule.creditsPerUnit,
            tierMultiplier
          );

          breakdown.push({
            componentType: ComponentType.RAG_EMBEDDING,
            units: input.ragEmbeddings,
            costPerUnit: ragEmbedRule.pricePerUnit,
            totalCost: cost,
            credits,
          });

          totalCostUsd += cost;
          totalCredits += credits;
        }
      }

      // RAG Search cost
      if (input.ragSearches && input.ragSearches > 0) {
        const ragSearchRule = pricingRules.find(
          (r) => r.componentType === ComponentType.RAG_SEARCH
        );
        if (ragSearchRule) {
          const cost = this.calculateComponentCost(
            input.ragSearches,
            ragSearchRule.pricePerUnit,
            tierMultiplier
          );
          const credits = this.calculateComponentCredits(
            input.ragSearches,
            ragSearchRule.creditsPerUnit,
            tierMultiplier
          );

          breakdown.push({
            componentType: ComponentType.RAG_SEARCH,
            units: input.ragSearches,
            costPerUnit: ragSearchRule.pricePerUnit,
            totalCost: cost,
            credits,
          });

          totalCostUsd += cost;
          totalCredits += credits;
        }
      }

      // Tool Call cost
      if (input.toolCalls && input.toolCalls > 0) {
        const toolCallRule = pricingRules.find((r) => r.componentType === ComponentType.TOOL_CALL);
        if (toolCallRule) {
          const cost = this.calculateComponentCost(
            input.toolCalls,
            toolCallRule.pricePerUnit,
            tierMultiplier
          );
          const credits = this.calculateComponentCredits(
            input.toolCalls,
            toolCallRule.creditsPerUnit,
            tierMultiplier
          );

          breakdown.push({
            componentType: ComponentType.TOOL_CALL,
            units: input.toolCalls,
            costPerUnit: toolCallRule.pricePerUnit,
            totalCost: cost,
            credits,
          });

          totalCostUsd += cost;
          totalCredits += credits;
        }
      }

      // Nested Agent cost
      if (input.nestedAgentCalls && input.nestedAgentCalls > 0) {
        const nestedRule = pricingRules.find((r) => r.componentType === ComponentType.STORAGE);
        if (nestedRule) {
          const cost = this.calculateComponentCost(
            input.nestedAgentCalls,
            nestedRule.pricePerUnit,
            tierMultiplier
          );
          const credits = this.calculateComponentCredits(
            input.nestedAgentCalls,
            nestedRule.creditsPerUnit,
            tierMultiplier
          );

          breakdown.push({
            componentType: ComponentType.STORAGE,
            units: input.nestedAgentCalls,
            costPerUnit: nestedRule.pricePerUnit,
            totalCost: cost,
            credits,
          });

          totalCostUsd += cost;
          totalCredits += credits;
        }
      }

      return {
        llmInputCost:
          breakdown.find((item) => item.componentType === ComponentType.LLM_INPUT)?.totalCost || 0,
        llmOutputCost:
          breakdown.find((item) => item.componentType === ComponentType.LLM_OUTPUT)?.totalCost || 0,
        ragCost:
          (breakdown.find((item) => item.componentType === ComponentType.RAG_EMBEDDING)
            ?.totalCost || 0) +
          (breakdown.find((item) => item.componentType === ComponentType.RAG_SEARCH)?.totalCost ||
            0),
        toolCallCost:
          breakdown.find((item) => item.componentType === ComponentType.TOOL_CALL)?.totalCost || 0,
        nestedAgentCost:
          breakdown.find((item) => item.componentType === ComponentType.STORAGE)?.totalCost || 0,
        totalCostUsd,
        totalCredits,
        breakdown,
      };
    } catch (error) {
      console.error('Error calculating cost:', error);
      throw error;
    }
  }

  /**
   * Estimate cost before execution
   */
  async estimateCost(
    userId: string,
    platformId: string,
    modelId: string,
    estimatedTokens: { input?: number; output?: number }
  ): Promise<CostEstimationResponse> {
    try {
      // Get user balance
      const userBalance = await this.getUserBalance(userId);

      // Calculate estimated cost
      const costBreakdown = await this.calculateCost({
        platformId,
        modelId,
        inputTokens: estimatedTokens.input,
        outputTokens: estimatedTokens.output,
        userTier: await this.getUserTier(userId),
      });

      const hasEnoughBalance = userBalance >= costBreakdown.totalCredits;

      return {
        estimatedCost: costBreakdown,
        userBalance,
        hasEnoughBalance,
      };
    } catch (error) {
      console.error('Error estimating cost:', error);
      throw error;
    }
  }

  /**
   * Get pricing rules for a platform/model
   */
  async getPricingRules(platformId: string, modelId: string): Promise<PricingRule[]> {
    try {
      // Implementation would query from database

      // Return mock pricing rules
      const mockRules: PricingRule[] = [
        {
          id: 'rule_1',
          modelId,
          componentType: ComponentType.LLM_INPUT,
          unitType: UnitType.TOKEN,
          costPerUnit: 0.000003,
          markupPercent: 20,
          pricePerUnit: 0.0000036,
          creditsPerUnit: 0.00036,
          tierMultiplier: 1.0,
          isActive: true,
          effectiveFrom: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
        {
          id: 'rule_2',
          modelId,
          componentType: ComponentType.LLM_OUTPUT,
          unitType: UnitType.TOKEN,
          costPerUnit: 0.000015,
          markupPercent: 20,
          pricePerUnit: 0.000018,
          creditsPerUnit: 0.0018,
          tierMultiplier: 1.0,
          isActive: true,
          effectiveFrom: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
        {
          id: 'rule_3',
          modelId,
          componentType: ComponentType.RAG_EMBEDDING,
          unitType: UnitType.REQUEST,
          costPerUnit: 0,
          markupPercent: 0,
          pricePerUnit: 0.001,
          creditsPerUnit: 0.1,
          tierMultiplier: 1.0,
          isActive: true,
          effectiveFrom: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
        {
          id: 'rule_4',
          modelId,
          componentType: ComponentType.RAG_SEARCH,
          unitType: UnitType.REQUEST,
          costPerUnit: 0,
          markupPercent: 0,
          pricePerUnit: 0.0005,
          creditsPerUnit: 0.05,
          tierMultiplier: 1.0,
          isActive: true,
          effectiveFrom: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
      ];

      return mockRules;
    } catch (error) {
      console.error('Error getting pricing rules:', error);
      return [];
    }
  }

  /**
   * Get all platforms
   */
  async getPlatforms(): Promise<AgentPlatform[]> {
    try {
      // Implementation would query from database

      // Return mock platforms
      const mockPlatforms: AgentPlatform[] = [
        {
          id: 'platform_1',
          name: 'claude',
          displayName: 'Claude Agent Skills',
          provider: 'anthropic',
          isActive: true,
          description: 'Claude AI agents',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'platform_2',
          name: 'openai',
          displayName: 'OpenAI Assistants',
          provider: 'openai',
          isActive: true,
          description: 'OpenAI GPT agents',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return mockPlatforms;
    } catch (error) {
      console.error('Error getting platforms:', error);
      return [];
    }
  }

  /**
   * Get models for a platform
   */
  async getModels(platformId: string): Promise<AgentModel[]> {
    try {
      // Implementation would query from database

      // Return mock models
      const mockModels: AgentModel[] = [
        {
          id: 'model_1',
          platformId,
          name: 'claude-3-5-sonnet',
          displayName: 'Claude 3.5 Sonnet',
          modelType: ModelType.LLM,
          isActive: true,
          capabilities: { rag: true, tools: true, vision: true },
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return mockModels;
    } catch (error) {
      console.error('Error getting models:', error);
      return [];
    }
  }

  /**
   * Update pricing rule (admin only)
   */
  async updatePricingRule(
    ruleId: string,
    updates: Partial<PricingRule>
  ): Promise<ApiResponse<PricingRule>> {
    try {
      // Implementation would update in database
      const updatedRule: PricingRule = {
        id: ruleId,
        modelId: 'model_1',
        componentType: ComponentType.LLM_INPUT,
        unitType: UnitType.TOKEN,
        costPerUnit: updates.costPerUnit || 0.000003,
        markupPercent: updates.markupPercent || 20,
        pricePerUnit: updates.pricePerUnit || 0.0000036,
        creditsPerUnit: updates.creditsPerUnit || 0.00036,
        tierMultiplier: updates.tierMultiplier || 1.0,
        isActive: updates.isActive !== undefined ? updates.isActive : true,
        effectiveFrom: updates.effectiveFrom || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: updates.metadata || {},
      };

      return {
        success: true,
        data: updatedRule,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update pricing rule',
        },
        timestamp: new Date(),
      };
    }
  }

  // Private helper methods

  private getTierMultiplier(tier: UserTier): number {
    switch (tier) {
      case UserTier.FREE:
        return 1.0;
      case UserTier.BASIC:
        return 0.9; // 10% discount
      case UserTier.PRO:
        return 0.8; // 20% discount
      case UserTier.ENTERPRISE:
        return 0.7; // 30% discount
      default:
        return 1.0;
    }
  }

  private calculateComponentCost(
    units: number,
    pricePerUnit: number,
    tierMultiplier: number
  ): number {
    return units * pricePerUnit * tierMultiplier;
  }

  private calculateComponentCredits(
    units: number,
    creditsPerUnit: number,
    tierMultiplier: number
  ): number {
    return units * creditsPerUnit * tierMultiplier;
  }

  private async getUserBalance(userId: string): Promise<number> {
    // Implementation would query from database or credit service
    return 100; // Mock balance
  }

  private async getUserTier(userId: string): Promise<UserTier> {
    // Implementation would query from database
    return UserTier.FREE; // Mock tier
  }
}
