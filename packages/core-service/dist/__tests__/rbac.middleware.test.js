"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const permissionService = __importStar(require("../services/permission.service"));
// Mock the permission service
jest.mock('../services/permission.service', () => ({
    hasPermission: jest.fn(),
}));
describe('RBAC Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
    let mockHasPermission;
    beforeEach(() => {
        mockRequest = {
            params: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
        // Mock the permission service
        mockHasPermission = permissionService.hasPermission;
    });
    describe('requirePermission', () => {
        test('should pass for admin user', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'admin@example.com',
                roles: ['admin'],
                permissions: ['users:delete'],
            };
            mockHasPermission.mockResolvedValue(true);
            const middleware = (0, rbac_middleware_1.requirePermission)('users', 'delete');
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockHasPermission).toHaveBeenCalledWith('user-123', 'users', 'delete');
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should pass for superadmin user', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'superadmin@example.com',
                roles: ['superadmin'],
                permissions: ['users:delete'],
            };
            mockHasPermission.mockResolvedValue(true);
            const middleware = (0, rbac_middleware_1.requirePermission)('users', 'delete');
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockHasPermission).toHaveBeenCalledWith('user-123', 'users', 'delete');
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should reject for non-admin user', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                roles: ['user'],
                permissions: [],
            };
            mockHasPermission.mockResolvedValue(false);
            const middleware = (0, rbac_middleware_1.requirePermission)('users', 'delete');
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockHasPermission).toHaveBeenCalledWith('user-123', 'users', 'delete');
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You need users:delete permission to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject when user is not authenticated', async () => {
            // Setup
            mockRequest.user = undefined;
            const middleware = (0, rbac_middleware_1.requirePermission)('users', 'read');
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
    describe('requireRoles', () => {
        test('should pass when user has one of required roles', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'manager@example.com',
                roles: ['manager'],
                permissions: [],
            };
            const middleware = (0, rbac_middleware_1.requireRoles)(['admin', 'manager', 'user']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should reject when user does not have any required role', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'guest@example.com',
                roles: ['guest'],
                permissions: [],
            };
            const middleware = (0, rbac_middleware_1.requireRoles)(['admin', 'manager']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You need one of these roles: admin, manager to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject when user is not authenticated', async () => {
            // Setup
            mockRequest.user = undefined;
            const middleware = (0, rbac_middleware_1.requireRoles)(['admin', 'manager']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should handle single role requirement', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'admin@example.com',
                roles: ['admin'],
                permissions: [],
            };
            const middleware = (0, rbac_middleware_1.requireRoles)(['admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
    describe('requireSelfOrRole', () => {
        test('should pass when user accessing their own resource via userId param', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                roles: ['user'],
                permissions: [],
            };
            mockRequest.params = {
                userId: 'user-123',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should pass when user accessing their own resource via id param', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                roles: ['user'],
                permissions: [],
            };
            mockRequest.params = {
                id: 'user-123',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should pass when user has required role for different user resource', async () => {
            // Setup
            mockRequest.user = {
                id: 'admin-123',
                email: 'admin@example.com',
                roles: ['admin'],
                permissions: [],
            };
            mockRequest.params = {
                userId: 'user-456',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin', 'manager']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should reject when user accessing different user resource without required role', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                roles: ['user'],
                permissions: [],
            };
            mockRequest.params = {
                userId: 'user-456',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin', 'manager']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You can only access your own resources or need one of these roles: admin, manager',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject when user is not authenticated', async () => {
            // Setup
            mockRequest.user = undefined;
            mockRequest.params = {
                userId: 'user-123',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject when no user ID in params and user lacks required role', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                roles: ['user'],
                permissions: [],
            };
            mockRequest.params = {}; // No userId or id param
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You can only access your own resources or need one of these roles: admin',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should prioritize userId param over id param', async () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                roles: ['user'],
                permissions: [],
            };
            mockRequest.params = {
                userId: 'user-123', // This should match
                id: 'different-id', // This should be ignored
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            await middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=rbac.middleware.test.js.map