"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
describe('RBAC Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
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
    });
    describe('requirePermission', () => {
        test('should pass for admin user', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'admin@example.com',
                role: 'admin',
            };
            const middleware = (0, rbac_middleware_1.requirePermission)('users', 'delete');
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should pass for superadmin user', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'superadmin@example.com',
                role: 'superadmin',
            };
            const middleware = (0, rbac_middleware_1.requirePermission)('users', 'delete');
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should reject for non-admin user', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                role: 'user',
            };
            const middleware = (0, rbac_middleware_1.requirePermission)('users', 'delete');
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You need users:delete permission to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject when user is not authenticated', () => {
            // Setup
            mockRequest.user = undefined;
            const middleware = (0, rbac_middleware_1.requirePermission)('users', 'read');
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
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
        test('should pass when user has one of required roles', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'manager@example.com',
                role: 'manager',
            };
            const middleware = (0, rbac_middleware_1.requireRoles)(['admin', 'manager', 'user']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should reject when user does not have any required role', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'guest@example.com',
                role: 'guest',
            };
            const middleware = (0, rbac_middleware_1.requireRoles)(['admin', 'manager']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You need one of these roles: admin, manager to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject when user is not authenticated', () => {
            // Setup
            mockRequest.user = undefined;
            const middleware = (0, rbac_middleware_1.requireRoles)(['admin', 'manager']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should handle single role requirement', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'admin@example.com',
                role: 'admin',
            };
            const middleware = (0, rbac_middleware_1.requireRoles)(['admin']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
    describe('requireSelfOrRole', () => {
        test('should pass when user accessing their own resource via userId param', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                role: 'user',
            };
            mockRequest.params = {
                userId: 'user-123',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should pass when user accessing their own resource via id param', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                role: 'user',
            };
            mockRequest.params = {
                id: 'user-123',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should pass when user has required role for different user resource', () => {
            // Setup
            mockRequest.user = {
                id: 'admin-123',
                email: 'admin@example.com',
                role: 'admin',
            };
            mockRequest.params = {
                userId: 'user-456',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin', 'manager']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should reject when user accessing different user resource without required role', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                role: 'user',
            };
            mockRequest.params = {
                userId: 'user-456',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin', 'manager']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You can only access your own resources or need one of these roles: admin, manager',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject when user is not authenticated', () => {
            // Setup
            mockRequest.user = undefined;
            mockRequest.params = {
                userId: 'user-123',
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication required',
                message: 'You must be authenticated to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject when no user ID in params and user lacks required role', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                role: 'user',
            };
            mockRequest.params = {}; // No userId or id param
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You can only access your own resources or need one of these roles: admin',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should prioritize userId param over id param', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'user@example.com',
                role: 'user',
            };
            mockRequest.params = {
                userId: 'user-123', // This should match
                id: 'different-id', // This should be ignored
            };
            const middleware = (0, rbac_middleware_1.requireSelfOrRole)(['admin']);
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=rbac.middleware.test.js.map