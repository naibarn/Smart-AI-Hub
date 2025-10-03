export declare const mockUser: {
    id: string;
    email: string;
    passwordHash: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockRoles: {
    admin: {
        id: string;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    };
    user: {
        id: string;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    };
    manager: {
        id: string;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    };
    guest: {
        id: string;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    };
    superadmin: {
        id: string;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const mockPermissions: {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    createdAt: Date;
}[];
export declare const mockCreditAccount: {
    userId: string;
    currentBalance: number;
    totalPurchased: number;
    totalUsed: number;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockCreditTransaction: {
    id: string;
    userId: string;
    amount: number;
    type: string;
    balanceAfter: number;
    description: string;
    metadata: {};
    createdAt: Date;
};
export declare const mockPromoCode: {
    id: string;
    code: string;
    credits: number;
    isActive: boolean;
    expiresAt: Date;
    maxUses: number;
    usedCount: number;
};
export declare const createMockPrismaClient: () => {
    user: {
        findUnique: any;
        findMany: any;
        create: any;
        update: any;
        delete: any;
        deleteMany: any;
    };
    role: {
        findUnique: any;
        findMany: any;
        create: any;
        update: any;
        delete: any;
    };
    permission: {
        findMany: any;
        findUnique: any;
        create: any;
    };
    userRole: {
        findMany: any;
        findUnique: any;
        create: any;
        delete: any;
        deleteMany: any;
    };
    rolePermission: {
        findMany: any;
        createMany: any;
        delete: any;
    };
    creditAccount: {
        findUnique: any;
        create: any;
        update: any;
    };
    creditTransaction: {
        findMany: any;
        count: any;
        create: any;
    };
    promoCode: {
        findUnique: any;
        update: any;
    };
    promoCodeUsage: {
        findUnique: any;
        create: any;
    };
    $transaction: any;
    $connect: any;
    $disconnect: any;
    $queryRaw: any;
};
export declare const PrismaClient: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
//# sourceMappingURL=prisma.mock.d.ts.map