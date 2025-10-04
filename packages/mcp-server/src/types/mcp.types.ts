/**
 * MCP (Model Context Protocol) Types
 * Defines the message protocol for client-server communication
 */

// Message types
export type MCPMessageType = 'completion' | 'chat';

// Provider types
export type MCPProvider = 'openai' | 'claude' | 'auto';

// Response types
export type MCPResponseType = 'chunk' | 'done' | 'error';

// Message interface for chat/completion
export interface MCPMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Token usage information
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Error details
export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
}

// Client → Server Request
export interface MCPRequest {
  id: string; // Unique request ID
  type: MCPMessageType;
  provider?: MCPProvider;
  model: string;
  messages: MCPMessage[];
  stream: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

// Server → Client Response
export interface MCPResponse {
  id: string; // Matches request ID
  type: MCPResponseType;
  data?: string; // Content chunk for streaming
  usage?: TokenUsage; // Final usage stats (only in 'done' response)
  error?: ErrorDetails; // Error details (only in 'error' response)
  timestamp: string; // ISO timestamp
}

// Connection metadata
export interface ConnectionMetadata {
  userId: string;
  email: string;
  role: string;
  connectedAt: Date;
  lastActivity: Date;
  isAlive: boolean;
}

// Active connection tracking
export interface ActiveConnection {
  id: string;
  ws: any; // WebSocket instance
  metadata: ConnectionMetadata;
  pendingRequests: Map<string, MCPRequest>; // Request ID → Request
}

// Credit estimation result
export interface CreditEstimation {
  estimatedCredits: number;
  promptTokens: number;
  estimatedCompletionTokens: number;
}

// Usage log entry
export interface UsageLog {
  id: string;
  userId: string;
  requestId: string;
  provider: MCPProvider;
  model: string;
  type: MCPMessageType;
  usage: TokenUsage;
  creditsUsed: number;
  duration: number; // Request duration in ms
  timestamp: Date;
  success: boolean;
  error?: string;
}

// Abstracted LLM Provider types
export interface LLMRequest extends Omit<MCPRequest, 'id'> {
  provider?: MCPProvider;
}

export interface LLMResponse {
  content: string;
  usage?: TokenUsage;
  model: string;
  finishReason: string;
}