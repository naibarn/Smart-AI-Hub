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
//# sourceMappingURL=services.mock.d.ts.map