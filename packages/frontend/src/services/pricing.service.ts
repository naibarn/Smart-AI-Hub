import { apiService } from './api.service';
import {
  AgentPlatform,
  AgentModel,
  PricingRule,
  CostBreakdown,
  AgentExecutionRequest,
  AgentExecutionResponse,
  CreditReservation,
  CostCalculationInput,
  UsageMetrics,
  AgentUsageLog,
  CostEstimationRequest,
  CostEstimationResponse,
  SessionUsageResponse,
  UsageHistoryResponse,
} from '@shared/types/pricing';

/**
 * Service for agent pricing system operations
 */
class PricingService {
  /**
   * Get pricing rules for a specific platform and model
   * @param platformId - Agent platform ID
   * @param modelId - Agent model ID
   * @returns Pricing rules
   */
  async getPricingRules(platformId: string, modelId?: string): Promise<PricingRule[]> {
    const params = new URLSearchParams();
    params.append('platformId', platformId);

    if (modelId) {
      params.append('modelId', modelId);
    }

    return apiService.get<PricingRule[]>(`/api/pricing/rules?${params.toString()}`);
  }

  /**
   * Get all pricing rules
   * @param params - Query parameters
   * @returns List of pricing rules
   */
  async getAllPricingRules(params?: {
    page?: number;
    limit?: number;
    platformId?: string;
    modelId?: string;
  }): Promise<{ data: PricingRule[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: PricingRule[]; total: number }>(
      `/api/pricing/rules/all?${queryParams.toString()}`
    );
  }

  /**
   * Create a new pricing rule
   * @param request - Pricing rule creation request
   * @returns Created pricing rule
   */
  async createPricingRule(
    request: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PricingRule> {
    return apiService.post<PricingRule>('/api/pricing/rules', request);
  }

  /**
   * Update a pricing rule
   * @param id - Pricing rule ID
   * @param request - Update request
   * @returns Updated pricing rule
   */
  async updatePricingRule(
    id: string,
    request: Partial<Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<PricingRule> {
    return apiService.patch<PricingRule>(`/api/pricing/rules/${id}`, request);
  }

  /**
   * Delete a pricing rule
   * @param id - Pricing rule ID
   * @returns Success response
   */
  async deletePricingRule(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/api/pricing/rules/${id}`);
  }

  /**
   * Calculate cost for agent execution
   * @param request - Cost calculation request
   * @returns Cost breakdown
   */
  async calculateCost(request: CostCalculationInput): Promise<CostBreakdown> {
    return apiService.post<CostBreakdown>('/api/pricing/calculate', request);
  }

  /**
   * Reserve credits for agent execution
   * @param request - Credit reservation request
   * @returns Credit reservation response
   */
  async reserveCredits(request: {
    amount: number;
    sessionId?: string;
  }): Promise<{ success: boolean; reservationId: string }> {
    return apiService.post<{ success: boolean; reservationId: string }>(
      '/api/pricing/reserve',
      request
    );
  }

  /**
   * Execute an agent with pricing
   * @param request - Agent execution request
   * @returns Agent execution response
   */
  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResponse> {
    return apiService.post<AgentExecutionResponse>('/api/pricing/execute', request);
  }

  /**
   * Estimate cost for agent execution
   * @param request - Cost estimation request
   * @returns Cost estimation response
   */
  async estimateCost(request: CostEstimationRequest): Promise<CostEstimationResponse> {
    return apiService.post<CostEstimationResponse>('/api/pricing/estimate', request);
  }

  /**
   * Get pricing statistics
   * @returns Pricing statistics
   */
  async getPricingStats(): Promise<{
    totalRules: number;
    platformsCount: number;
    modelsCount: number;
    averageCostPerToken: number;
  }> {
    return apiService.get<{
      totalRules: number;
      platformsCount: number;
      modelsCount: number;
      averageCostPerToken: number;
    }>('/api/pricing/stats');
  }

  /**
   * Get usage history for a user
   * @param params - Query parameters
   * @returns Usage history
   */
  async getUsageHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    platformId?: string;
    modelId?: string;
  }): Promise<UsageHistoryResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<UsageHistoryResponse>(
      `/api/pricing/usage-history?${queryParams.toString()}`
    );
  }

  /**
   * Get session usage
   * @param sessionId - Session ID
   * @returns Session usage response
   */
  async getSessionUsage(sessionId: string): Promise<SessionUsageResponse> {
    return apiService.get<SessionUsageResponse>(`/api/pricing/session/${sessionId}/usage`);
  }
}

export const pricingService = new PricingService();
export default pricingService;
