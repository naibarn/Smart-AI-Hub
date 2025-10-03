"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockPermissionService = exports.mockCreditService = exports.setupPermissionServiceDefaults = exports.resetPermissionMocks = exports.setupMockUserWithRoles = exports.setupCreditServiceDefaults = exports.createMockPermissionService = exports.createMockCreditService = void 0;
const globals_1 = require("@jest/globals");
// Mock Credit Service
const createMockCreditService = () => ({
    getBalance: globals_1.jest.fn(),
    getHistory: globals_1.jest.fn(),
    redeemPromo: globals_1.jest.fn(),
    adjustCredits: globals_1.jest.fn(),
});
exports.createMockCreditService = createMockCreditService;
// Mock Permission Service
const createMockPermissionService = () => ({
    hasPermission: globals_1.jest.fn(),
    getUserRoles: globals_1.jest.fn(),
    getUserPermissions: globals_1.jest.fn(),
    assignRole: globals_1.jest.fn(),
    removeRole: globals_1.jest.fn(),
    getAllRoles: globals_1.jest.fn(),
    getAllPermissions: globals_1.jest.fn(),
    createRole: globals_1.jest.fn(),
    clearUserPermissionCache: globals_1.jest.fn(),
});
exports.createMockPermissionService = createMockPermissionService;
// Setup default behaviors for credit service
const setupCreditServiceDefaults = (mockCreditService) => {
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
exports.setupCreditServiceDefaults = setupCreditServiceDefaults;
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
const setupMockUserWithRoles = (userId, roleNames) => {
    const userRoles = mockRoles.filter(role => roleNames.includes(role.name));
    exports.mockPermissionService.getUserRoles.mockResolvedValue(userRoles);
    const userPermissions = mockPermissions.filter(permission => {
        if (roleNames.includes('superadmin'))
            return true;
        if (roleNames.includes('admin'))
            return true; // Admin should have all permissions including delete
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
    exports.mockPermissionService.getUserPermissions.mockResolvedValue(userPermissions);
    // Setup hasPermission based on user permissions
    exports.mockPermissionService.hasPermission.mockImplementation((uid, resource, action) => {
        const permissionName = `${resource}:${action}`;
        return Promise.resolve(userPermissions.some(p => p.name === permissionName));
    });
};
exports.setupMockUserWithRoles = setupMockUserWithRoles;
const resetPermissionMocks = () => {
    exports.mockPermissionService.hasPermission.mockResolvedValue(false);
    exports.mockPermissionService.getUserRoles.mockResolvedValue([]);
    exports.mockPermissionService.getUserPermissions.mockResolvedValue([]);
    exports.mockPermissionService.assignRole.mockResolvedValue(undefined);
    exports.mockPermissionService.removeRole.mockResolvedValue(undefined);
    exports.mockPermissionService.clearUserPermissionCache.mockResolvedValue(undefined);
};
exports.resetPermissionMocks = resetPermissionMocks;
// Setup default behaviors for permission service
const setupPermissionServiceDefaults = (mockPermissionService) => {
    mockPermissionService.hasPermission.mockResolvedValue(false);
    mockPermissionService.getUserRoles.mockResolvedValue([]);
    mockPermissionService.getUserPermissions.mockResolvedValue([]);
    mockPermissionService.assignRole.mockResolvedValue(undefined);
    mockPermissionService.removeRole.mockResolvedValue(undefined);
    mockPermissionService.getAllRoles.mockResolvedValue(mockRoles);
    mockPermissionService.getAllPermissions.mockResolvedValue(mockPermissions);
    mockPermissionService.createRole.mockImplementation((name, description) => {
        return Promise.resolve({
            id: 'new-role-id',
            name,
            description: description || '',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });
    mockPermissionService.clearUserPermissionCache.mockResolvedValue(undefined);
    // Setup error handling for specific cases - override the default implementations
    mockPermissionService.assignRole.mockImplementation((userId, roleId) => {
        if (roleId === 'non-existent-role-id') {
            return Promise.reject(new Error('Role not found'));
        }
        return Promise.resolve();
    });
    mockPermissionService.removeRole.mockImplementation((userId, roleId) => {
        if (roleId === 'user-role-id') {
            return Promise.reject(new Error('User does not have this role'));
        }
        return Promise.resolve();
    });
    mockPermissionService.createRole.mockImplementation((name, description) => {
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
exports.setupPermissionServiceDefaults = setupPermissionServiceDefaults;
exports.mockCreditService = (0, exports.createMockCreditService)();
exports.mockPermissionService = (0, exports.createMockPermissionService)();
// Setup defaults
(0, exports.setupCreditServiceDefaults)(exports.mockCreditService);
(0, exports.setupPermissionServiceDefaults)(exports.mockPermissionService);
//# sourceMappingURL=services.mock.js.map