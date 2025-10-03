import { jest } from '@jest/globals';

// Mock Credit Service
export const createMockCreditService = () => ({
  getBalance: jest.fn(),
  getHistory: jest.fn(),
  redeemPromo: jest.fn(),
  adjustCredits: jest.fn(),
});

// Mock Permission Service
export const createMockPermissionService = () => ({
  hasPermission: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
  assignRole: jest.fn(),
  removeRole: jest.fn(),
  getAllRoles: jest.fn(),
  getAllPermissions: jest.fn(),
  createRole: jest.fn(),
  clearUserPermissionCache: jest.fn(),
});

// Setup default behaviors for credit service
export const setupCreditServiceDefaults = (mockCreditService: any) => {
  mockCreditService.getBalance.mockResolvedValue(100);
  mockCreditService.getHistory.mockResolvedValue({
    data: [
      {
        id: 'transaction-id',
        userId: 'test-user-id',
        amount: 50,
        type: 'purchase',
        balanceAfter: 100,
        description: 'Test transaction',
        metadata: {},
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    ],
    total: 1,
  });
  mockCreditService.redeemPromo.mockResolvedValue(25);
  mockCreditService.adjustCredits.mockResolvedValue(150);
};

// Comprehensive test data for RBAC
const mockRoles = [
  {
    id: 'superadmin-role-id',
    name: 'superadmin',
    description: 'Super Administrator',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'admin-role-id',
    name: 'admin',
    description: 'Administrator',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'manager-role-id',
    name: 'manager',
    description: 'Manager',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'user-role-id',
    name: 'user',
    description: 'Regular User',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'guest-role-id',
    name: 'guest',
    description: 'Guest User',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
];

const mockPermissions = [
  {
    id: 'users-read-id',
    name: 'users:read',
    resource: 'users',
    action: 'read',
    description: 'Read user information',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'users-create-id',
    name: 'users:create',
    resource: 'users',
    action: 'create',
    description: 'Create new users',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'users-delete-id',
    name: 'users:delete',
    resource: 'users',
    action: 'delete',
    description: 'Delete users',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'credits-read-id',
    name: 'credits:read',
    resource: 'credits',
    action: 'read',
    description: 'Read credit information',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'credits-update-id',
    name: 'credits:update',
    resource: 'credits',
    action: 'update',
    description: 'Update credit information',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'credits-adjust-id',
    name: 'credits:adjust',
    resource: 'credits',
    action: 'adjust',
    description: 'Adjust user credits',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 'services-use-id',
    name: 'services:use',
    resource: 'services',
    action: 'use',
    description: 'Use services',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
];

// Helper functions for test setup
export const setupMockUserWithRoles = (userId: string, roleNames: string[]) => {
  const userRoles = mockRoles.filter(role => roleNames.includes(role.name));
  (mockPermissionService.getUserRoles as any).mockResolvedValue(userRoles);
  
  const userPermissions = mockPermissions.filter(permission => {
    if (roleNames.includes('superadmin')) return true;
    if (roleNames.includes('admin')) return true; // Admin should have all permissions including delete
    if (roleNames.includes('manager')) {
      return ['users:read', 'credits:read', 'credits:update', 'credits:adjust'].includes(permission.name);
    }
    if (roleNames.includes('user')) {
      return ['users:read', 'credits:read'].includes(permission.name);
    }
    if (roleNames.includes('guest')) {
      return ['services:use'].includes(permission.name);
    }
    return false;
  });
  
  (mockPermissionService.getUserPermissions as any).mockResolvedValue(userPermissions);
  
  // Setup hasPermission based on user permissions
  (mockPermissionService.hasPermission as any).mockImplementation((uid: string, resource: string, action: string) => {
    const permissionName = `${resource}:${action}`;
    return Promise.resolve(userPermissions.some(p => p.name === permissionName));
  });
};

export const resetPermissionMocks = () => {
  (mockPermissionService.hasPermission as any).mockResolvedValue(false);
  (mockPermissionService.getUserRoles as any).mockResolvedValue([]);
  (mockPermissionService.getUserPermissions as any).mockResolvedValue([]);
  (mockPermissionService.assignRole as any).mockResolvedValue(undefined);
  (mockPermissionService.removeRole as any).mockResolvedValue(undefined);
  (mockPermissionService.clearUserPermissionCache as any).mockResolvedValue(undefined);
};

// Setup default behaviors for permission service
export const setupPermissionServiceDefaults = (mockPermissionService: any) => {
  (mockPermissionService.hasPermission as any).mockResolvedValue(false);
  (mockPermissionService.getUserRoles as any).mockResolvedValue([]);
  (mockPermissionService.getUserPermissions as any).mockResolvedValue([]);
  (mockPermissionService.assignRole as any).mockResolvedValue(undefined);
  (mockPermissionService.removeRole as any).mockResolvedValue(undefined);
  (mockPermissionService.getAllRoles as any).mockResolvedValue(mockRoles);
  (mockPermissionService.getAllPermissions as any).mockResolvedValue(mockPermissions);
  (mockPermissionService.createRole as any).mockImplementation((name: string, description?: string) => {
    return Promise.resolve({
      id: 'new-role-id',
      name,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  (mockPermissionService.clearUserPermissionCache as any).mockResolvedValue(undefined);
  
  // Setup error handling for specific cases - override the default implementations
  (mockPermissionService.assignRole as any).mockImplementation((userId: string, roleId: string) => {
    if (roleId === 'non-existent-role-id') {
      return Promise.reject(new Error('Role not found'));
    }
    return Promise.resolve();
  });
  
  (mockPermissionService.removeRole as any).mockImplementation((userId: string, roleId: string) => {
    if (roleId === 'user-role-id') {
      return Promise.reject(new Error('User does not have this role'));
    }
    return Promise.resolve();
  });
  
  (mockPermissionService.createRole as any).mockImplementation((name: string, description?: string) => {
    if (name === 'user') {
      return Promise.reject(new Error('Role with this name already exists'));
    }
    return Promise.resolve({
      id: 'new-role-id',
      name,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
};

export const mockCreditService = createMockCreditService();
export const mockPermissionService = createMockPermissionService();

// Setup defaults
setupCreditServiceDefaults(mockCreditService);
setupPermissionServiceDefaults(mockPermissionService);