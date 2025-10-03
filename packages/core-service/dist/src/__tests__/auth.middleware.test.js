"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
// Mock jwt module
jest.mock('jsonwebtoken');
const mockedJwt = jsonwebtoken_1.default;
describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
    beforeEach(() => {
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });
    describe('authenticateJWT', () => {
        const mockToken = 'valid.jwt.token';
        const mockPayload = {
            sub: 'user-123',
            email: 'test@example.com',
            role: 'user',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            jti: 'token-id',
        };
        test('should pass with valid Bearer token', async () => {
            // Setup
            mockRequest.headers = {
                authorization: `Bearer ${mockToken}`,
            };
            mockedJwt.verify.mockReturnValue(mockPayload);
            // Execute
            await (0, auth_middleware_1.authenticateJWT)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
            expect(mockRequest.user).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                role: 'user',
            });
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should reject request with no Authorization header', async () => {
            // Execute
            await (0, auth_middleware_1.authenticateJWT)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Access denied',
                message: 'No token provided or invalid format',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject request with invalid Authorization header format', async () => {
            // Setup
            mockRequest.headers = {
                authorization: 'InvalidFormat token',
            };
            // Execute
            await (0, auth_middleware_1.authenticateJWT)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Access denied',
                message: 'No token provided or invalid format',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject request with expired token', async () => {
            // Setup
            mockRequest.headers = {
                authorization: `Bearer ${mockToken}`,
            };
            const expiredError = new jsonwebtoken_1.default.TokenExpiredError('jwt expired', new Date());
            mockedJwt.verify.mockImplementation(() => {
                throw expiredError;
            });
            // Execute
            await (0, auth_middleware_1.authenticateJWT)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Token expired',
                message: 'Your token has expired. Please login again.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject request with invalid token', async () => {
            // Setup
            mockRequest.headers = {
                authorization: `Bearer ${mockToken}`,
            };
            const invalidError = new jsonwebtoken_1.default.JsonWebTokenError('invalid signature');
            mockedJwt.verify.mockImplementation(() => {
                throw invalidError;
            });
            // Execute
            await (0, auth_middleware_1.authenticateJWT)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid token',
                message: 'The provided token is invalid.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should reject request with token verification error', async () => {
            // Setup
            mockRequest.headers = {
                authorization: `Bearer ${mockToken}`,
            };
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('Unexpected error');
            });
            // Execute
            await (0, auth_middleware_1.authenticateJWT)(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Token verification failed',
                message: 'Failed to verify the provided token.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        test('should handle unexpected errors gracefully', async () => {
            // Setup
            mockRequest.headers = {
                authorization: `Bearer ${mockToken}`,
            };
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('Unexpected error');
            });
            // Mock console.error to avoid noise in test output
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            // Execute
            await (0, auth_middleware_1.authenticateJWT)(mockRequest, mockResponse, nextFunction);
            // Assert - Check that error response was sent (console logging is optional)
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Token verification failed',
                message: 'Failed to verify the provided token.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
            // Restore console.error
            consoleSpy.mockRestore();
        });
    });
    describe('requireRole', () => {
        test('should pass when user has required role', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'admin',
            };
            const middleware = (0, auth_middleware_1.requireRole)('admin');
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        test('should reject when user is not authenticated', () => {
            // Setup
            mockRequest.user = undefined;
            const middleware = (0, auth_middleware_1.requireRole)('admin');
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
        test('should reject when user does not have required role', () => {
            // Setup
            mockRequest.user = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'user',
            };
            const middleware = (0, auth_middleware_1.requireRole)('admin');
            // Execute
            middleware(mockRequest, mockResponse, nextFunction);
            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                message: 'You need admin role to access this resource.',
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=auth.middleware.test.js.map