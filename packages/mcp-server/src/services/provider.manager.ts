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
    this.providers = new Map(providers.map(p => [p.name, p.instance]));
    this.circuitBreakers = new Map();

    this.providers.forEach((_, name) => {
      this.providerStatus.set(name, 'healthy');
      const breaker = new CircuitBreaker(
        (req: LLMRequest) => this.executeWithProvider(name, req),
        {
          timeout: 15000, // 15 seconds
          errorThresholdPercentage: 50,
          resetTimeout: 30000, // 30 seconds
          volumeThreshold: 5, // Minimum number of requests before the breaker can open
        }
      );

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

  public async handleRequest(request: LLMRequest): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
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

  private async handleAutoMode(request: LLMRequest): Promise<LLMResponse | AsyncIterable<LLMResponse>> {
    const primaryProvider: ProviderName = 'openai';
    const fallbackProvider: ProviderName = 'claude';

    try {
      if (this.providerStatus.get(primaryProvider) === 'healthy') {
        const breaker = this.circuitBreakers.get(primaryProvider);
        if (breaker) {
          return await breaker.fire(request);
        }
      }
      throw new Error('Primary provider unhealthy or unavailable.');
    } catch (error) {
      logger.warn(
        `Primary provider ${primaryProvider} failed. Attempting fallback to ${fallbackProvider}.`,
        error
      );

      try {
        if (this.providerStatus.get(fallbackProvider) === 'healthy') {
          const breaker = this.circuitBreakers.get(fallbackProvider);
          if (breaker) {
            return await breaker.fire(request);
          }
        }
        throw new Error('Fallback provider unhealthy or unavailable.');
      } catch (fallbackError) {
        logger.error(
          `Fallback provider ${fallbackProvider} also failed.`,
          fallbackError
        );
        throw new Error('All providers are currently unavailable.');
      }
    }
  }

  public getStatus() {
    return Object.fromEntries(this.providerStatus);
  }
}