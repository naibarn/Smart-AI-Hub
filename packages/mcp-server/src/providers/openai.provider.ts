import OpenAI from 'openai';
import { LLMRequest, LLMResponse } from '../types/mcp.types';
import { BaseLLMProvider } from './base.provider';
import { logger } from '../utils/logger';

export class OpenAIProvider extends BaseLLMProvider {
  private openai: OpenAI;
  private supportedModels: string[] = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

  constructor(apiKey: string) {
    super();
    this.openai = new OpenAI({ apiKey });
  }

  getSupportedModels(): string[] {
    return this.supportedModels;
  }

  async execute(request: LLMRequest): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    if (request.stream) {
      return this.executeStreaming(request);
    }
    return this.executeNonStreaming(request);
  }

  private async *executeStreaming(request: LLMRequest): AsyncIterable<LLMResponse> {
    try {
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

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const finishReason = chunk.choices[0]?.finish_reason || '';
        yield {
          content,
          model: request.model, // Or chunk.model
          finishReason,
          usage: undefined,
        };
      }
    } catch (error: any) {
      logger.error('Error executing OpenAI streaming request:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  private async executeNonStreaming(request: LLMRequest): Promise<LLMResponse> {
    try {
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
        throw new Error('Invalid OpenAI response');
      }

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
      logger.error('Error executing OpenAI non-streaming request:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}