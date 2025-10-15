import { jest } from '@jest/globals';

// Mock data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  emailVerified: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};

export const mockRoles = {
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

export const mockPermissions = [
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

export const mockCreditAccount = {
  userId: 'test-user-id',
  balance: 100,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};

export const mockCreditTransaction = {
  id: 'transaction-id',
  userId: 'test-user-id',
  amount: 50,
  type: 'purchase',
  balanceAfter: 100,
  description: 'Test transaction',
  metadata: {},
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
};

export const mockPromoCode = {
  id: 'promo-id',
  code: 'TEST123',
  credits: 25,
  isActive: true,
  expiresAt: new Date(Date.now() + 86400000), // Tomorrow
  maxUses: 100,
  usedCount: 0,
};

// Create comprehensive Prisma mock
export const createMockPrismaClient = () => {
  const mockPrisma = {
    // User operations
    user: {
      findUnique: jest.fn() as any,
      findMany: jest.fn() as any,
      create: jest.fn() as any,
      update: jest.fn() as any,
      delete: jest.fn() as any,
      deleteMany: jest.fn() as any,
    },

    // Role operations
    role: {
      findUnique: jest.fn() as any,
      findMany: jest.fn() as any,
      create: jest.fn() as any,
      update: jest.fn() as any,
      delete: jest.fn() as any,
    },

    // Permission operations
    permission: {
      findMany: jest.fn() as any,
      findUnique: jest.fn() as any,
      create: jest.fn() as any,
    },

    // UserRole operations
    userRole: {
      findMany: jest.fn() as any,
      findUnique: jest.fn() as any,
      create: jest.fn() as any,
      delete: jest.fn() as any,
      deleteMany: jest.fn() as any,
    },

    // RolePermission operations
    rolePermission: {
      findMany: jest.fn() as any,
      createMany: jest.fn() as any,
      delete: jest.fn() as any,
    },

    // Credit operations
    creditAccount: {
      findUnique: jest.fn() as any,
      create: jest.fn() as any,
      update: jest.fn() as any,
    },

    creditTransaction: {
      findMany: jest.fn() as any,
      count: jest.fn() as any,
      create: jest.fn() as any,
    },

    // Promo code operations
    promoCode: {
      findUnique: jest.fn() as any,
      update: jest.fn() as any,
    },

    promoCodeUsage: {
      findUnique: jest.fn() as any,
      create: jest.fn() as any,
    },

    // Payment operations
    payment: {
      findUnique: jest.fn() as any,
      create: jest.fn() as any,
    },

    // Database operations
    $transaction: jest.fn() as any,
    $connect: jest.fn() as any,
    $disconnect: jest.fn() as any,
    $queryRaw: jest.fn() as any,
  };

  // Setup default behaviors
  mockPrisma.user.findUnique.mockResolvedValue(mockUser);
  mockPrisma.user.create.mockResolvedValue(mockUser);

  mockPrisma.role.findUnique.mockImplementation((args: any) => {
    const roleName = args?.where?.name;
    return Promise.resolve(roleName ? mockRoles[roleName as keyof typeof mockRoles] : null);
  });

  mockPrisma.role.findMany.mockResolvedValue(Object.values(mockRoles));
  mockPrisma.role.create.mockImplementation((args: any) => {
    const data = args?.data;
    return Promise.resolve({
      id: 'new-role-id',
      name: data?.name,
      description: data?.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  mockPrisma.permission.findMany.mockResolvedValue(mockPermissions);

  mockPrisma.userRole.findMany.mockResolvedValue([]);
  mockPrisma.userRole.create.mockResolvedValue({
    userId: 'test-user-id',
    roleId: 'user-role-id',
    createdAt: new Date(),
  });
  mockPrisma.userRole.deleteMany.mockResolvedValue({ count: 0 });

  mockPrisma.creditAccount.findUnique.mockResolvedValue(mockCreditAccount);
  mockPrisma.creditTransaction.findMany.mockResolvedValue([mockCreditTransaction]);
  mockPrisma.creditTransaction.count.mockResolvedValue(1);

  mockPrisma.promoCode.findUnique.mockResolvedValue(mockPromoCode);

  mockPrisma.$transaction.mockImplementation((callback: any) => {
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

// Export the mock for Jest
export const PrismaClient = jest.fn().mockImplementation(() => createMockPrismaClient());
