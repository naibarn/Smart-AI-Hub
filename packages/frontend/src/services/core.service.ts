import { apiService } from './api.service';

export interface CreditBalance {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export const coreService = {
  // Credit management
  async getCreditBalance(): Promise<CreditBalance> {
    return apiService.get<CreditBalance>('/api/core/credits/balance');
  },

  async getCreditHistory(limit?: number): Promise<Transaction[]> {
    const params = limit ? { limit: limit.toString() } : undefined;
    return apiService.get<Transaction[]>('/api/core/credits/history', params);
  },

  async addCredits(amount: number, description?: string): Promise<CreditBalance> {
    return apiService.post<CreditBalance>('/api/core/credits/add', {
      amount,
      description,
    });
  },

  // RBAC (Role-Based Access Control)
  async getUserRoles(): Promise<Role[]> {
    return apiService.get<Role[]>('/api/core/rbac/roles');
  },

  async getUserPermissions(): Promise<Permission[]> {
    return apiService.get<Permission[]>('/api/core/rbac/permissions');
  },

  async hasPermission(resource: string, action: string): Promise<boolean> {
    return apiService.get<boolean>(`/api/core/rbac/check?resource=${resource}&action=${action}`);
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiService.get<{ status: string; timestamp: string }>('/api/core/health');
  },
};
