import OpenAI from 'openai';
import { LLMRequest, LLMResponse } from '../types/mcp.types';
import { BaseLLMProvider } from './base.provider';
import { logger } from '../utils/logger';

export class OpenAIProvider extends BaseLLMProvider {
  private openai: OpenAI;
  private supportedModels: string[] = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  private readonly REQUEST_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(apiKey: string) {
    super();
    this.openai = new OpenAI({
      apiKey,
      timeout: this.REQUEST_TIMEOUT,
      maxRetries: this.MAX_RETRIES,
    });
  }

  getSupportedModels(): string[] {
    return this.supportedModels;
  }

  async execute(request: LLMRequest): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    // Validate API key
    if (!this.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Check model availability
    if (!this.supportedModels.includes(request.model)) {
      throw new Error(`Model ${request.model} is not supported by OpenAI provider`);
    }

    try {
      if (request.stream) {
        return this.executeStreaming(request);
      }
      return this.executeNonStreaming(request);
    } catch (error: any) {
      this.handleOpenAIError(error);
      throw error; // Re-throw after logging
    }
  }

  private async *executeStreaming(request: LLMRequest): AsyncIterable<LLMResponse> {
    let retryCount = 0;
    let buffer = '';
    const maxBufferSize = 1000; // Maximum characters to buffer

    while (retryCount <= this.MAX_RETRIES) {
      try {
        logger.debug('Starting OpenAI streaming request', {
          model: request.model,
          retryCount,
          maxTokens: request.maxTokens,
        });

        const stream = await this.openai.chat.completions.create({
          model: request.model,
          messages: request.messages,
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          top_p: request.topP,
          frequency_penalty: request.frequencyPenalty,
          presence_penalty: request.presencePenalty,
          stop: request.stop,
          stream: true,
        });

        let chunkCount = 0;
        
        for await (const chunk of stream) {
          chunkCount++;
          
          // Handle rate limiting
          if (chunk.choices[0]?.finish_reason === 'length') {
            logger.warn('OpenAI streaming hit length limit', {
              model: request.model,
              chunks: chunkCount,
            });
          }

          const content = chunk.choices[0]?.delta?.content || '';
          const finishReason = chunk.choices[0]?.finish_reason || '';
          
          // Buffer management for smooth streaming
          if (content) {
            buffer += content;
            
            // Yield buffered content when it reaches a reasonable size or on punctuation
            if (buffer.length >= maxBufferSize || /[.!?]\s*$/.test(content)) {
              yield {
                content: buffer,
                model: chunk.model || request.model,
                finishReason: '',
                usage: undefined,
              };
              buffer = '';
            }
          }
          
          // Handle final chunk with usage
          if (finishReason) {
            // Yield any remaining buffered content
            if (buffer) {
              yield {
                content: buffer,
                model: chunk.model || request.model,
                finishReason: '',
                usage: undefined,
              };
              buffer = '';
            }
            
            // Get usage information from the final chunk
            const usage = chunk.usage ? {
              promptTokens: chunk.usage.prompt_tokens,
              completionTokens: chunk.usage.completion_tokens,
              totalTokens: chunk.usage.total_tokens,
            } : undefined;

            yield {
              content: '',
              model: chunk.model || request.model,
              finishReason,
              usage,
            };
            
            logger.debug('OpenAI streaming completed', {
              model: request.model,
              chunks: chunkCount,
              finishReason,
              usage,
            });
            
            return; // Exit the function successfully
          }
        }
        
        // If we get here without a finish_reason, handle incomplete stream
        if (buffer) {
          yield {
            content: buffer,
            model: request.model,
            finishReason: 'incomplete',
            usage: undefined,
          };
        }
        
        return; // Exit after processing all chunks
      } catch (error: any) {
        logger.error('Error in OpenAI streaming request', {
          error: error.message,
          status: error.status,
          retryCount,
          model: request.model,
        });

        // Retry on rate limit errors
        if (error.status === 429 && retryCount < this.MAX_RETRIES) {
          const retryDelay = this.RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
          logger.info(`Retrying OpenAI streaming request after ${retryDelay}ms`);
          await this.sleep(retryDelay);
          retryCount++;
          continue;
        }
        
        // For other errors, throw immediately
        this.handleOpenAIError(error);
        throw error;
      }
    }
    
    throw new Error(`OpenAI streaming request failed after ${this.MAX_RETRIES} retries`);
  }

  private async executeNonStreaming(request: LLMRequest): Promise<LLMResponse> {
    let retryCount = 0;

    while (retryCount <= this.MAX_RETRIES) {
      try {
        logger.debug('Starting OpenAI non-streaming request', {
          model: request.model,
          retryCount,
          maxTokens: request.maxTokens,
        });

        const completion = await this.openai.chat.completions.create({
          model: request.model,
          messages: request.messages,
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          top_p: request.topP,
          frequency_penalty: request.frequencyPenalty,
          presence_penalty: request.presencePenalty,
          stop: request.stop,
        });

        const { usage, choices, model } = completion;
        const content = choices[0]?.message?.content?.trim();
        const finishReason = choices[0]?.finish_reason;

        if (!usage || !content) {
          throw new Error('Invalid OpenAI response: missing usage or content');
        }

        logger.debug('OpenAI non-streaming completed', {
          model: request.model,
          finishReason,
          usage: {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          },
        });

        return {
          content,
          usage: {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          },
          model,
          finishReason,
        };
      } catch (error: any) {
        logger.error('Error in OpenAI non-streaming request', {
          error: error.message,
          status: error.status,
          retryCount,
          model: request.model,
        });

        // Retry on rate limit errors
        if (error.status === 429 && retryCount < this.MAX_RETRIES) {
          const retryDelay = this.RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
          logger.info(`Retrying OpenAI non-streaming request after ${retryDelay}ms`);
          await this.sleep(retryDelay);
          retryCount++;
          continue;
        }
        
        // For other errors, throw immediately
        this.handleOpenAIError(error);
        throw error;
      }
    }
    
    throw new Error(`OpenAI non-streaming request failed after ${this.MAX_RETRIES} retries`);
  }

  /**
   * Handle OpenAI API errors with appropriate logging and user-friendly messages
   */
  private handleOpenAIError(error: any): void {
    const errorDetails = {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    };

    logger.error('OpenAI API error', errorDetails);

    // Map common OpenAI errors to user-friendly messages
    switch (error.status) {
      case 401:
        throw new Error('OpenAI API key is invalid or expired. Please check your configuration.');
      
      case 429:
        const retryAfter = error.headers?.['retry-after'] || '60';
        throw new Error(`OpenAI rate limit exceeded. Please try again in ${retryAfter} seconds.`);
      
      case 400:
        throw new Error(`Invalid request to OpenAI: ${error.message}. Please check your parameters.`);
      
      case 404:
        throw new Error(`OpenAI model not found: ${error.message}. Please check the model name.`);
      
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      
      default:
        throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if the OpenAI API is available and the key is valid
   */
  public async checkAvailability(): Promise<boolean> {
    try {
      logger.debug('Checking OpenAI API availability');
      
      // Make a minimal request to check API availability
      const response = await this.openai.models.list();
      
      // Check if our supported models are available
      const availableModels = response.data.map(model => model.id);
      const hasSupportedModels = this.supportedModels.some(model =>
        availableModels.includes(model)
      );
      
      if (!hasSupportedModels) {
        logger.warn('None of the supported OpenAI models are available', {
          supportedModels: this.supportedModels,
          availableModels: availableModels.filter(m =>
            this.supportedModels.some(sm => m.includes(sm))
          ),
        });
      }
      
      logger.debug('OpenAI API availability check passed');
      return true;
    } catch (error: any) {
      logger.error('OpenAI API availability check failed', {
        error: error.message,
        status: error.status,
      });
      return false;
    }
  }

  /**
   * Get model-specific information and capabilities
   */
  public getModelInfo(model: string): { maxTokens: number; supportsStreaming: boolean } {
    const modelInfo: Record<string, { maxTokens: number; supportsStreaming: boolean }> = {
      'gpt-4': { maxTokens: 8192, supportsStreaming: true },
      'gpt-4-turbo': { maxTokens: 128000, supportsStreaming: true },
      'gpt-3.5-turbo': { maxTokens: 4096, supportsStreaming: true },
    };

    return modelInfo[model] || { maxTokens: 4096, supportsStreaming: true };
  }
}
