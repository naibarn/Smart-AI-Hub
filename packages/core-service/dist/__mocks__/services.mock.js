"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPointServiceDefaults = exports.mockPointService = exports.mockPermissionService = exports.mockCreditService = exports.setupPermissionServiceDefaults = exports.resetPermissionMocks = exports.setupMockUserWithRoles = exports.setupCreditServiceDefaults = exports.createMockPointService = exports.createMockPermissionService = exports.createMockCreditService = void 0;
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
// Mock Point Service
const createMockPointService = () => ({
    getBalance: globals_1.jest.fn(),
    getTransactionHistory: globals_1.jest.fn(),
    exchangeFromCredits: globals_1.jest.fn(),
    claimDailyReward: globals_1.jest.fn(),
    getDailyRewardStatus: globals_1.jest.fn(),
    deductPoints: globals_1.jest.fn(),
    getExchangeRates: globals_1.jest.fn(),
    updateExchangeRate: globals_1.jest.fn(),
    getPointsStatistics: globals_1.jest.fn(),
    getAutoTopupStatistics: globals_1.jest.fn(),
});
exports.createMockPointService = createMockPointService;
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
    const userRoles = mockRoles.filter((role) => roleNames.includes(role.name));
    exports.mockPermissionService.getUserRoles.mockResolvedValue(userRoles);
    const userPermissions = mockPermissions.filter((permission) => {
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
        return Promise.resolve(userPermissions.some((p) => p.name === permissionName));
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
exports.mockPointService = (0, exports.createMockPointService)();
// Setup defaults
(0, exports.setupCreditServiceDefaults)(exports.mockCreditService);
(0, exports.setupPermissionServiceDefaults)(exports.mockPermissionService);
// Setup default behaviors for point service
const setupPointServiceDefaults = (mockPointService) => {
    mockPointService.getBalance.mockResolvedValue(1000);
    mockPointService.getTransactionHistory.mockResolvedValue({
        transactions: [
            {
                id: 'transaction-id',
                type: 'daily_reward',
                amount: 50,
                balance: 50,
                description: 'Daily login reward',
                metadata: {},
                createdAt: new Date().toISOString(),
            },
        ],
        pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
        },
    });
    mockPointService.exchangeFromCredits.mockResolvedValue({
        transaction: {
            id: 'transaction-id',
            type: 'exchange_from_credit',
            amount: 10000,
            balance: 10000,
            description: 'Manual exchange: 10 Credits → 10000 Points',
            metadata: { creditAmount: 10, exchangeRate: 1000 },
            createdAt: new Date().toISOString(),
        },
        creditTransaction: {
            id: 'credit-transaction-id',
            type: 'exchange_to_points',
            amount: -10,
            balance: 90,
            description: 'Exchange to Points: 10 Credits → 10000 Points',
            metadata: { pointsAmount: 10000, exchangeRate: 1000 },
            createdAt: new Date().toISOString(),
        },
    });
    mockPointService.claimDailyReward.mockResolvedValue({
        transaction: {
            id: 'transaction-id',
            type: 'daily_reward',
            amount: 50,
            balance: 50,
            description: 'Daily login reward',
            metadata: {},
            createdAt: new Date().toISOString(),
        },
        consecutiveDays: 1,
        nextRewardTime: new Date().toISOString(),
    });
    mockPointService.getDailyRewardStatus.mockResolvedValue({
        canClaim: true,
        lastClaimDate: null,
        consecutiveDays: 0,
        nextRewardTime: new Date().toISOString(),
        rewardAmount: 50,
    });
    mockPointService.deductPoints.mockResolvedValue({
        transaction: {
            id: 'transaction-id',
            type: 'usage',
            amount: -100,
            balance: 900,
            description: 'Service usage',
            metadata: {},
            createdAt: new Date().toISOString(),
        },
        autoTopupTriggered: false,
    });
    mockPointService.getExchangeRates.mockResolvedValue({
        rates: [
            {
                id: 'rate-1',
                name: 'credit_to_points',
                rate: 1000,
                description: 'Credits to Points conversion rate',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ],
        config: {
            autoTopupEnabled: true,
            autoTopupThreshold: 10,
            autoTopupAmountCredits: 1,
            dailyRewardEnabled: true,
            dailyRewardAmount: 50,
        },
    });
    mockPointService.updateExchangeRate.mockResolvedValue({
        rate: {
            id: 'rate-1',
            name: 'credit_to_points',
            rate: 1200,
            description: 'Updated rate for testing',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    });
    mockPointService.getPointsStatistics.mockResolvedValue({
        overview: {
            totalPoints: 2500000,
            totalUsers: 1250,
            activeUsers: 890,
            averageBalance: 2000,
        },
        transactions: {
            total: 15420,
            byType: {
                purchase: 3200,
                usage: 8900,
                exchange_from_credit: 2100,
                daily_reward: 1200,
                auto_topup_from_credit: 20,
            },
            totalPointsEarned: 2100000,
            totalPointsSpent: 1500000,
        },
        period: {
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
        },
    });
    mockPointService.getAutoTopupStatistics.mockResolvedValue({
        overview: {
            totalAutoTopups: 342,
            totalCreditsConverted: 342,
            totalPointsGenerated: 342000,
            uniqueUsers: 125,
        },
        recentAutoTopups: [
            {
                id: 'transaction-1',
                user: {
                    id: 'user-1',
                    email: 'user@example.com',
                },
                amount: 1000,
                createdAt: new Date().toISOString(),
            },
        ],
        period: {
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
        },
    });
};
exports.setupPointServiceDefaults = setupPointServiceDefaults;
// Setup defaults for point service
(0, exports.setupPointServiceDefaults)(exports.mockPointService);
//# sourceMappingURL=services.mock.js.map