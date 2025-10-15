import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ClaudeProvider } from '../providers/claude.provider';
import { LLMRequest } from '../types/mcp.types';
import Anthropic from '@anthropic-ai/sdk';

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => {
  const mMessages = {
    create: jest.fn(),
  };
  return jest.fn(() => ({
    messages: mMessages,
  }));
});

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;
  let mockedAnthropic: jest.Mocked<Anthropic>;

  beforeEach(() => {
    provider = new ClaudeProvider('test-api-key');
    mockedAnthropic = new (Anthropic as any)();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize correctly', () => {
    expect(provider).toBeInstanceOf(ClaudeProvider);
    expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
  });

  it('should return supported models', () => {
    const models = provider.getSupportedModels();
    expect(models).toEqual(['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']);
  });

  it('should estimate tokens correctly', () => {
    const text = 'This is a test string for token estimation.';
    const estimatedTokens = provider.estimateTokens(text);
    expect(estimatedTokens).toBe(Math.ceil(text.length / 4));
  });

  it('should calculate credits correctly for all claude models', () => {
    const credits = provider.calculateCredits('claude-3-opus', 1000);
    expect(credits).toBe(8);
    const credits2 = provider.calculateCredits('claude-3-sonnet', 1000);
    expect(credits2).toBe(8);
  });

  it('should execute a non-streaming request successfully', async () => {
    const mockRequest: LLMRequest = {
      model: 'claude-3-opus',
      messages: [{ role: 'user', content: 'Hello' }],
      type: 'chat',
      stream: false,
    };

    const mockResponse = {
      id: 'msg_0123',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello there!' }],
      model: 'claude-3-opus',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    };

    (mockedAnthropic.messages.create as any).mockResolvedValue(mockResponse);

    const result = await provider.execute(mockRequest);

    expect(result).toEqual({
      content: 'Hello there!',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      model: 'claude-3-opus',
      finishReason: 'end_turn',
    });

    expect(mockedAnthropic.messages.create).toHaveBeenCalledWith({
      model: 'claude-3-opus',
      messages: [{ role: 'user', content: 'Hello' }],
      system: undefined,
      max_tokens: 4096,
      temperature: undefined,
      top_p: undefined,
      stop_sequences: undefined,
    });
  });

  it('should throw an error if the Anthropic API call fails', async () => {
    const mockRequest: LLMRequest = {
      model: 'claude-3-opus',
      messages: [{ role: 'user', content: 'Hello' }],
      type: 'chat',
      stream: false,
    };

    const apiError = new Error('API Error');
    (mockedAnthropic.messages.create as any).mockRejectedValue(apiError);

    await expect(provider.execute(mockRequest)).rejects.toThrow('Claude API error: API Error');
  });

  it('should execute a streaming request successfully', async () => {
    const mockRequest: LLMRequest = {
      model: 'claude-3-opus',
      messages: [{ role: 'user', content: 'Hello' }],
      type: 'chat',
      stream: true,
    };

    // Mock streaming response
    const mockStreamChunks = [
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
      { type: 'content_block_delta', delta: { type: 'text_delta', text: ' there!' } },
      { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 5 } },
    ];

    const mockAsyncIterable = {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of mockStreamChunks) {
          yield chunk;
        }
      },
    };

    (mockedAnthropic.messages.create as any).mockResolvedValue(mockAsyncIterable);

    const result = await provider.execute(mockRequest);
    const chunks = [];

    for await (const chunk of result as AsyncIterable<any>) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual({
      content: 'Hello',
      model: 'claude-3-opus',
      finishReason: '',
      usage: undefined,
    });
    expect(chunks[1]).toEqual({
      content: ' there!',
      model: 'claude-3-opus',
      finishReason: '',
      usage: undefined,
    });
    expect(chunks[2]).toEqual({
      content: '',
      model: 'claude-3-opus',
      finishReason: 'end_turn',
      usage: {
        promptTokens: 0,
        completionTokens: 5,
        totalTokens: 5,
      },
    });
  });

  it('should handle system messages correctly', async () => {
    const mockRequest: LLMRequest = {
      model: 'claude-3-opus',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
      ],
      type: 'chat',
      stream: false,
    };

    const mockResponse = {
      id: 'msg_0123',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello! How can I help?' }],
      model: 'claude-3-opus',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 15,
        output_tokens: 8,
      },
    };

    (mockedAnthropic.messages.create as any).mockResolvedValue(mockResponse);

    const result = await provider.execute(mockRequest);

    expect(mockedAnthropic.messages.create).toHaveBeenCalledWith({
      model: 'claude-3-opus',
      messages: [{ role: 'user', content: 'Hello' }],
      system: 'You are a helpful assistant.',
      max_tokens: 4096,
      temperature: undefined,
      top_p: undefined,
      stop_sequences: undefined,
    });

    expect((result as any).content).toBe('Hello! How can I help?');
  });
});
