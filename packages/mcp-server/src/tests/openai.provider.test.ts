import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { OpenAIProvider } from '../providers/openai.provider';
import { LLMRequest } from '../types/mcp.types';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  const mChat = {
    completions: {
      create: jest.fn(),
    },
  };
  return jest.fn(() => ({
    chat: mChat,
  }));
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockedOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    provider = new OpenAIProvider('test-api-key');
    mockedOpenAI = new (OpenAI as any)();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize correctly', () => {
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
  });

  it('should return supported models', () => {
    const models = provider.getSupportedModels();
    expect(models).toEqual(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']);
  });

  it('should estimate tokens correctly', () => {
    const text = 'This is a test string for token estimation.';
    const estimatedTokens = provider.estimateTokens(text);
    expect(estimatedTokens).toBe(Math.ceil(text.length / 4));
  });

  it('should calculate credits correctly for gpt-4', () => {
    const credits = provider.calculateCredits('gpt-4', 1000);
    expect(credits).toBe(10);
  });

  it('should calculate credits correctly for gpt-3.5-turbo', () => {
    const credits = provider.calculateCredits('gpt-3.5-turbo', 1000);
    expect(credits).toBe(1);
  });

  it('should calculate credits correctly for a default model', () => {
    const credits = provider.calculateCredits('some-other-model', 1000);
    expect(credits).toBe(5);
  });

  it('should execute a non-streaming request successfully', async () => {
    const mockRequest: LLMRequest = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      type: 'chat',
    };

    const mockResponse = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1677652288,
      model: 'gpt-3.5-turbo-0613',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello there!',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 9,
        completion_tokens: 12,
        total_tokens: 21,
      },
    };

    (mockedOpenAI.chat.completions.create as jest.Mock<any>).mockResolvedValue(mockResponse);

    const result = await provider.execute(mockRequest);

    expect(result).toEqual({
      content: 'Hello there!',
      usage: {
        promptTokens: 9,
        completionTokens: 12,
        totalTokens: 21,
      },
      model: 'gpt-3.5-turbo-0613',
      finishReason: 'stop',
    });

    expect(mockedOpenAI.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
    });
  });

  it('should throw an error if the OpenAI API call fails', async () => {
    const mockRequest: LLMRequest = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      type: 'chat',
    };

    const apiError = new Error('API Error');
    (mockedOpenAI.chat.completions.create as jest.Mock<any>).mockRejectedValue(apiError);

    await expect(provider.execute(mockRequest)).rejects.toThrow('OpenAI API error: API Error');
  });
});