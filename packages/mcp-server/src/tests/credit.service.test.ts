import axios from 'axios';
import { CreditService } from '../services/credit.service';
import { MCPRequest } from '../types/mcp.types';
import { config } from '../config/config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CreditService', () => {
  let creditService: CreditService;
  let mockRequest: MCPRequest;

  beforeEach(() => {
    creditService = new CreditService();
    mockRequest = {
      id: 'test-request',
      type: 'chat',
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'This is a test prompt.' }],
      stream: false,
    };
    // Reset mocks before each test
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
  });

  describe('estimateCredits', () => {
    it('should estimate credits correctly for gpt-4', () => {
      const estimation = creditService.estimateCredits(mockRequest);
      const promptTokens = Math.ceil(mockRequest.messages[0].content.length / 4);
      const completionTokens = Math.ceil(promptTokens * 0.75);
      const totalTokens = promptTokens + completionTokens;
      const expectedCredits = Math.ceil(totalTokens * (config.MODEL_PRICING['gpt-4'] / 1000) * 1000);
      expect(estimation.estimatedCredits).toBe(expectedCredits);
    });

    it('should estimate credits correctly for gpt-3.5', () => {
      mockRequest.model = 'gpt-3.5-turbo';
      const estimation = creditService.estimateCredits(mockRequest);
      const promptTokens = Math.ceil(mockRequest.messages[0].content.length / 4);
      const completionTokens = Math.ceil(promptTokens * 0.5);
      const totalTokens = promptTokens + completionTokens;
      const expectedCredits = Math.ceil(totalTokens * (config.MODEL_PRICING['gpt-3.5-turbo'] / 1000) * 1000);
      expect(estimation.estimatedCredits).toBe(expectedCredits);
    });

    it('should estimate credits correctly for claude-3', () => {
      mockRequest.model = 'claude-3-sonnet';
      const estimation = creditService.estimateCredits(mockRequest);
      const promptTokens = Math.ceil(mockRequest.messages[0].content.length / 4);
      const completionTokens = Math.ceil(promptTokens * 0.8);
      const totalTokens = promptTokens + completionTokens;
      const expectedCredits = Math.ceil(totalTokens * (config.MODEL_PRICING['claude-3-sonnet'] / 1000) * 1000);
      expect(estimation.estimatedCredits).toBe(expectedCredits);
    });

    it('should respect maxTokens in estimation', () => {
      mockRequest.maxTokens = 5;
      const estimation = creditService.estimateCredits(mockRequest);
      const promptTokens = Math.ceil(mockRequest.messages[0].content.length / 4);
      const totalTokens = promptTokens + 5; // prompt + maxTokens
      const expectedCredits = Math.ceil(totalTokens * (config.MODEL_PRICING['gpt-4'] / 1000) * 1000);
      expect(estimation.estimatedCredits).toBe(expectedCredits);
    });
  });

  describe('checkSufficientCredits', () => {
    it('should return true for sufficient balance', async () => {
      mockedAxios.get.mockResolvedValue({ data: { data: { balance: 100 } } });
      const hasSufficient = await creditService.checkSufficientCredits('user-123', mockRequest);
      expect(hasSufficient).toBe(true);
    });

    it('should return false for insufficient balance', async () => {
      mockedAxios.get.mockResolvedValue({ data: { data: { balance: 0 } } });
      const hasSufficient = await creditService.checkSufficientCredits('user-123', mockRequest);
      expect(hasSufficient).toBe(false);
    });

    it('should return false if balance is zero', async () => {
      mockedAxios.get.mockResolvedValue({ data: { data: { balance: 0 } } });
      const hasSufficient = await creditService.checkSufficientCredits('user-123', mockRequest);
      expect(hasSufficient).toBe(false);
    });

    it('should return false on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      const hasSufficient = await creditService.checkSufficientCredits('user-123', mockRequest);
      expect(hasSufficient).toBe(false);
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: { data: { account: { balance: 90 } } } });
      const deducted = await creditService.deductCredits('user-123', 'req-1', 1000, 'gpt-4');
      expect(deducted).toBe(30); // 1000 * (0.03 / 1000) * 1000
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${config.CREDIT_SERVICE_URL}/api/credits/use`,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should throw an error if deduction fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Deduction failed'));
      await expect(creditService.deductCredits('user-123', 'req-1', 1000, 'gpt-4')).rejects.toThrow(
        'Failed to deduct credits'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle 404 response from credit service', async () => {
      mockedAxios.get.mockResolvedValue({ status: 404, data: {} });
      const hasSufficient = await creditService.checkSufficientCredits('user-123', mockRequest);
      expect(hasSufficient).toBe(false);
    });

    it('should handle zero tokens in estimateCredits', () => {
      mockRequest.messages = [{ role: 'user', content: '' }];
      const estimation = creditService.estimateCredits(mockRequest);
      expect(estimation.estimatedCredits).toBe(0);
    });
  });

  describe('validateRequest', () => {
    it('should return valid for a correct request', () => {
      const result = creditService.validateRequest(mockRequest);
      expect(result.valid).toBe(true);
    });

    it('should return invalid for an unsupported model', () => {
      mockRequest.model = 'unsupported-model';
      const result = creditService.validateRequest(mockRequest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported model');
    });

    it('should return invalid for exceeding maxTokens', () => {
      mockRequest.maxTokens = config.MAX_TOKENS_REQUEST + 1;
      const result = creditService.validateRequest(mockRequest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maxTokens exceeds limit');
    });

    it('should return invalid for temperature out of range', () => {
      mockRequest.temperature = config.MAX_TEMPERATURE + 0.1;
      let result = creditService.validateRequest(mockRequest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Temperature must be between');

      mockRequest.temperature = config.MIN_TEMPERATURE - 0.1;
      result = creditService.validateRequest(mockRequest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Temperature must be between');
    });

    it('should return invalid for too many messages', () => {
      mockRequest.messages = new Array(config.MAX_MESSAGES_IN_CONTEXT + 1).fill({ role: 'user', content: 'a' });
      const result = creditService.validateRequest(mockRequest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Too many messages');
    });

    it('should return invalid for messages without content', () => {
      mockRequest.messages = [{ role: 'user', content: '' }];
      const result = creditService.validateRequest(mockRequest);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('All messages must have valid content');
    });
  });

  describe('hasAnyCredits', () => {
    it('should return true if balance is greater than 0', async () => {
      mockedAxios.get.mockResolvedValue({ data: { data: { balance: 1 } } });
      const result = await creditService.hasAnyCredits('user-123');
      expect(result).toBe(true);
    });

    it('should return false if balance is 0', async () => {
      mockedAxios.get.mockResolvedValue({ data: { data: { balance: 0 } } });
      const result = await creditService.hasAnyCredits('user-123');
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      const result = await creditService.hasAnyCredits('user-123');
      expect(result).toBe(false);
    });
  });

  describe('getMinimumCreditsRequired', () => {
    it('should return the minimum credits required from config', () => {
      const minCredits = creditService.getMinimumCreditsRequired();
      expect(minCredits).toBe(config.MIN_CREDITS_REQUIRED);
    });
  });

  describe('getModelPricing', () => {
    it('should return the model pricing from config', () => {
      const pricing = creditService.getModelPricing();
      expect(pricing).toEqual(config.MODEL_PRICING);
    });
  });
});