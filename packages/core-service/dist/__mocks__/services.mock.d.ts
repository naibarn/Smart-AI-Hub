export declare const createMockCreditService: () => {
    getBalance: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getHistory: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    redeemPromo: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    adjustCredits: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const createMockPermissionService: () => {
    hasPermission: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getUserRoles: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getUserPermissions: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    assignRole: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    removeRole: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getAllRoles: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getAllPermissions: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    createRole: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    clearUserPermissionCache: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const createMockPointService: () => {
    getBalance: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getTransactionHistory: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    exchangeFromCredits: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    claimDailyReward: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getDailyRewardStatus: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    deductPoints: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getExchangeRates: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    updateExchangeRate: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getPointsStatistics: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getAutoTopupStatistics: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const setupCreditServiceDefaults: (mockCreditService: any) => void;
export declare const setupMockUserWithRoles: (userId: string, roleNames: string[]) => void;
export declare const resetPermissionMocks: () => void;
export declare const setupPermissionServiceDefaults: (mockPermissionService: any) => void;
export declare const mockCreditService: {
    getBalance: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getHistory: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    redeemPromo: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    adjustCredits: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const mockPermissionService: {
    hasPermission: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getUserRoles: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getUserPermissions: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    assignRole: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    removeRole: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getAllRoles: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getAllPermissions: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    createRole: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    clearUserPermissionCache: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const mockPointService: {
    getBalance: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getTransactionHistory: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    exchangeFromCredits: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    claimDailyReward: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getDailyRewardStatus: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    deductPoints: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getExchangeRates: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    updateExchangeRate: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getPointsStatistics: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getAutoTopupStatistics: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const setupPointServiceDefaults: (mockPointService: any) => void;
//# sourceMappingURL=services.mock.d.ts.map