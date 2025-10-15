import { Request, Response, NextFunction } from 'express';
import { requirePermission, requireRoles, requireSelfOrRole } from '../middlewares/rbac.middleware';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as permissionService from '../services/permission.service';

// Mock the permission service
jest.mock('../services/permission.service', () => ({
  hasPermission: jest.fn(),
}));

describe('RBAC Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockHasPermission: jest.MockedFunction<typeof permissionService.hasPermission>;

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
    mockHasPermission = permissionService.hasPermission as jest.MockedFunction<any>;
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
      const middleware = requirePermission('users', 'delete');

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requirePermission('users', 'delete');

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requirePermission('users', 'delete');

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requirePermission('users', 'read');

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireRoles(['admin', 'manager', 'user']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireRoles(['admin', 'manager']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireRoles(['admin', 'manager']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireRoles(['admin']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireSelfOrRole(['admin']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireSelfOrRole(['admin']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireSelfOrRole(['admin', 'manager']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireSelfOrRole(['admin', 'manager']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message:
          'You can only access your own resources or need one of these roles: admin, manager',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test('should reject when user is not authenticated', async () => {
      // Setup
      mockRequest.user = undefined;
      mockRequest.params = {
        userId: 'user-123',
      };
      const middleware = requireSelfOrRole(['admin']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireSelfOrRole(['admin']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

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
      const middleware = requireSelfOrRole(['admin']);

      // Execute
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
