import { LLMRequest, LLMResponse } from '../types/mcp.types';

export interface LLMProvider {
  execute(request: LLMRequest): Promise<LLMResponse>;
  estimateTokens(text: string): number;
  getSupportedModels(): string[];
  calculateCredits(model: string, tokens: number): number;
}

export abstract class BaseLLMProvider implements LLMProvider {
  abstract execute(request: LLMRequest): Promise<LLMResponse>;
  abstract getSupportedModels(): string[];

  estimateTokens(text: string): number {
    // 4 characters ≈ 1 token
    return Math.ceil(text.length / 4);
  }

  calculateCredits(model: string, tokens: number): number {
    const pricing: { [key: string]: number } = {
      'gpt-4': 10,
      'gpt-4-turbo': 10,
      'gpt-3.5-turbo': 1,
      'claude-3-opus': 8,
    };

    const rate = pricing[model] || 5; // Default rate
    return (tokens / 1000) * rate;
  }
}