/**
 * Pricing System Types
 * Types for Agent Skills Pricing System with multi-platform support
 */

// Component types for pricing
export enum PricingComponentType {
  LLM_INPUT = 'llm_input',
  LLM_OUTPUT = 'llm_output',
  RAG_EMBEDDING = 'rag_embedding',
  RAG_SEARCH = 'rag_search',
  TOOL_CALL = 'tool_call',
  STORAGE = 'storage',
}

// Unit types for pricing
export enum PricingUnitType {
  TOKEN = 'token',
  REQUEST = 'request',
  GB = 'gb',
  CALL = 'call',
}

// Agent platform types
export interface AgentPlatform {
  id: string;
  name: string;
  displayName: string;
  provider: string; // openai, anthropic, google, custom
  isActive: boolean;
  description?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Agent model types
export interface AgentModel {
  id: string;
  platformId: string;
  name: string;
  displayName: string;
  modelType: string; // llm, embedding, vision, audio
  isActive: boolean;
  capabilities: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Pricing rule
export interface PricingRule {
  id: string;
  modelId: string;
  componentType: PricingComponentType;
  unitType: PricingUnitType;
  costPerUnit: number;
  markupPercent: number;
  pricePerUnit: number;
  creditsPerUnit: number;
  minUnits?: number;
  tierMultiplier: number;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Usage metrics
export interface UsageMetrics {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  ragEmbeddings: number;
  ragSearches: number;
  toolCalls: number;
  nestedAgentCalls: number;
}

// Cost breakdown item
export interface CostBreakdownItem {
  component: PricingComponentType;
  units: number;
  costPerUnit: number;
  totalCost: number;
  credits: number;
}

// Cost breakdown
export interface CostBreakdown {
  llmInputCost: number;
  llmOutputCost: number;
  ragCost: number;
  toolCallCost: number;
  nestedAgentCost: number;
  totalCostUsd: number;
  totalCredits: number;
  breakdown: CostBreakdownItem[];
}

// Cost calculation input
export interface CostCalculationInput {
  platformId: string;
  modelId: string;
  inputTokens?: number;
  outputTokens?: number;
  ragEmbeddings?: number;
  ragSearches?: number;
  toolCalls?: number;
  nestedAgentCalls?: number;
  userTier?: UserTier;
}

// User tiers
export enum UserTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

// Agent usage log
export interface AgentUsageLog {
  id: string;
  userId: string;
  agentId?: string;
  platformId: string;
  modelId: string;
  sessionId?: string;
  parentCallId?: string;
  callDepth: number;
  
  // Usage metrics
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  ragEmbeddings: number;
  ragSearches: number;
  toolCalls: number;
  nestedAgentCalls: number;
  
  // Cost breakdown
  llmInputCost: number;
  llmOutputCost: number;
  ragCost: number;
  toolCallCost: number;
  nestedAgentCost: number;
  totalCostUsd: number;
  
  // Credits/Points charged
  creditsCharged: number;
  pointsCharged: number;
  currency: string;
  
  // Status
  status: string;
  errorMessage?: string;
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

// Cost estimation
export interface CostEstimation {
  id: string;
  userId: string;
  platformId: string;
  modelId: string;
  
  // Estimated usage
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  estimatedRagOps: number;
  estimatedToolCalls: number;
  
  // Estimated cost
  estimatedCostUsd: number;
  estimatedCredits: number;
  
  // User balance check
  userBalance: number;
  hasEnoughBalance: boolean;
  
  createdAt: Date;
  expiresAt: Date;
}

// Credit reservation
export interface CreditReservation {
  id: string;
  userId: string;
  amount: number;
  sessionId?: string;
  status: CreditReservationStatus;
  chargedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

// Credit reservation status
export enum CreditReservationStatus {
  ACTIVE = 'active',
  CHARGED = 'charged',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

// Pricing service interfaces
export interface PricingService {
  calculateCost(input: CostCalculationInput): Promise<CostBreakdown>;
  estimateCost(
    userId: string,
    platformId: string,
    modelId: string,
    estimatedTokens: { input?: number; output?: number }
  ): Promise<{
    estimatedCost: CostBreakdown;
    userBalance: number;
    hasEnoughBalance: boolean;
  }>;
  getPricingRules(platformId: string, modelId: string): Promise<PricingRule[]>;
}

// Credit service interfaces
export interface CreditService {
  reserveCredits(
    userId: string,
    amount: number,
    sessionId: string
  ): Promise<{ success: boolean; reservationId: string }>;
  chargeCredits(
    userId: string,
    reservationId: string,
    actualAmount: number,
    usageLogId: string
  ): Promise<{ success: boolean; balanceAfter: number }>;
  refundCredits(
    userId: string,
    reservationId: string,
    reason: string
  ): Promise<{ success: boolean }>;
  getUserBalance(userId: string): Promise<number>;
}

// Usage tracking service interfaces
export interface UsageTrackingService {
  trackAgentUsage(params: {
    userId: string;
    agentId?: string;
    platformId: string;
    modelId: string;
    sessionId?: string;
    parentCallId?: string;
    usage: UsageMetrics;
  }): Promise<AgentUsageLog>;
  
  getSessionCost(sessionId: string): Promise<SessionCostSummary>;
  getUserUsageHistory(
    userId: string,
    filters: UsageFilters
  ): Promise<UsageHistoryResult>;
}

// Session cost summary
export interface SessionCostSummary {
  totalCalls: number;
  totalCostUsd: number;
  totalCredits: number;
  breakdown: SessionCostBreakdown[];
}

// Session cost breakdown
export interface SessionCostBreakdown {
  callId: string;
  platformId: string;
  modelId: string;
  cost: number;
  credits: number;
  timestamp: Date;
}

// Usage filters
export interface UsageFilters {
  from?: Date;
  to?: Date;
  platformId?: string;
  modelId?: string;
  limit?: number;
  offset?: number;
}

// Usage history result
export interface UsageHistoryResult {
  logs: AgentUsageLog[];
  total: number;
  summary: {
    totalCalls: number;
    totalCredits: number;
    totalCostUsd: number;
  };
}

// Pricing constants
export const PRICING_CONSTANTS = {
  // Default pricing
  DEFAULT_PRICING: {
    LLM_INPUT_COST_PER_TOKEN: 0.000003, // $0.003 per 1K tokens
    LLM_OUTPUT_COST_PER_TOKEN: 0.000015, // $0.015 per 1K tokens
    RAG_EMBEDDING_COST: 0.001, // $0.001 per embedding
    RAG_SEARCH_COST: 0.0005, // $0.0005 per search
    TOOL_CALL_COST: 0.01, // $0.01 per tool call
  },
  
  // Default markup
  DEFAULT_MARKUP: 0.2, // 20%
  
  // Credit conversion
  CREDIT_TO_USD_RATE: 0.01, // 1 credit = $0.01
  
  // Reservation settings
  RESERVATION: {
    EXPIRY_MINUTES: 30, // 30 minutes
    MAX_RESERVATION_AMOUNT: 1000, // max 1000 credits
  },
  
  // Tier multipliers
  TIER_MULTIPLIERS: {
    [UserTier.FREE]: 1.0,
    [UserTier.BASIC]: 0.9, // 10% discount
    [UserTier.PRO]: 0.8, // 20% discount
    [UserTier.ENTERPRISE]: 0.7, // 30% discount
  },
} as const;

// API request/response types
export interface CostEstimationRequest {
  platformId: string;
  modelId: string;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  ragOperations?: number;
  toolCalls?: number;
}

export interface CostEstimationResponse {
  estimatedCost: CostBreakdown;
  userBalance: number;
  hasEnoughBalance: boolean;
}

export interface AgentExecutionRequest {
  platformId: string;
  modelId: string;
  agentId?: string;
  sessionId?: string;
  parentCallId?: string;
  input: any;
}

export interface AgentExecutionResponse {
  output: any;
  usage: UsageMetrics;
  cost: {
    totalCostUsd: number;
    totalCredits: number;
    breakdown: CostBreakdownItem[];
  };
  balanceAfter: number;
}

export interface SessionUsageResponse {
  totalCalls: number;
  totalCostUsd: number;
  totalCredits: number;
  breakdown: SessionCostBreakdown[];
}

export interface UsageHistoryResponse {
  logs: AgentUsageLog[];
  total: number;
  summary: {
    totalCalls: number;
    totalCredits: number;
    totalCostUsd: number;
  };
}