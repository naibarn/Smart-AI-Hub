/**
 * Usage Logging Service
 * Handles logging of MCP request usage for analytics and billing
 */

import { v4 as uuidv4 } from 'uuid';
import { MCPRequest, MCPResponse, UsageLog, TokenUsage } from '../types/mcp.types';
import { logger, logUsage } from '../utils/logger';
import { config } from '../config/config';

export class LoggingService {
  /**
   * Create a usage log entry
   */
  public createUsageLog(
    userId: string,
    requestId: string,
    request: MCPRequest,
    response: MCPResponse,
    duration: number,
    creditsUsed: number
  ): UsageLog {
    const usageLog: UsageLog = {
      id: uuidv4(),
      userId,
      requestId,
      provider: request.provider || 'auto',
      model: request.model,
      type: request.type,
      usage: response.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      creditsUsed,
      duration,
      timestamp: new Date(),
      success: response.type !== 'error',
      error: response.error?.message,
    };

    return usageLog;
  }

  /**
   * Log usage to console and optionally to external storage
   */
  public async logUsage(usageLog: UsageLog): Promise<void> {
    // Log to structured logger
    logUsage(
      usageLog.userId,
      usageLog.requestId,
      usageLog.provider,
      usageLog.model,
      usageLog.usage.totalTokens,
      usageLog.creditsUsed,
      usageLog.duration
    );

    // In production, you would also:
    // 1. Store in database for analytics
    // 2. Send to monitoring system
    // 3. Update user statistics

    if (config.NODE_ENV === 'production') {
      await this.persistUsageLog(usageLog);
    }
  }

  /**
   * Log request start
   */
  public logRequestStart(userId: string, request: MCPRequest): void {
    logger.info('MCP request started', {
      userId,
      requestId: request.id,
      type: request.type,
      provider: request.provider,
      model: request.model,
      stream: request.stream,
      messageCount: request.messages.length,
      estimatedTokens: this.estimateTokens(request.messages),
    });
  }

  /**
   * Log request completion
   */
  public logRequestComplete(
    userId: string,
    requestId: string,
    response: MCPResponse,
    duration: number
  ): void {
    logger.info('MCP request completed', {
      userId,
      requestId,
      responseType: response.type,
      duration,
      usage: response.usage,
      hasError: !!response.error,
      success: response.type !== 'error',
    });
  }

  /**
   * Log request error
   */
  public logRequestError(userId: string, requestId: string, error: Error, duration: number): void {
    logger.error('MCP request failed', {
      userId,
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      duration,
    });
  }

  /**
   * Get usage statistics for a user
   */
  public async getUserUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCredits: number;
    averageDuration: number;
    successRate: number;
    usageByModel: Record<string, number>;
    usageByProvider: Record<string, number>;
  }> {
    // In a real implementation, this would query the database
    // For now, return placeholder data

    logger.debug('Fetching user usage stats', {
      userId,
      startDate,
      endDate,
    });

    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCredits: 0,
      averageDuration: 0,
      successRate: 0,
      usageByModel: {},
      usageByProvider: {},
    };
  }

  /**
   * Get system-wide usage statistics
   */
  public async getSystemUsageStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRequests: number;
    totalUsers: number;
    totalTokens: number;
    totalCredits: number;
    averageDuration: number;
    successRate: number;
    topModels: Array<{ model: string; count: number }>;
    topProviders: Array<{ provider: string; count: number }>;
  }> {
    // In a real implementation, this would query the database
    // For now, return placeholder data

    logger.debug('Fetching system usage stats', {
      startDate,
      endDate,
    });

    return {
      totalRequests: 0,
      totalUsers: 0,
      totalTokens: 0,
      totalCredits: 0,
      averageDuration: 0,
      successRate: 0,
      topModels: [],
      topProviders: [],
    };
  }

  /**
   * Estimate token count (rough estimation)
   */
  private estimateTokens(messages: any[]): number {
    let totalTokens = 0;

    for (const message of messages) {
      if (message.content && typeof message.content === 'string') {
        // Rough estimation: ~4 characters per token
        totalTokens += Math.ceil(message.content.length / 4);
      }
    }

    return totalTokens;
  }

  /**
   * Persist usage log to storage
   * In production, this would store to database or send to analytics service
   */
  private async persistUsageLog(usageLog: UsageLog): Promise<void> {
    try {
      // TODO: Implement database storage or external service call
      // Examples:
      // - Store in PostgreSQL usage_logs table
      // - Send to Elasticsearch for analytics
      // - Send to Stripe for billing integration
      // - Send to monitoring dashboard

      logger.debug('Usage log persisted', {
        usageLogId: usageLog.id,
        userId: usageLog.userId,
        requestId: usageLog.requestId,
      });
    } catch (error) {
      logger.error('Failed to persist usage log', {
        usageLogId: usageLog.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw error - logging failure shouldn't break the main flow
    }
  }

  /**
   * Create usage report for billing
   */
  public async generateBillingReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    userId: string;
    period: { start: Date; end: Date };
    totalRequests: number;
    totalCredits: number;
    totalCost: number;
    breakdown: Array<{
      date: Date;
      requests: number;
      credits: number;
      cost: number;
    }>;
  }> {
    // In a real implementation, this would generate a detailed billing report
    logger.info('Generating billing report', {
      userId,
      startDate,
      endDate,
    });

    return {
      userId,
      period: { start: startDate, end: endDate },
      totalRequests: 0,
      totalCredits: 0,
      totalCost: 0,
      breakdown: [],
    };
  }

  /**
   * Export usage data for analysis
   */
  public async exportUsageData(
    format: 'json' | 'csv',
    filters?: {
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      model?: string;
      provider?: string;
    }
  ): Promise<string | Buffer> {
    // In a real implementation, this would query and export data
    logger.info('Exporting usage data', {
      format,
      filters,
    });

    if (format === 'csv') {
      // Return CSV format
      return 'userId,requestId,model,provider,creditsUsed,timestamp\n';
    } else {
      // Return JSON format
      return JSON.stringify({ data: [], total: 0 });
    }
  }

  /**
   * Cleanup old usage logs
   */
  public async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    // In a real implementation, this would delete old logs from database
    logger.info('Cleaning up old usage logs', {
      retentionDays,
    });

    return 0; // Number of deleted records
  }
}

// Export singleton instance
export const loggingService = new LoggingService();
