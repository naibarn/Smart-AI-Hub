"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = exports.createMockPrismaClient = exports.mockPromoCode = exports.mockCreditTransaction = exports.mockCreditAccount = exports.mockPermissions = exports.mockRoles = exports.mockUser = void 0;
const globals_1 = require("@jest/globals");
// Mock data
exports.mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    emailVerified: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};
exports.mockRoles = {
    admin: {
        id: 'admin-role-id',
        name: 'admin',
        description: 'Administrator role',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    user: {
        id: 'user-role-id',
        name: 'user',
        description: 'Regular user role',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    manager: {
        id: 'manager-role-id',
        name: 'manager',
        description: 'Manager role',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    guest: {
        id: 'guest-role-id',
        name: 'guest',
        description: 'Guest role',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    superadmin: {
        id: 'superadmin-role-id',
        name: 'superadmin',
        description: 'Super Administrator role',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    },
};
exports.mockPermissions = [
    {
        id: 'perm-users-read',
        name: 'users:read',
        resource: 'users',
        action: 'read',
        description: 'Read users',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
        id: 'perm-users-create',
        name: 'users:create',
        resource: 'users',
        action: 'create',
        description: 'Create users',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
        id: 'perm-users-delete',
        name: 'users:delete',
        resource: 'users',
        action: 'delete',
        description: 'Delete users',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
        id: 'perm-credits-read',
        name: 'credits:read',
        resource: 'credits',
        action: 'read',
        description: 'Read credits',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
        id: 'perm-credits-update',
        name: 'credits:update',
        resource: 'credits',
        action: 'update',
        description: 'Update credits',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
        id: 'perm-credits-adjust',
        name: 'credits:adjust',
        resource: 'credits',
        action: 'adjust',
        description: 'Adjust credits',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
        id: 'perm-services-use',
        name: 'services:use',
        resource: 'services',
        action: 'use',
        description: 'Use services',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
];
exports.mockCreditAccount = {
    userId: 'test-user-id',
    currentBalance: 100,
    totalPurchased: 100,
    totalUsed: 0,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};
exports.mockCreditTransaction = {
    id: 'transaction-id',
    userId: 'test-user-id',
    amount: 50,
    type: 'purchase',
    balanceAfter: 100,
    description: 'Test transaction',
    metadata: {},
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
};
exports.mockPromoCode = {
    id: 'promo-id',
    code: 'TEST123',
    credits: 25,
    isActive: true,
    expiresAt: new Date(Date.now() + 86400000), // Tomorrow
    maxUses: 100,
    usedCount: 0,
};
// Create comprehensive Prisma mock
const createMockPrismaClient = () => {
    const mockPrisma = {
        // User operations
        user: {
            findUnique: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
            deleteMany: globals_1.jest.fn(),
        },
        // Role operations
        role: {
            findUnique: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
        },
        // Permission operations
        permission: {
            findMany: globals_1.jest.fn(),
            findUnique: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
        },
        // UserRole operations
        userRole: {
            findMany: globals_1.jest.fn(),
            findUnique: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
            deleteMany: globals_1.jest.fn(),
        },
        // RolePermission operations
        rolePermission: {
            findMany: globals_1.jest.fn(),
            createMany: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
        },
        // Credit operations
        creditAccount: {
            findUnique: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
        },
        creditTransaction: {
            findMany: globals_1.jest.fn(),
            count: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
        },
        // Promo code operations
        promoCode: {
            findUnique: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
        },
        promoCodeUsage: {
            findUnique: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
        },
        // Payment operations
        payment: {
            findUnique: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
        },
        // Database operations
        $transaction: globals_1.jest.fn(),
        $connect: globals_1.jest.fn(),
        $disconnect: globals_1.jest.fn(),
        $queryRaw: globals_1.jest.fn(),
    };
    // Setup default behaviors
    mockPrisma.user.findUnique.mockResolvedValue(exports.mockUser);
    mockPrisma.user.create.mockResolvedValue(exports.mockUser);
    mockPrisma.role.findUnique.mockImplementation((args) => {
        const roleName = args?.where?.name;
        return Promise.resolve(roleName ? exports.mockRoles[roleName] : null);
    });
    mockPrisma.role.findMany.mockResolvedValue(Object.values(exports.mockRoles));
    mockPrisma.role.create.mockImplementation((args) => {
        const data = args?.data;
        return Promise.resolve({
            id: 'new-role-id',
            name: data?.name,
            description: data?.description,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });
    mockPrisma.permission.findMany.mockResolvedValue(exports.mockPermissions);
    mockPrisma.userRole.findMany.mockResolvedValue([]);
    mockPrisma.userRole.create.mockResolvedValue({
        userId: 'test-user-id',
        roleId: 'user-role-id',
        createdAt: new Date(),
    });
    mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.creditAccount.findUnique.mockResolvedValue(exports.mockCreditAccount);
    mockPrisma.creditTransaction.findMany.mockResolvedValue([exports.mockCreditTransaction]);
    mockPrisma.creditTransaction.count.mockResolvedValue(1);
    mockPrisma.promoCode.findUnique.mockResolvedValue(exports.mockPromoCode);
    mockPrisma.$transaction.mockImplementation((callback) => {
        if (typeof callback === 'function') {
            return callback(mockPrisma);
        }
        return Promise.resolve(callback);
    });
    mockPrisma.$connect.mockResolvedValue(undefined);
    mockPrisma.$disconnect.mockResolvedValue(undefined);
    mockPrisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);
    return mockPrisma;
};
exports.createMockPrismaClient = createMockPrismaClient;
// Export the mock for Jest
exports.PrismaClient = globals_1.jest.fn().mockImplementation(() => (0, exports.createMockPrismaClient)());
//# sourceMappingURL=prisma.mock.js.map