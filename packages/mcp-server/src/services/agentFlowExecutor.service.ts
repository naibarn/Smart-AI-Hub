import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  AgentFlowRequest,
  AgentFlowDefinition,
  AgentFlowStep,
  AgentFlowExecution,
  MCPResponse,
  TokenUsage,
} from '../types/mcp.types';
import { OpenAIProvider } from '../providers/openai.provider';
import { creditService } from './credit.service';

const prisma = new PrismaClient();

export class AgentFlowExecutor {
  private openAIProvider: OpenAIProvider;
  private executions: Map<string, AgentFlowExecution> = new Map();

  constructor(openAIProvider: OpenAIProvider) {
    this.openAIProvider = openAIProvider;
  }

  /**
   * Parse and validate flow definition
   */
  parseFlowDefinition(flowDefinition: any): AgentFlowDefinition {
    if (!flowDefinition || typeof flowDefinition !== 'object') {
      throw new Error('Invalid flow definition: must be an object');
    }

    if (!Array.isArray(flowDefinition.steps) || flowDefinition.steps.length === 0) {
      throw new Error('Invalid flow definition: steps must be a non-empty array');
    }

    const steps: AgentFlowStep[] = flowDefinition.steps.map((step: any, index: number) => {
      if (!step.id || typeof step.id !== 'string') {
        throw new Error(`Invalid step at index ${index}: id is required and must be a string`);
      }

      if (!step.type || typeof step.type !== 'string') {
        throw new Error(`Invalid step ${step.id}: type is required and must be a string`);
      }

      const validTypes = ['llm_call', 'condition', 'loop', 'parallel', 'function_call'];
      if (!validTypes.includes(step.type)) {
        throw new Error(`Invalid step ${step.id}: type must be one of ${validTypes.join(', ')}`);
      }

      if (!step.config || typeof step.config !== 'object') {
        throw new Error(`Invalid step ${step.id}: config is required and must be an object`);
      }

      return {
        id: step.id,
        type: step.type,
        config: step.config,
        next: step.next,
        condition: step.condition,
      };
    });

    return {
      steps,
      variables: flowDefinition.variables || {},
    };
  }

  /**
   * Validate input against agent's input schema
   */
  async validateInput(agentId: string, input: Record<string, any>): Promise<void> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { inputSchema: true },
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.inputSchema) {
      // Basic JSON schema validation
      const schema = agent.inputSchema;
      const required = schema.required || [];

      for (const field of required) {
        if (!(field in input)) {
          throw new Error(`Required field missing: ${field}`);
        }
      }

      // Validate field types
      if (schema.properties) {
        for (const [field, fieldSchema] of Object.entries(schema.properties)) {
          if (field in input) {
            const value = input[field];
            const expectedType = (fieldSchema as any).type;

            if (expectedType && typeof value !== expectedType) {
              throw new Error(
                `Field ${field} must be of type ${expectedType}, got ${typeof value}`
              );
            }
          }
        }
      }
    }
  }

  /**
   * Execute agent flow
   */
  async executeFlow(
    agentId: string,
    userId: string,
    input: Record<string, any>,
    stream: boolean = false,
    timeout: number = 300000 // 5 minutes default
  ): Promise<AsyncIterable<MCPResponse> | MCPResponse> {
    // Get agent details
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        approvalLogs: {
          where: { action: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.status !== 'APPROVED') {
      throw new Error(`Agent is not approved. Current status: ${agent.status}`);
    }

    if (agent.approvalLogs.length === 0) {
      throw new Error(`Agent has no approval records`);
    }

    // Validate input
    await this.validateInput(agentId, input);

    // Parse flow definition
    const flowDefinition = this.parseFlowDefinition(agent.flowDefinition);

    // Create execution record
    const execution: AgentFlowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      userId,
      input,
      status: 'running',
      startTime: new Date(),
    };

    this.executions.set(execution.id, execution);

    try {
      // Execute the flow
      const result = await this.runFlow(execution, flowDefinition, stream, timeout);

      // Update execution status
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.output = result.output;
      execution.tokensUsed = result.tokensUsed;
      execution.costInCredits = result.costInCredits;

      // Log usage
      await this.logUsage(execution);

      if (stream) {
        return this.createStreamResponse(execution, result);
      } else {
        return this.createResponse(execution, result);
      }
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = error instanceof Error ? error.message : String(error);

      // Log usage for failed execution
      await this.logUsage(execution);

      throw error;
    } finally {
      // Clean up execution after some time
      setTimeout(() => {
        this.executions.delete(execution.id);
      }, 60000); // Keep for 1 minute
    }
  }

  /**
   * Run the actual flow logic
   */
  private async runFlow(
    execution: AgentFlowExecution,
    flowDefinition: AgentFlowDefinition,
    stream: boolean,
    timeout: number
  ): Promise<{
    output: Record<string, any>;
    tokensUsed: number;
    costInCredits: number;
  }> {
    const startTime = Date.now();
    let totalTokensUsed = 0;
    let totalCostInCredits = 0;
    const context = { ...flowDefinition.variables, ...execution.input };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Flow execution timeout')), timeout);
    });

    const executeSteps = async () => {
      const currentSteps = [flowDefinition.steps[0]]; // Start with first step
      const executedSteps = new Set<string>();

      while (currentSteps.length > 0) {
        const step = currentSteps.shift()!;

        if (executedSteps.has(step.id)) {
          throw new Error(`Circular reference detected: step ${step.id} already executed`);
        }

        executedSteps.add(step.id);

        const stepResult = await this.executeStep(step, context, stream);

        // Update context with step results
        Object.assign(context, stepResult.output);

        // Track token usage and cost
        if (stepResult.tokensUsed) {
          totalTokensUsed += stepResult.tokensUsed;
        }
        if (stepResult.costInCredits) {
          totalCostInCredits += stepResult.costInCredits;
        }

        // Determine next steps
        if (step.next) {
          if (Array.isArray(step.next)) {
            const nextSteps = step.next
              .map((nextId) => flowDefinition.steps.find((s) => s.id === nextId))
              .filter((step): step is AgentFlowStep => step !== undefined);
            currentSteps.push(...nextSteps);
          } else {
            const nextStep = flowDefinition.steps.find((s) => s.id === step.next);
            if (nextStep) {
              currentSteps.push(nextStep);
            }
          }
        } else if (flowDefinition.steps.indexOf(step) < flowDefinition.steps.length - 1) {
          // Default to next step in sequence
          const nextIndex = flowDefinition.steps.indexOf(step) + 1;
          currentSteps.push(flowDefinition.steps[nextIndex]);
        }
      }
    };

    await Promise.race([executeSteps(), timeoutPromise]);

    const duration = Date.now() - startTime;
    if (duration > timeout) {
      throw new Error('Flow execution timeout');
    }

    return {
      output: context,
      tokensUsed: totalTokensUsed,
      costInCredits: totalCostInCredits,
    };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: AgentFlowStep,
    context: Record<string, any>,
    stream: boolean
  ): Promise<{
    output: Record<string, any>;
    tokensUsed?: number;
    costInCredits?: number;
  }> {
    switch (step.type) {
      case 'llm_call':
        return this.executeLLMCall(step, context, stream);

      case 'condition':
        return this.executeCondition(step, context);

      case 'loop':
        return this.executeLoop(step, context, stream);

      case 'parallel':
        return this.executeParallel(step, context, stream);

      case 'function_call':
        return this.executeFunctionCall(step, context);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute LLM call step
   */
  private async executeLLMCall(
    step: AgentFlowStep,
    context: Record<string, any>,
    stream: boolean
  ): Promise<{
    output: Record<string, any>;
    tokensUsed?: number;
    costInCredits?: number;
  }> {
    const config = step.config;
    const prompt = this.interpolateTemplate(config.prompt, context);

    const messages = [
      { role: 'system' as const, content: config.system || '' },
      { role: 'user' as const, content: prompt },
    ];

    const llmRequest = {
      type: 'chat' as const,
      provider: 'openai' as const,
      model: config.model || 'gpt-3.5-turbo',
      messages,
      stream: false, // We'll handle streaming separately
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      stop: config.stop,
    };

    const response = await this.openAIProvider.execute(llmRequest);

    if ('content' in response) {
      // Non-streaming response
      const output = { [step.id]: response.content };
      const tokensUsed = response.usage?.totalTokens || 0;
      const costInCredits = creditService.calculateCredits(response.model, tokensUsed);

      return { output, tokensUsed, costInCredits };
    } else {
      // Streaming response - collect all chunks
      let fullContent = '';
      let totalTokens = 0;

      for await (const chunk of response) {
        fullContent += chunk.content;
        if (chunk.usage?.totalTokens) {
          totalTokens = chunk.usage.totalTokens;
        }
      }

      const output = { [step.id]: fullContent };
      const costInCredits = creditService.calculateCredits(llmRequest.model, totalTokens);

      return { output, tokensUsed: totalTokens, costInCredits };
    }
  }

  /**
   * Execute condition step
   */
  private async executeCondition(
    step: AgentFlowStep,
    context: Record<string, any>
  ): Promise<{ output: Record<string, any> }> {
    const condition = this.interpolateTemplate(step.condition!, context);

    // Simple condition evaluation - in production, use a safer expression evaluator
    try {
      const result = Function('"use strict"; return (' + condition + ')')();
      return { output: { [step.id]: result } };
    } catch (error) {
      throw new Error(`Failed to evaluate condition: ${condition}. Error: ${error}`);
    }
  }

  /**
   * Execute loop step
   */
  private async executeLoop(
    step: AgentFlowStep,
    context: Record<string, any>,
    stream: boolean
  ): Promise<{ output: Record<string, any> }> {
    const config = step.config;
    const iterations = config.iterations || 1;
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const loopContext = { ...context, iteration: i };

      if (config.steps) {
        for (const loopStep of config.steps) {
          const stepResult = await this.executeStep(loopStep, loopContext, stream);
          Object.assign(loopContext, stepResult.output);
        }
      }

      results.push({ ...loopContext });
    }

    return { output: { [step.id]: results } };
  }

  /**
   * Execute parallel step
   */
  private async executeParallel(
    step: AgentFlowStep,
    context: Record<string, any>,
    stream: boolean
  ): Promise<{ output: Record<string, any> }> {
    const config = step.config;
    const promises = [];

    if (config.steps) {
      for (const parallelStep of config.steps) {
        promises.push(this.executeStep(parallelStep, { ...context }, stream));
      }
    }

    const results = await Promise.all(promises);
    const output = { [step.id]: results.map((r) => r.output) };

    return { output };
  }

  /**
   * Execute function call step
   */
  private async executeFunctionCall(
    step: AgentFlowStep,
    context: Record<string, any>
  ): Promise<{ output: Record<string, any> }> {
    const config = step.config;
    const functionName = config.function;
    const args = config.args
      ? this.interpolateTemplate(JSON.stringify(config.args), context)
      : '{}';

    // In production, implement a secure function registry
    // For now, we'll support basic utility functions
    const functions: Record<string, (...args: any[]) => any> = {
      'text.length': (text: string) => text.length,
      'text.upper': (text: string) => text.toUpperCase(),
      'text.lower': (text: string) => text.toLowerCase(),
      'math.add': (a: number, b: number) => a + b,
      'math.multiply': (a: number, b: number) => a * b,
      'math.divide': (a: number, b: number) => a / b,
      'math.subtract': (a: number, b: number) => a - b,
    };

    if (!functions[functionName]) {
      throw new Error(`Unknown function: ${functionName}`);
    }

    try {
      const parsedArgs = JSON.parse(args);
      const result = functions[functionName](...parsedArgs);
      return { output: { [step.id]: result } };
    } catch (error) {
      throw new Error(`Failed to execute function ${functionName}: ${error}`);
    }
  }

  /**
   * Handle streaming response
   */
  async handleStreaming(execution: AgentFlowExecution): Promise<AsyncIterable<MCPResponse>> {
    // This would be implemented for real-time streaming
    // For now, return a simple async iterable
    return {
      async *[Symbol.asyncIterator]() {
        yield {
          id: execution.id,
          type: 'chunk' as const,
          data: JSON.stringify({ status: 'processing', step: 'initializing' }),
          timestamp: new Date().toISOString(),
        };

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 100));

        yield {
          id: execution.id,
          type: 'chunk' as const,
          data: JSON.stringify({ status: 'processing', step: 'executing' }),
          timestamp: new Date().toISOString(),
        };

        await new Promise((resolve) => setTimeout(resolve, 100));

        yield {
          id: execution.id,
          type: 'done' as const,
          data: JSON.stringify(execution.output),
          timestamp: new Date().toISOString(),
        };
      },
    };
  }

  /**
   * Create streaming response
   */
  private async createStreamResponse(
    execution: AgentFlowExecution,
    result: any
  ): Promise<AsyncIterable<MCPResponse>> {
    return this.handleStreaming(execution);
  }

  /**
   * Create regular response
   */
  private createResponse(execution: AgentFlowExecution, result: any): MCPResponse {
    return {
      id: execution.id,
      type: 'done',
      data: JSON.stringify(result.output),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Log usage to database
   */
  private async logUsage(execution: AgentFlowExecution): Promise<void> {
    try {
      await prisma.agentUsageLog.create({
        data: {
          agentId: execution.agentId,
          userId: execution.userId,
          inputData: execution.input,
          outputData: execution.output,
          tokensUsed: execution.tokensUsed || 0,
          costInCredits: execution.costInCredits || 0,
          executionTime: execution.endTime
            ? execution.endTime.getTime() - execution.startTime.getTime()
            : 0,
          status: execution.status,
          errorMessage: execution.error,
          createdAt: execution.startTime,
        },
      });
    } catch (error) {
      logger.error('Failed to log agent usage:', error);
    }
  }

  /**
   * Interpolate template variables
   */
  private interpolateTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(context, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): AgentFlowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.error = 'Execution cancelled';
      return true;
    }
    return false;
  }
}
