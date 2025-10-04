/**
 * Credit Service
 * Handles credit checking, estimation, and deduction for MCP requests
 */

import axios from 'axios';
import { MCPRequest, CreditEstimation } from '../types/mcp.types';
import { config } from '../config/config';
import { logger, logCreditCheck } from '../utils/logger';

export class CreditService {
  private creditServiceUrl: string;

  constructor() {
    this.creditServiceUrl = config.CREDIT_SERVICE_URL;
  }

  /**
   * Estimate credit cost for a request
   */
  public estimateCredits(request: MCPRequest): CreditEstimation {
    // Count tokens in messages (rough estimation)
    const promptTokens = this.countTokens(request.messages);
    
    // Estimate completion tokens based on model and prompt
    const estimatedCompletionTokens = this.estimateCompletionTokens(
      request.model,
      promptTokens,
      request.maxTokens
    );

    // Calculate total estimated tokens
    const totalTokens = promptTokens + estimatedCompletionTokens;

    // Calculate credit cost based on model pricing
    const pricePerToken = this.getModelPrice(request.model);
    const estimatedCredits = Math.ceil(totalTokens * pricePerToken * 1000); // Convert to credits

    logger.debug('Credit estimation calculated', {
      requestId: request.id,
      model: request.model,
      promptTokens,
      estimatedCompletionTokens,
      totalTokens,
      pricePerToken,
      estimatedCredits,
    });

    return {
      estimatedCredits,
      promptTokens,
      estimatedCompletionTokens,
    };
  }

  /**
   * Check if user has sufficient credits
   */
  public async checkSufficientCredits(userId: string, request: MCPRequest): Promise<boolean> {
    try {
      // Get user's current credit balance
      const balance = await this.getUserBalance(userId);
      
      // Estimate required credits
      const estimation = this.estimateCredits(request);
      
      // Check if balance is sufficient
      const hasSufficient = balance >= estimation.estimatedCredits;
      
      logCreditCheck(userId, request.id, balance, estimation.estimatedCredits, hasSufficient);
      
      if (!hasSufficient) {
        logger.warn('Insufficient credits for request', {
          userId,
          requestId: request.id,
          balance,
          required: estimation.estimatedCredits,
          deficit: estimation.estimatedCredits - balance,
        });
      }
      
      return hasSufficient;
    } catch (error) {
      logger.error('Error checking sufficient credits', {
        userId,
        requestId: request.id,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Fail safe - deny request if we can't check credits
      return false;
    }
  }

  /**
   * Deduct credits after request completion
   */
  public async deductCredits(userId: string, requestId: string, actualTokens: number, model: string): Promise<number> {
    try {
      // Calculate actual credit cost
      const pricePerToken = this.getModelPrice(model);
      const creditsToDeduct = Math.ceil(actualTokens * pricePerToken * 1000);

      // Call credit service to deduct credits
      const response = await axios.post(
        `${this.creditServiceUrl}/api/credits/use`,
        {
          amount: creditsToDeduct,
          description: `MCP Request ${requestId} - ${model}`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId,
          },
        }
      );

      logger.info('Credits deducted successfully', {
        userId,
        requestId,
        actualTokens,
        model,
        creditsDeducted: creditsToDeduct,
        newBalance: response.data.data?.account?.balance,
      });

      return creditsToDeduct;
    } catch (error) {
      logger.error('Error deducting credits', {
        userId,
        requestId,
        actualTokens,
        model,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // In case of error, we should still log the usage but handle credit deduction asynchronously
      throw new Error('Failed to deduct credits');
    }
  }

  /**
   * Get user's current credit balance
   */
  private async getUserBalance(userId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.creditServiceUrl}/api/credits/balance`,
        {
          headers: {
            'X-User-ID': userId,
          },
        }
      );

      return response.data.data?.balance || 0;
    } catch (error) {
      logger.error('Error getting user balance', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Return 0 if we can't get balance (fail safe)
      return 0;
    }
  }

  /**
   * Count tokens in messages (rough estimation)
   * In production, you'd use a proper tokenizer like tiktoken
   */
  private countTokens(messages: any[]): number {
    let totalTokens = 0;
    
    for (const message of messages) {
      if (message.content) {
        // Rough estimation: ~4 characters per token
        totalTokens += Math.ceil(message.content.length / 4);
      }
    }
    
    return totalTokens;
  }

  /**
   * Estimate completion tokens based on model and prompt
   */
  private estimateCompletionTokens(model: string, promptTokens: number, maxTokens?: number): number {
    // Different models have different response patterns
    let ratio = 0.75; // Default: completion is 75% of prompt
    
    if (model.includes('gpt-3.5')) {
      ratio = 0.5;
    } else if (model.includes('gpt-4')) {
      ratio = 0.75;
    } else if (model.includes('claude')) {
      ratio = 0.8;
    }
    
    const estimatedTokens = Math.ceil(promptTokens * ratio);
    
    // Respect maxTokens if provided
    if (maxTokens && estimatedTokens > maxTokens) {
      return maxTokens;
    }
    
    return estimatedTokens;
  }

  /**
   * Get model pricing (credits per token)
   */
  private getModelPrice(model: string): number {
    // Convert from credits per 1K tokens to credits per token
    const pricePer1K = config.MODEL_PRICING[model as keyof typeof config.MODEL_PRICING] || 0.001;
    return pricePer1K / 1000;
  }

  /**
   * Validate request parameters for credit calculation
   */
  public validateRequest(request: MCPRequest): { valid: boolean; error?: string } {
    // Check if model is supported
    if (!config.MODEL_PRICING[request.model as keyof typeof config.MODEL_PRICING]) {
      return {
        valid: false,
        error: `Unsupported model: ${request.model}`,
      };
    }

    // Check maxTokens limit
    if (request.maxTokens && request.maxTokens > config.MAX_TOKENS_REQUEST) {
      return {
        valid: false,
        error: `maxTokens exceeds limit of ${config.MAX_TOKENS_REQUEST}`,
      };
    }

    // Check temperature range
    if (request.temperature !== undefined) {
      if (request.temperature < config.MIN_TEMPERATURE || request.temperature > config.MAX_TEMPERATURE) {
        return {
          valid: false,
          error: `Temperature must be between ${config.MIN_TEMPERATURE} and ${config.MAX_TEMPERATURE}`,
        };
      }
    }

    // Check message count
    if (request.messages.length > config.MAX_MESSAGES_IN_CONTEXT) {
      return {
        valid: false,
        error: `Too many messages in context (max: ${config.MAX_MESSAGES_IN_CONTEXT})`,
      };
    }

    // Check if messages have content
    for (const message of request.messages) {
      if (!message.content || typeof message.content !== 'string') {
        return {
          valid: false,
          error: 'All messages must have valid content',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get minimum credits required for any request
   */
  public getMinimumCreditsRequired(): number {
    return config.MIN_CREDITS_REQUIRED;
  }

  /**
   * Get model pricing information
   */
  public getModelPricing(): Record<string, number> {
    return { ...config.MODEL_PRICING };
  }

  /**
   * Check if user has any credits at all
   */
  public async hasAnyCredits(userId: string): Promise<boolean> {
    try {
      const balance = await this.getUserBalance(userId);
      return balance > 0;
    } catch (error) {
      logger.error('Error checking if user has credits', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

// Export singleton instance
export const creditService = new CreditService();