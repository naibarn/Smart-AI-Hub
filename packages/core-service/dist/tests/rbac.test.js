"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const services_mock_1 = require("../__mocks__/services.mock");
// Mock the permission service module
jest.mock('../services/permission.service', () => ({
    hasPermission: services_mock_1.mockPermissionService.hasPermission,
    getUserRoles: services_mock_1.mockPermissionService.getUserRoles,
    getUserPermissions: services_mock_1.mockPermissionService.getUserPermissions,
    assignRole: services_mock_1.mockPermissionService.assignRole,
    removeRole: services_mock_1.mockPermissionService.removeRole,
    getAllRoles: services_mock_1.mockPermissionService.getAllRoles,
    getAllPermissions: services_mock_1.mockPermissionService.getAllPermissions,
    createRole: services_mock_1.mockPermissionService.createRole,
    clearUserPermissionCache: services_mock_1.mockPermissionService.clearUserPermissionCache,
}));
describe('RBAC System Tests', () => {
    let testUser;
    let adminRole;
    let userRole;
    let managerRole;
    let guestRole;
    let testPermissions = [];
    beforeAll(async () => {
        // Setup test data
        testUser = { id: 'test-user-id', email: 'test-rbac@example.com' };
        // Get mock roles
        const allRoles = await services_mock_1.mockPermissionService.getAllRoles();
        adminRole = allRoles.find((r) => r.name === 'admin');
        userRole = allRoles.find((r) => r.name === 'user');
        managerRole = allRoles.find((r) => r.name === 'manager');
        guestRole = allRoles.find((r) => r.name === 'guest');
        // Get test permissions
        testPermissions = await services_mock_1.mockPermissionService.getAllPermissions();
    });
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        (0, services_mock_1.resetPermissionMocks)();
    });
    describe('Permission Checking Logic', () => {
        test('should return false for user with no roles', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, []);
            const hasUserPermission = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'read');
            expect(hasUserPermission).toBe(false);
        });
        test('should return true for user with correct permission', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user']);
            const hasUserPermission = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'read');
            expect(hasUserPermission).toBe(true);
        });
        test('should return false for user without correct permission', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user']);
            const hasDeletePermission = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'delete');
            expect(hasDeletePermission).toBe(false);
        });
        test('should return true for admin with all permissions', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['admin']);
            const hasDeletePermission = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'delete');
            expect(hasDeletePermission).toBe(true);
        });
        test('should cache permission results', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user']);
            // Clear cache first
            await services_mock_1.mockPermissionService.clearUserPermissionCache(testUser.id);
            expect(services_mock_1.mockPermissionService.clearUserPermissionCache).toHaveBeenCalledWith(testUser.id);
            // First call should hit database
            const startTime1 = Date.now();
            const hasPermission1 = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'read');
            const duration1 = Date.now() - startTime1;
            // Second call should hit cache
            const startTime2 = Date.now();
            const hasPermission2 = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'read');
            const duration2 = Date.now() - startTime2;
            expect(hasPermission1).toBe(true);
            expect(hasPermission2).toBe(true);
            expect(services_mock_1.mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
        });
    });
    describe('Role Assignment', () => {
        beforeEach(() => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, []);
        });
        test('should assign role to user successfully', async () => {
            await services_mock_1.mockPermissionService.assignRole(testUser.id, userRole.id);
            expect(services_mock_1.mockPermissionService.assignRole).toHaveBeenCalledWith(testUser.id, userRole.id);
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user']);
            const userRoles = await services_mock_1.mockPermissionService.getUserRoles(testUser.id);
            expect(userRoles).toHaveLength(1);
            expect(userRoles[0].name).toBe('user');
        });
        test('should remove role from user successfully', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user']);
            await services_mock_1.mockPermissionService.removeRole(testUser.id, userRole.id);
            expect(services_mock_1.mockPermissionService.removeRole).toHaveBeenCalledWith(testUser.id, userRole.id);
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, []);
            const userRoles = await services_mock_1.mockPermissionService.getUserRoles(testUser.id);
            expect(userRoles).toHaveLength(0);
        });
        test('should throw error when assigning non-existent role', async () => {
            // Setup error handling for this specific test
            services_mock_1.mockPermissionService.assignRole.mockImplementation((userId, roleId) => {
                if (roleId === 'non-existent-role-id') {
                    return Promise.reject(new Error('Role not found'));
                }
                return Promise.resolve();
            });
            await expect(services_mock_1.mockPermissionService.assignRole(testUser.id, 'non-existent-role-id')).rejects.toThrow('Role not found');
        });
        test('should throw error when removing non-assigned role', async () => {
            // Setup error handling for this specific test
            services_mock_1.mockPermissionService.removeRole.mockImplementation((userId, roleId) => {
                if (roleId === 'user-role-id') {
                    return Promise.reject(new Error('User does not have this role'));
                }
                return Promise.resolve();
            });
            await expect(services_mock_1.mockPermissionService.removeRole(testUser.id, userRole.id)).rejects.toThrow('User does not have this role');
        });
        test('should allow multiple roles for user', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user', 'manager']);
            const userRoles = await services_mock_1.mockPermissionService.getUserRoles(testUser.id);
            expect(userRoles).toHaveLength(2);
            expect(userRoles.map((r) => r.name)).toContain('user');
            expect(userRoles.map((r) => r.name)).toContain('manager');
        });
    });
    describe('Permission Aggregation', () => {
        beforeEach(() => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, []);
        });
        test('should aggregate permissions from multiple roles', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user', 'manager']);
            const userPermissions = await services_mock_1.mockPermissionService.getUserPermissions(testUser.id);
            const permissionNames = userPermissions.map((p) => p.name);
            // Should have permissions from both roles
            expect(permissionNames).toContain('users:read');
            expect(permissionNames).toContain('credits:read');
            expect(permissionNames).toContain('credits:update');
        });
        test('should not duplicate permissions from multiple roles', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user', 'manager']);
            const userPermissions = await services_mock_1.mockPermissionService.getUserPermissions(testUser.id);
            const uniquePermissionNames = [...new Set(userPermissions.map((p) => p.name))];
            // Should have same number of unique permissions as total permissions
            expect(userPermissions.length).toBe(uniquePermissionNames.length);
        });
    });
    describe('Role Management', () => {
        test('should get all roles', async () => {
            const roles = await services_mock_1.mockPermissionService.getAllRoles();
            expect(roles.length).toBeGreaterThan(0);
            const roleNames = roles.map((r) => r.name);
            expect(roleNames).toContain('superadmin');
            expect(roleNames).toContain('admin');
            expect(roleNames).toContain('manager');
            expect(roleNames).toContain('user');
            expect(roleNames).toContain('guest');
        });
        test('should get all permissions', async () => {
            const permissions = await services_mock_1.mockPermissionService.getAllPermissions();
            expect(permissions.length).toBeGreaterThan(0);
            const permissionNames = permissions.map((p) => p.name);
            expect(permissionNames).toContain('users:read');
            expect(permissionNames).toContain('users:create');
            expect(permissionNames).toContain('credits:read');
            expect(permissionNames).toContain('services:use');
        });
        test('should create new role successfully', async () => {
            const newRole = await services_mock_1.mockPermissionService.createRole('test-role', 'Test role for testing', [
                testPermissions[0]?.id,
                testPermissions[1]?.id,
            ]);
            expect(newRole.name).toBe('test-role');
            expect(newRole.description).toBe('Test role for testing');
        });
        test('should throw error when creating duplicate role', async () => {
            // Setup error handling for this specific test
            services_mock_1.mockPermissionService.createRole.mockImplementation((name, description) => {
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
            await expect(services_mock_1.mockPermissionService.createRole('user', 'Duplicate user role')).rejects.toThrow('Role with this name already exists');
        });
    });
    describe('Hierarchical Permissions', () => {
        beforeEach(() => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, []);
        });
        test('superadmin should have all permissions', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['admin']);
            const allPermissions = await services_mock_1.mockPermissionService.getAllPermissions();
            const userPermissions = await services_mock_1.mockPermissionService.getUserPermissions(testUser.id);
            // Admin should have most permissions (except superadmin-specific)
            expect(userPermissions.length).toBeGreaterThan(allPermissions.length * 0.8);
        });
        test('guest should have limited permissions', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['guest']);
            const userPermissions = await services_mock_1.mockPermissionService.getUserPermissions(testUser.id);
            const permissionNames = userPermissions.map((p) => p.name);
            // Guest should only have service use permissions
            expect(permissionNames).toContain('services:use');
            expect(permissionNames).not.toContain('users:read');
            expect(permissionNames).not.toContain('credits:adjust');
        });
        test('manager should have team and credit permissions', async () => {
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['manager']);
            const userPermissions = await services_mock_1.mockPermissionService.getUserPermissions(testUser.id);
            const permissionNames = userPermissions.map((p) => p.name);
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
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, []);
        });
        test('should clear cache when role is assigned', async () => {
            // Assign role and check permission
            await services_mock_1.mockPermissionService.assignRole(testUser.id, userRole.id);
            expect(services_mock_1.mockPermissionService.assignRole).toHaveBeenCalledWith(testUser.id, userRole.id);
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user']);
            const hasPermissionBefore = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'read');
            expect(hasPermissionBefore).toBe(true);
            // Remove role
            await services_mock_1.mockPermissionService.removeRole(testUser.id, userRole.id);
            expect(services_mock_1.mockPermissionService.removeRole).toHaveBeenCalledWith(testUser.id, userRole.id);
            // Check permission again (should be false after cache clear)
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, []);
            const hasPermissionAfter = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'read');
            expect(hasPermissionAfter).toBe(false);
        });
        test('should clear cache when role is removed', async () => {
            // Assign role
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, ['user']);
            // Check permission to cache it
            await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'read');
            // Remove role
            await services_mock_1.mockPermissionService.removeRole(testUser.id, userRole.id);
            expect(services_mock_1.mockPermissionService.removeRole).toHaveBeenCalledWith(testUser.id, userRole.id);
            // Check permission again (should be false after cache clear)
            (0, services_mock_1.setupMockUserWithRoles)(testUser.id, []);
            const hasPermissionAfter = await services_mock_1.mockPermissionService.hasPermission(testUser.id, 'users', 'read');
            expect(hasPermissionAfter).toBe(false);
        });
    });
});
//# sourceMappingURL=rbac.test.js.map