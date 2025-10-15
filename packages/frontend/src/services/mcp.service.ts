import { apiService } from './api.service';

export interface Provider {
  id: string;
  name: string;
  type: 'openai' | 'claude' | 'custom';
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
}

export interface Connection {
  id: string;
  providerId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastActivity: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  connectionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

export const mcpService = {
  // Provider management
  async getProviders(): Promise<Provider[]> {
    return apiService.get<Provider[]>('/api/mcp/providers');
  },

  async getProvider(id: string): Promise<Provider> {
    return apiService.get<Provider>(`/api/mcp/providers/${id}`);
  },

  async createProvider(provider: Omit<Provider, 'id'>): Promise<Provider> {
    return apiService.post<Provider>('/api/mcp/providers', provider);
  },

  async updateProvider(id: string, provider: Partial<Provider>): Promise<Provider> {
    return apiService.put<Provider>(`/api/mcp/providers/${id}`, provider);
  },

  async deleteProvider(id: string): Promise<void> {
    return apiService.delete<void>(`/api/mcp/providers/${id}`);
  },

  // Connection management
  async getConnections(): Promise<Connection[]> {
    return apiService.get<Connection[]>('/api/mcp/connections');
  },

  async getConnection(id: string): Promise<Connection> {
    return apiService.get<Connection>(`/api/mcp/connections/${id}`);
  },

  async createConnection(connection: Omit<Connection, 'id'>): Promise<Connection> {
    return apiService.post<Connection>('/api/mcp/connections', connection);
  },

  async closeConnection(id: string): Promise<void> {
    return apiService.post<void>(`/api/mcp/connections/${id}/close`);
  },

  // Message handling
  async getMessages(connectionId?: string): Promise<Message[]> {
    const params = connectionId ? { connectionId } : undefined;
    return apiService.get<Message[]>('/api/mcp/messages', params);
  },

  async sendMessage(connectionId: string, content: string): Promise<Message> {
    return apiService.post<Message>('/api/mcp/messages', {
      connectionId,
      role: 'user',
      content,
    });
  },

  // Logging
  async getLogs(level?: string, limit?: number): Promise<LogEntry[]> {
    const params: Record<string, string> = {};
    if (level) params.level = level;
    if (limit) params.limit = limit.toString();
    return apiService.get<LogEntry[]>('/api/mcp/logs', params);
  },

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    providers: number;
    connections: number;
  }> {
    return apiService.get<{
      status: string;
      timestamp: string;
      providers: number;
      connections: number;
    }>('/api/mcp/health');
  },
};
