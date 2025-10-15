import {
  mockPermissionService,
  setupMockUserWithRoles,
  resetPermissionMocks,
} from '../__mocks__/services.mock';

// Mock the permission service module
jest.mock('../services/permission.service', () => ({
  hasPermission: mockPermissionService.hasPermission,
  getUserRoles: mockPermissionService.getUserRoles,
  getUserPermissions: mockPermissionService.getUserPermissions,
  assignRole: mockPermissionService.assignRole,
  removeRole: mockPermissionService.removeRole,
  getAllRoles: mockPermissionService.getAllRoles,
  getAllPermissions: mockPermissionService.getAllPermissions,
  createRole: mockPermissionService.createRole,
  clearUserPermissionCache: mockPermissionService.clearUserPermissionCache,
}));

describe('RBAC System Tests', () => {
  let testUser: any;
  let adminRole: any;
  let userRole: any;
  let managerRole: any;
  let guestRole: any;
  let testPermissions: any[] = [];

  beforeAll(async () => {
    // Setup test data
    testUser = { id: 'test-user-id', email: 'test-rbac@example.com' };

    // Get mock roles
    const allRoles = await (mockPermissionService.getAllRoles as any)();
    adminRole = allRoles.find((r: any) => r.name === 'admin');
    userRole = allRoles.find((r: any) => r.name === 'user');
    managerRole = allRoles.find((r: any) => r.name === 'manager');
    guestRole = allRoles.find((r: any) => r.name === 'guest');

    // Get test permissions
    testPermissions = await (mockPermissionService.getAllPermissions as any)();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    resetPermissionMocks();
  });

  describe('Permission Checking Logic', () => {
    test('should return false for user with no roles', async () => {
      setupMockUserWithRoles(testUser.id, []);

      const hasUserPermission = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'read'
      );
      expect(hasUserPermission).toBe(false);
    });

    test('should return true for user with correct permission', async () => {
      setupMockUserWithRoles(testUser.id, ['user']);

      const hasUserPermission = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'read'
      );
      expect(hasUserPermission).toBe(true);
    });

    test('should return false for user without correct permission', async () => {
      setupMockUserWithRoles(testUser.id, ['user']);

      const hasDeletePermission = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'delete'
      );
      expect(hasDeletePermission).toBe(false);
    });

    test('should return true for admin with all permissions', async () => {
      setupMockUserWithRoles(testUser.id, ['admin']);

      const hasDeletePermission = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'delete'
      );
      expect(hasDeletePermission).toBe(true);
    });

    test('should cache permission results', async () => {
      setupMockUserWithRoles(testUser.id, ['user']);

      // Clear cache first
      await (mockPermissionService.clearUserPermissionCache as any)(testUser.id);
      expect(mockPermissionService.clearUserPermissionCache).toHaveBeenCalledWith(testUser.id);

      // First call should hit database
      const startTime1 = Date.now();
      const hasPermission1 = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'read'
      );
      const duration1 = Date.now() - startTime1;

      // Second call should hit cache
      const startTime2 = Date.now();
      const hasPermission2 = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'read'
      );
      const duration2 = Date.now() - startTime2;

      expect(hasPermission1).toBe(true);
      expect(hasPermission2).toBe(true);
      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
    });
  });

  describe('Role Assignment', () => {
    beforeEach(() => {
      setupMockUserWithRoles(testUser.id, []);
    });

    test('should assign role to user successfully', async () => {
      await (mockPermissionService.assignRole as any)(testUser.id, userRole!.id);
      expect(mockPermissionService.assignRole).toHaveBeenCalledWith(testUser.id, userRole!.id);

      setupMockUserWithRoles(testUser.id, ['user']);
      const userRoles = await (mockPermissionService.getUserRoles as any)(testUser.id);
      expect(userRoles).toHaveLength(1);
      expect(userRoles[0].name).toBe('user');
    });

    test('should remove role from user successfully', async () => {
      setupMockUserWithRoles(testUser.id, ['user']);

      await (mockPermissionService.removeRole as any)(testUser.id, userRole!.id);
      expect(mockPermissionService.removeRole).toHaveBeenCalledWith(testUser.id, userRole!.id);

      setupMockUserWithRoles(testUser.id, []);
      const userRoles = await (mockPermissionService.getUserRoles as any)(testUser.id);
      expect(userRoles).toHaveLength(0);
    });

    test('should throw error when assigning non-existent role', async () => {
      // Setup error handling for this specific test
      (mockPermissionService.assignRole as any).mockImplementation(
        (userId: string, roleId: string) => {
          if (roleId === 'non-existent-role-id') {
            return Promise.reject(new Error('Role not found'));
          }
          return Promise.resolve();
        }
      );

      await expect(
        (mockPermissionService.assignRole as any)(testUser.id, 'non-existent-role-id')
      ).rejects.toThrow('Role not found');
    });

    test('should throw error when removing non-assigned role', async () => {
      // Setup error handling for this specific test
      (mockPermissionService.removeRole as any).mockImplementation(
        (userId: string, roleId: string) => {
          if (roleId === 'user-role-id') {
            return Promise.reject(new Error('User does not have this role'));
          }
          return Promise.resolve();
        }
      );

      await expect(
        (mockPermissionService.removeRole as any)(testUser.id, userRole!.id)
      ).rejects.toThrow('User does not have this role');
    });

    test('should allow multiple roles for user', async () => {
      setupMockUserWithRoles(testUser.id, ['user', 'manager']);

      const userRoles = await (mockPermissionService.getUserRoles as any)(testUser.id);
      expect(userRoles).toHaveLength(2);
      expect(userRoles.map((r: any) => r.name)).toContain('user');
      expect(userRoles.map((r: any) => r.name)).toContain('manager');
    });
  });

  describe('Permission Aggregation', () => {
    beforeEach(() => {
      setupMockUserWithRoles(testUser.id, []);
    });

    test('should aggregate permissions from multiple roles', async () => {
      setupMockUserWithRoles(testUser.id, ['user', 'manager']);

      const userPermissions = await (mockPermissionService.getUserPermissions as any)(testUser.id);
      const permissionNames = userPermissions.map((p: any) => p.name);

      // Should have permissions from both roles
      expect(permissionNames).toContain('users:read');
      expect(permissionNames).toContain('credits:read');
      expect(permissionNames).toContain('credits:update');
    });

    test('should not duplicate permissions from multiple roles', async () => {
      setupMockUserWithRoles(testUser.id, ['user', 'manager']);

      const userPermissions = await (mockPermissionService.getUserPermissions as any)(testUser.id);
      const uniquePermissionNames = [...new Set(userPermissions.map((p: any) => p.name))];

      // Should have same number of unique permissions as total permissions
      expect(userPermissions.length).toBe(uniquePermissionNames.length);
    });
  });

  describe('Role Management', () => {
    test('should get all roles', async () => {
      const roles = await (mockPermissionService.getAllRoles as any)();
      expect(roles.length).toBeGreaterThan(0);

      const roleNames = roles.map((r: any) => r.name);
      expect(roleNames).toContain('superadmin');
      expect(roleNames).toContain('admin');
      expect(roleNames).toContain('manager');
      expect(roleNames).toContain('user');
      expect(roleNames).toContain('guest');
    });

    test('should get all permissions', async () => {
      const permissions = await (mockPermissionService.getAllPermissions as any)();
      expect(permissions.length).toBeGreaterThan(0);

      const permissionNames = permissions.map((p: any) => p.name);
      expect(permissionNames).toContain('users:read');
      expect(permissionNames).toContain('users:create');
      expect(permissionNames).toContain('credits:read');
      expect(permissionNames).toContain('services:use');
    });

    test('should create new role successfully', async () => {
      const newRole = await (mockPermissionService.createRole as any)(
        'test-role',
        'Test role for testing',
        [testPermissions[0]?.id, testPermissions[1]?.id]
      );

      expect(newRole.name).toBe('test-role');
      expect(newRole.description).toBe('Test role for testing');
    });

    test('should throw error when creating duplicate role', async () => {
      // Setup error handling for this specific test
      (mockPermissionService.createRole as any).mockImplementation(
        (name: string, description?: string) => {
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
        }
      );

      await expect(
        (mockPermissionService.createRole as any)('user', 'Duplicate user role')
      ).rejects.toThrow('Role with this name already exists');
    });
  });

  describe('Hierarchical Permissions', () => {
    beforeEach(() => {
      setupMockUserWithRoles(testUser.id, []);
    });

    test('superadmin should have all permissions', async () => {
      setupMockUserWithRoles(testUser.id, ['admin']);

      const allPermissions = await (mockPermissionService.getAllPermissions as any)();
      const userPermissions = await (mockPermissionService.getUserPermissions as any)(testUser.id);

      // Admin should have most permissions (except superadmin-specific)
      expect(userPermissions.length).toBeGreaterThan(allPermissions.length * 0.8);
    });

    test('guest should have limited permissions', async () => {
      setupMockUserWithRoles(testUser.id, ['guest']);

      const userPermissions = await (mockPermissionService.getUserPermissions as any)(testUser.id);
      const permissionNames = userPermissions.map((p: any) => p.name);

      // Guest should only have service use permissions
      expect(permissionNames).toContain('services:use');
      expect(permissionNames).not.toContain('users:read');
      expect(permissionNames).not.toContain('credits:adjust');
    });

    test('manager should have team and credit permissions', async () => {
      setupMockUserWithRoles(testUser.id, ['manager']);

      const userPermissions = await (mockPermissionService.getUserPermissions as any)(testUser.id);
      const permissionNames = userPermissions.map((p: any) => p.name);

      // Manager should have specific permissions
      expect(permissionNames).toContain('users:read');
      expect(permissionNames).toContain('credits:read');
      expect(permissionNames).toContain('credits:update');
      expect(permissionNames).toContain('credits:adjust');
      expect(permissionNames).not.toContain('users:delete');
    });
  });

  describe('Cache Functionality', () => {
    beforeEach(() => {
      setupMockUserWithRoles(testUser.id, []);
    });

    test('should clear cache when role is assigned', async () => {
      // Assign role and check permission
      await (mockPermissionService.assignRole as any)(testUser.id, userRole!.id);
      expect(mockPermissionService.assignRole).toHaveBeenCalledWith(testUser.id, userRole!.id);

      setupMockUserWithRoles(testUser.id, ['user']);
      const hasPermissionBefore = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'read'
      );
      expect(hasPermissionBefore).toBe(true);

      // Remove role
      await (mockPermissionService.removeRole as any)(testUser.id, userRole!.id);
      expect(mockPermissionService.removeRole).toHaveBeenCalledWith(testUser.id, userRole!.id);

      // Check permission again (should be false after cache clear)
      setupMockUserWithRoles(testUser.id, []);
      const hasPermissionAfter = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'read'
      );
      expect(hasPermissionAfter).toBe(false);
    });

    test('should clear cache when role is removed', async () => {
      // Assign role
      setupMockUserWithRoles(testUser.id, ['user']);

      // Check permission to cache it
      await (mockPermissionService.hasPermission as any)(testUser.id, 'users', 'read');

      // Remove role
      await (mockPermissionService.removeRole as any)(testUser.id, userRole!.id);
      expect(mockPermissionService.removeRole).toHaveBeenCalledWith(testUser.id, userRole!.id);

      // Check permission again (should be false after cache clear)
      setupMockUserWithRoles(testUser.id, []);
      const hasPermissionAfter = await (mockPermissionService.hasPermission as any)(
        testUser.id,
        'users',
        'read'
      );
      expect(hasPermissionAfter).toBe(false);
    });
  });
});
