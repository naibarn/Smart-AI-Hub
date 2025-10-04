import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ProviderManager } from '../services/provider.manager';
import { LLMProvider } from '../providers/base.provider';
import { LLMRequest, LLMResponse } from '../types/mcp.types';

// Mock Providers
const createMockProvider = (name: string): jest.Mocked<LLMProvider> => ({
  execute: jest.fn(),
  estimateTokens: jest.fn(),
  getSupportedModels: jest.fn(),
  calculateCredits: jest.fn(),
});

describe('ProviderManager', () => {
  let manager: ProviderManager;
  let mockOpenAI: jest.Mocked<LLMProvider>;
  let mockClaude: jest.Mocked<LLMProvider>;

  const mockRequest: LLMRequest = {
    model: 'test-model',
    messages: [{ role: 'user', content: 'Hello' }],
    type: 'chat',
    stream: false,
  };

  const mockResponse: LLMResponse = {
    content: 'mock response',
    usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    model: 'test-model',
    finishReason: 'stop',
  };

  beforeEach(() => {
    mockOpenAI = createMockProvider('openai');
    mockClaude = createMockProvider('claude');
    manager = new ProviderManager([
      { name: 'openai', instance: mockOpenAI },
      { name: 'claude', instance: mockClaude },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should handle a request with a specific provider', async () => {
    mockOpenAI.execute.mockResolvedValue(mockResponse);
    const request = { ...mockRequest, provider: 'openai' } as LLMRequest;
    const result = await manager.handleRequest(request);
    expect(result).toEqual(mockResponse);
    expect(mockOpenAI.execute).toHaveBeenCalledWith(request);
    expect(mockClaude.execute).not.toHaveBeenCalled();
  });

  it('should use auto mode and select the primary provider (openai)', async () => {
    mockOpenAI.execute.mockResolvedValue(mockResponse);
    const request = { ...mockRequest, provider: 'auto' } as LLMRequest;
    const result = await manager.handleRequest(request);
    expect(result).toEqual(mockResponse);
    expect(mockOpenAI.execute).toHaveBeenCalledWith(request);
    expect(mockClaude.execute).not.toHaveBeenCalled();
  });

  it('should fall back to the secondary provider (claude) if the primary fails', async () => {
    mockOpenAI.execute.mockRejectedValue(new Error('OpenAI failed'));
    mockClaude.execute.mockResolvedValue(mockResponse);
    const request = { ...mockRequest, provider: 'auto' } as LLMRequest;
    const result = await manager.handleRequest(request);
    expect(result).toEqual(mockResponse);
    expect(mockOpenAI.execute).toHaveBeenCalledWith(request);
    expect(mockClaude.execute).toHaveBeenCalledWith(request);
  });

  it('should throw an error if all providers fail', async () => {
    mockOpenAI.execute.mockRejectedValue(new Error('OpenAI failed'));
    mockClaude.execute.mockRejectedValue(new Error('Claude failed'));
    const request = { ...mockRequest, provider: 'auto' } as LLMRequest;
    await expect(manager.handleRequest(request)).rejects.toThrow('All providers are currently unavailable.');
  });

  it('should open the circuit for a provider after repeated failures', async () => {
    jest.useFakeTimers();
    mockOpenAI.execute.mockRejectedValue(new Error('OpenAI failed'));
    const request = { ...mockRequest, provider: 'openai' } as LLMRequest;

    // Fail 5 times to meet the volumeThreshold and open the circuit
    for (let i = 0; i < 5; i++) {
      await expect(manager.handleRequest(request)).rejects.toThrow('OpenAI failed');
    }

    // The 6th call should be rejected immediately because the breaker is open
    await expect(manager.handleRequest(request)).rejects.toThrow('Breaker is open');
    
    // The mock should have been called only 5 times, not 6
    expect(mockOpenAI.execute).toHaveBeenCalledTimes(5);
  });
  it('should allow requests again after the circuit breaker reset timeout', async () => {
    jest.useFakeTimers();
    mockOpenAI.execute.mockRejectedValue(new Error('OpenAI failed'));
    const request = { ...mockRequest, provider: 'openai' } as LLMRequest;

    // Fail 5 times to open the circuit
    for (let i = 0; i < 5; i++) {
      await expect(manager.handleRequest(request)).rejects.toThrow('OpenAI failed');
    }
    
    // Allow micro-tasks to run, like the breaker state change
    await jest.advanceTimersByTimeAsync(1);

    // The 6th call should be rejected immediately
    await expect(manager.handleRequest(request)).rejects.toThrow('Breaker is open');
    expect(mockOpenAI.execute).toHaveBeenCalledTimes(5);

    // Fast-forward time by 30 seconds to allow the circuit to half-open
    await jest.advanceTimersByTimeAsync(30000);

    // The next call should be allowed (half-open state)
    mockOpenAI.execute.mockResolvedValue(mockResponse);
    const result = await manager.handleRequest(request);
    expect(result).toEqual(mockResponse);
    expect(mockOpenAI.execute).toHaveBeenCalledTimes(6);

    // The circuit should now be closed, and subsequent calls should succeed
    await manager.handleRequest(request);
    expect(mockOpenAI.execute).toHaveBeenCalledTimes(7);
  });
  
  it('should get the status of the providers', () => {
    const status = manager.getStatus();
    expect(status).toEqual({
        "claude": "healthy",
        "openai": "healthy",
      });
  });
});