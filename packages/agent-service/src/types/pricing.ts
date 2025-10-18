// Pricing System Types

export interface AgentPlatform {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  isActive: boolean;
  description?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentModel {
  id: string;
  platformId: string;
  name: string;
  displayName: string;
  modelType: ModelType;
  isActive: boolean;
  capabilities: Record<string, boolean>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum ModelType {
  LLM = 'llm',
  EMBEDDING = 'embedding',
  VISION = 'vision',
  AUDIO = 'audio'
}

export interface PricingRule {
  id: string;
  modelId: string;
  componentType: ComponentType;
  unitType: UnitType;
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

export enum ComponentType {
  LLM_INPUT = 'llm_input',
  LLM_OUTPUT = 'llm_output',
  RAG_EMBEDDING = 'rag_embedding',
  RAG_SEARCH = 'rag_search',
  TOOL_CALL = 'tool_call',
  STORAGE = 'storage'
}

export enum UnitType {
  TOKEN = 'token',
  REQUEST = 'request',
  GB = 'gb',
  CALL = 'call'
}

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
  status: UsageStatus;
  errorMessage?: string;
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export enum UsageStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

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

export interface CreditReservation {
  id: string;
  userId: string;
  amount: number;
  sessionId?: string;
  status: ReservationStatus;
  chargedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  expiresAt: Date;
}

export enum ReservationStatus {
  ACTIVE = 'active',
  CHARGED = 'charged',
  REFUNDED = 'refunded',
  EXPIRED = 'expired'
}

// API Request/Response Types
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

export interface CostBreakdownItem {
  componentType: ComponentType;
  units: number;
  costPerUnit: number;
  totalCost: number;
  credits: number;
}

export enum UserTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

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
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    ragEmbeddings?: number;
    ragSearches?: number;
    toolCalls?: number;
  };
  cost: {
    totalCostUsd: number;
    totalCredits: number;
    breakdown: CostBreakdownItem[];
  };
  balanceAfter: number;
}

export interface SessionCostSummary {
  sessionId: string;
  totalCalls: number;
  totalCostUsd: number;
  totalCredits: number;
  breakdown: SessionCostBreakdown[];
}

export interface SessionCostBreakdown {
  callId: string;
  parentId?: string;
  cost: number;
  credits: number;
  status: UsageStatus;
}

export interface UsageFilters {
  from?: Date;
  to?: Date;
  platformId?: string;
  modelId?: string;
  status?: UsageStatus;
  limit?: number;
  offset?: number;
}

export interface UsageHistoryResult {
  logs: AgentUsageLog[];
  total: number;
  summary: {
    totalCalls: number;
    totalCredits: number;
    totalCostUsd: number;
  };
}

// Admin Types
export interface ModelUsageStats {
  modelId: string;
  modelName: string;
  totalCalls: number;
  totalCost: number;
  totalCredits: number;
  averageCostPerCall: number;
}

export interface UserUsageStats {
  userId: string;
  userName: string;
  totalCalls: number;
  totalCost: number;
  totalCredits: number;
  averageCostPerCall: number;
}

export interface PricingAnalytics {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  topModels: ModelUsageStats[];
  topUsers: UserUsageStats[];
}