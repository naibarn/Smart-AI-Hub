import { apiService } from './api.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  token: string;
  refreshToken: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/api/auth/login', credentials);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/api/auth/register', data);
  },

  async logout(): Promise<void> {
    return apiService.post<void>('/api/auth/logout');
  },

  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    return apiService.post<{ token: string; refreshToken: string }>('/api/auth/refresh');
  },

  async getCurrentUser(): Promise<AuthResponse['user']> {
    return apiService.get<AuthResponse['user']>('/api/auth/me');
  },

  async forgotPassword(email: string): Promise<void> {
    return apiService.post<void>('/api/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    return apiService.post<void>('/api/auth/reset-password', { token, password });
  },

  async verifyEmail(token: string): Promise<void> {
    return apiService.post<void>('/api/auth/verify-email', { token });
  },

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return apiService.get<{ status: string; timestamp: string }>('/api/auth/health');
  },
};
