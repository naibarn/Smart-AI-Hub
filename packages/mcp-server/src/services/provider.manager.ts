import CircuitBreaker from 'opossum';
import { LLMRequest, LLMResponse } from '../types/mcp.types';
import { LLMProvider } from '../providers/base.provider';
import { logger } from '../utils/logger';

type ProviderName = 'openai' | 'claude' | 'auto';

export class ProviderManager {
  private providers: Map<ProviderName, LLMProvider>;
  private circuitBreakers: Map<ProviderName, any>;
  private providerStatus: Map<ProviderName, 'healthy' | 'unhealthy'> = new Map();

  constructor(providers: { name: ProviderName; instance: LLMProvider }[]) {
    this.providers = new Map(providers.map((p) => [p.name, p.instance]));
    this.circuitBreakers = new Map();

    this.providers.forEach((_, name) => {
      this.providerStatus.set(name, 'healthy');
      const breaker = new CircuitBreaker((req: LLMRequest) => this.executeWithProvider(name, req), {
        timeout: 15000, // 15 seconds
        errorThresholdPercentage: 50,
        resetTimeout: 30000, // 30 seconds
        volumeThreshold: 5, // Minimum number of requests before the breaker can open
      });

      breaker.on('open', () => {
        this.providerStatus.set(name, 'unhealthy');
        logger.warn(`Circuit breaker for ${name} is now open.`);
      });

      breaker.on('close', () => {
        this.providerStatus.set(name, 'healthy');
        logger.info(`Circuit breaker for ${name} is now closed.`);
      });

      this.circuitBreakers.set(name, breaker);
    });
  }

  private async executeWithProvider(
    providerName: ProviderName,
    request: LLMRequest
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found.`);
    }
    return provider.execute(request);
  }

  public async handleRequest(
    request: LLMRequest
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    const providerName = (request.provider || 'auto') as ProviderName;

    if (providerName === 'auto') {
      return this.handleAutoMode(request);
    }

    const breaker = this.circuitBreakers.get(providerName);
    if (!breaker) {
      throw new Error(`Circuit breaker for ${providerName} not found.`);
    }

    return breaker.fire(request);
  }

  private async handleAutoMode(
    request: LLMRequest
  ): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    // Intelligent provider selection based on model
    let preferredProvider: ProviderName;
    let fallbackProvider: ProviderName;

    // Determine preferred provider based on model
    if (request.model.startsWith('claude')) {
      preferredProvider = 'claude';
      fallbackProvider = 'openai';
    } else if (request.model.startsWith('gpt')) {
      preferredProvider = 'openai';
      fallbackProvider = 'claude';
    } else {
      // Default selection for unknown models
      preferredProvider = 'openai';
      fallbackProvider = 'claude';
    }

    logger.info(`Auto mode: Trying ${preferredProvider} first for model ${request.model}`);

    try {
      if (this.providerStatus.get(preferredProvider) === 'healthy') {
        const breaker = this.circuitBreakers.get(preferredProvider);
        if (breaker) {
          return await breaker.fire(request);
        }
      }
      throw new Error(`Preferred provider ${preferredProvider} unhealthy or unavailable.`);
    } catch (error) {
      logger.warn(
        `Preferred provider ${preferredProvider} failed. Attempting fallback to ${fallbackProvider}.`,
        error
      );

      try {
        if (this.providerStatus.get(fallbackProvider) === 'healthy') {
          const breaker = this.circuitBreakers.get(fallbackProvider);
          if (breaker) {
            // For fallback, we might need to adjust the model if it's provider-specific
            const adjustedRequest = this.adjustModelForProvider(request, fallbackProvider);
            return await breaker.fire(adjustedRequest);
          }
        }
        throw new Error(`Fallback provider ${fallbackProvider} unhealthy or unavailable.`);
      } catch (fallbackError) {
        logger.error(
          `Both providers failed. Last attempt with ${fallbackProvider} using default model.`,
          fallbackError
        );

        // Last resort: try fallback provider with default model
        try {
          const breaker = this.circuitBreakers.get(fallbackProvider);
          if (breaker) {
            const lastResortRequest = {
              ...request,
              model: this.getDefaultModelForProvider(fallbackProvider),
            };
            return await breaker.fire(lastResortRequest);
          }
        } catch (lastResortError) {
          logger.error(`All providers failed.`, { lastResortError });
        }

        throw new Error('All providers are currently unavailable.');
      }
    }
  }

  private adjustModelForProvider(request: LLMRequest, provider: ProviderName): LLMRequest {
    // If the requested model is compatible with the provider, use as-is
    if (
      (provider === 'openai' && request.model.startsWith('gpt')) ||
      (provider === 'claude' && request.model.startsWith('claude'))
    ) {
      return request;
    }

    // Otherwise, switch to a default model for the provider
    return {
      ...request,
      model: this.getDefaultModelForProvider(provider),
    };
  }

  private getDefaultModelForProvider(provider: ProviderName): string {
    switch (provider) {
      case 'openai':
        return 'gpt-3.5-turbo';
      case 'claude':
        return 'claude-3-haiku';
      default:
        return 'gpt-3.5-turbo';
    }
  }

  public getStatus() {
    return Object.fromEntries(this.providerStatus);
  }
}
