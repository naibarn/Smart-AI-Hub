import CircuitBreaker from 'opossum';
import { LLMRequest, LLMResponse } from '../types/mcp.types';
import { LLMProvider } from '../providers/base.provider';
import { logger } from '../utils/logger';

type ProviderName = 'openai' | 'claude' | 'auto';

export class ProviderManager {
  private providers: Map<ProviderName, LLMProvider>;
  private circuitBreakers: Map<ProviderName, any>;
  private providerStatus: Map<ProviderName, 'healthy' | 'unhealthy' | 'checking'> = new Map();
  private providerAvailability: Map<ProviderName, boolean> = new Map();
  private lastAvailabilityCheck: Map<ProviderName, number> = new Map();
  private readonly AVAILABILITY_CHECK_INTERVAL = 300000; // 5 minutes

  constructor(providers: { name: ProviderName; instance: LLMProvider }[]) {
    this.providers = new Map(providers.map((p) => [p.name, p.instance]));
    this.circuitBreakers = new Map();

    // Initialize providers and circuit breakers
    this.providers.forEach((_, name) => {
      this.providerStatus.set(name, 'healthy');
      this.providerAvailability.set(name, true);
      this.lastAvailabilityCheck.set(name, 0);
      
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

      breaker.on('halfOpen', () => {
        this.providerStatus.set(name, 'checking');
        logger.info(`Circuit breaker for ${name} is now half-open (testing).`);
      });

      this.circuitBreakers.set(name, breaker);
    });

    // Start periodic availability checks
    this.startAvailabilityChecks();
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

    // Check if provider is available
    if (!await this.isProviderAvailable(providerName)) {
      throw new Error(`Provider ${providerName} is currently unavailable.`);
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
      // Check availability before attempting to use the provider
      if (await this.isProviderAvailable(preferredProvider)) {
        const breaker = this.circuitBreakers.get(preferredProvider);
        if (breaker && this.providerStatus.get(preferredProvider) === 'healthy') {
          return await breaker.fire(request);
        }
      }
      throw new Error(`Preferred provider ${preferredProvider} unhealthy or unavailable.`);
    } catch (error) {
      logger.warn(
        `Preferred provider ${preferredProvider} failed. Attempting fallback to ${fallbackProvider}.`,
        { error: error instanceof Error ? error.message : String(error) }
      );

      try {
        // Check fallback provider availability
        if (await this.isProviderAvailable(fallbackProvider)) {
          const breaker = this.circuitBreakers.get(fallbackProvider);
          if (breaker && this.providerStatus.get(fallbackProvider) === 'healthy') {
            // For fallback, we might need to adjust the model if it's provider-specific
            const adjustedRequest = this.adjustModelForProvider(request, fallbackProvider);
            return await breaker.fire(adjustedRequest);
          }
        }
        throw new Error(`Fallback provider ${fallbackProvider} unhealthy or unavailable.`);
      } catch (fallbackError) {
        logger.error(
          `Both providers failed. Last attempt with ${fallbackProvider} using default model.`,
          { error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) }
        );

        // Last resort: try fallback provider with default model
        try {
          if (await this.isProviderAvailable(fallbackProvider)) {
            const breaker = this.circuitBreakers.get(fallbackProvider);
            if (breaker) {
              const lastResortRequest = {
                ...request,
                model: this.getDefaultModelForProvider(fallbackProvider),
              };
              return await breaker.fire(lastResortRequest);
            }
          }
        } catch (lastResortError) {
          logger.error(`All providers failed.`, {
            error: lastResortError instanceof Error ? lastResortError.message : String(lastResortError)
          });
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

  /**
   * Check if a provider is available (API is reachable and has valid credentials)
   */
  private async isProviderAvailable(providerName: ProviderName): Promise<boolean> {
    const now = Date.now();
    const lastCheck = this.lastAvailabilityCheck.get(providerName) || 0;
    
    // Use cached result if check was done recently
    if (now - lastCheck < this.AVAILABILITY_CHECK_INTERVAL) {
      return this.providerAvailability.get(providerName) || false;
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      return false;
    }

    try {
      // Check if provider has availability check method
      if ('checkAvailability' in provider && typeof provider.checkAvailability === 'function') {
        const isAvailable = await (provider as any).checkAvailability();
        this.providerAvailability.set(providerName, isAvailable);
        this.lastAvailabilityCheck.set(providerName, now);
        
        logger.debug(`Provider ${providerName} availability check: ${isAvailable ? 'available' : 'unavailable'}`);
        
        return isAvailable;
      }
      
      // Default to available if no check method exists
      this.providerAvailability.set(providerName, true);
      this.lastAvailabilityCheck.set(providerName, now);
      return true;
    } catch (error) {
      logger.error(`Error checking availability for provider ${providerName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      
      this.providerAvailability.set(providerName, false);
      this.lastAvailabilityCheck.set(providerName, now);
      return false;
    }
  }

  /**
   * Start periodic availability checks for all providers
   */
  private startAvailabilityChecks(): void {
    // Check availability immediately on startup
    this.checkAllProvidersAvailability();
    
    // Then check periodically
    setInterval(() => {
      this.checkAllProvidersAvailability();
    }, this.AVAILABILITY_CHECK_INTERVAL);
  }

  /**
   * Check availability of all providers
   */
  private async checkAllProvidersAvailability(): Promise<void> {
    const providerNames: ProviderName[] = ['openai', 'claude'];
    
    for (const providerName of providerNames) {
      try {
        await this.isProviderAvailable(providerName);
      } catch (error) {
        logger.error(`Failed to check availability for provider ${providerName}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Force refresh availability check for a specific provider
   */
  public async refreshProviderAvailability(providerName: ProviderName): Promise<boolean> {
    // Clear cached check time to force refresh
    this.lastAvailabilityCheck.set(providerName, 0);
    return await this.isProviderAvailable(providerName);
  }

  /**
   * Get detailed status information for all providers
   */
  public getDetailedStatus() {
    return {
      status: Object.fromEntries(this.providerStatus),
      availability: Object.fromEntries(this.providerAvailability),
      lastCheck: Object.fromEntries(this.lastAvailabilityCheck),
      supportedModels: Object.fromEntries(
        Array.from(this.providers.entries()).map(([name, provider]) => [
          name,
          provider.getSupportedModels(),
        ])
      ),
    };
  }
}
