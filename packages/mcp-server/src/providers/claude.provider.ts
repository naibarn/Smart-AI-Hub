import Anthropic from '@anthropic-ai/sdk';
import { LLMRequest, LLMResponse } from '../types/mcp.types';
import { BaseLLMProvider } from './base.provider';
import { logger } from '../utils/logger';

export class ClaudeProvider extends BaseLLMProvider {
  private anthropic: Anthropic;
  private supportedModels: string[] = [
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
  ];

  constructor(apiKey: string) {
    super();
    this.anthropic = new Anthropic({ apiKey });
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
      const systemMessages = request.messages.filter(msg => msg.role === 'system');
      const system = systemMessages.length > 0 ? systemMessages.map(msg => msg.content).join('\n') : undefined;
      
      const messages = request.messages.filter(msg => msg.role !== 'system') as Anthropic.Messages.MessageParam[];

      const stream = await this.anthropic.messages.create({
        model: request.model,
        messages: messages,
        system: system,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature,
        top_p: request.topP,
        stop_sequences: request.stop,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            content: chunk.delta.text,
            model: request.model,
            finishReason: '',
            usage: undefined,
          };
        } else if (chunk.type === 'message_delta') {
          yield {
            content: '',
            model: request.model,
            finishReason: chunk.delta.stop_reason || '',
            usage: {
              promptTokens: 0, // Prompt tokens are not available in the delta
              completionTokens: chunk.usage.output_tokens,
              totalTokens: chunk.usage.output_tokens,
            }
          }
        }
      }
    } catch (error: any) {
      logger.error('Error executing Claude streaming request:', error);
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  private async executeNonStreaming(request: LLMRequest): Promise<LLMResponse> {
    try {
      const systemMessages = request.messages.filter(msg => msg.role === 'system');
      const system = systemMessages.length > 0 ? systemMessages.map(msg => msg.content).join('\n') : undefined;
      
      const messages = request.messages.filter(msg => msg.role !== 'system') as Anthropic.Messages.MessageParam[];

      const completion = await this.anthropic.messages.create({
        model: request.model,
        messages: messages,
        system: system,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature,
        top_p: request.topP,
        stop_sequences: request.stop,
      });

      const { usage, content, model, stop_reason } = completion;
      const responseContent = content
        .map(c => ('text' in c ? c.text : ''))
        .join('')
        .trim();

      return {
        content: responseContent,
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
        },
        model,
        finishReason: stop_reason || '',
      };
    } catch (error: any) {
      logger.error('Error executing Claude non-streaming request:', error);
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  calculateCredits(model: string, tokens: number): number {
    // 8 credits per 1000 tokens for all Claude-3 models
    const rate = 8;
    return (tokens / 1000) * rate;
  }
}