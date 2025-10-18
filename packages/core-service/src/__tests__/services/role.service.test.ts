import { PrismaClient } from '@prisma/client';
import * as roleService from '../../services/role.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

describe('Role Service', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('getAllRoles', () => {
    it('should return all roles successfully', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'role-2',
          name: 'user',
          description: 'Regular user role',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.role.findMany as jest.Mock).mockResolvedValue(mockRoles);

      const result = await roleService.getAllRoles();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRoles);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });

    it('should handle database errors', async () => {
      (prisma.role.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await roleService.getAllRoles();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get roles');
    });
  });

  describe('getRoleById', () => {
    it('should return role by ID successfully', async () => {
      const roleId = 'role-1';
      const mockRole = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);

      const result = await roleService.getRoleById(roleId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRole);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
      });
    });

    it('should return error when role not found', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await roleService.getRoleById('non-existent-role');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role not found');
    });

    it('should handle database errors', async () => {
      (prisma.role.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await roleService.getRoleById('role-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get role');
    });
  });

  describe('createRole', () => {
    it('should create role successfully', async () => {
      const name = 'moderator';
      const description = 'Moderator role';

      const mockCreatedRole = {
        id: 'new-role-id',
        name,
        description,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null); // Role name not in use
      (prisma.role.create as jest.Mock).mockResolvedValue(mockCreatedRole);

      const result = await roleService.createRole(name, description);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedRole);
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          isSystem: false,
        },
      });
    });

    it('should return error if role name already exists', async () => {
      const name = 'admin';
      const description = 'Administrator role';

      (prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-role' });

      const result = await roleService.createRole(name, description);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role with this name already exists');
    });

    it('should handle database errors when creating role', async () => {
      const name = 'new-role';
      const description = 'New role';

      (prisma.role.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await roleService.createRole(name, description);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create role');
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const roleId = 'role-1';
      const name = 'updated-role';
      const description = 'Updated description';

      const mockExistingRole = {
        id: roleId,
        name: 'old-role',
        description: 'Old description',
        isSystem: false,
      };

      const mockUpdatedRole = {
        ...mockExistingRole,
        name,
        description,
        updatedAt: new Date(),
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockExistingRole);
      (prisma.role.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate name
      (prisma.role.update as jest.Mock).mockResolvedValue(mockUpdatedRole);

      const result = await roleService.updateRole(roleId, name, description);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedRole);
    });

    it('should return error if role not found', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await roleService.updateRole('non-existent-role', 'updated');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role not found');
    });

    it('should return error if trying to update system role', async () => {
      const mockSystemRole = {
        id: 'role-1',
        name: 'admin',
        isSystem: true,
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockSystemRole);

      const result = await roleService.updateRole('role-1', 'updated');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot modify system roles');
    });

    it('should handle database errors when updating role', async () => {
      (prisma.role.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await roleService.updateRole('role-1', 'updated');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update role');
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', async () => {
      const roleId = 'role-1';
      const mockRole = {
        id: roleId,
        name: 'test-role',
        isSystem: false,
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prisma.userRole.count as jest.Mock).mockResolvedValue(0); // No users assigned
      (prisma.role.delete as jest.Mock).mockResolvedValue(mockRole);

      const result = await roleService.deleteRole(roleId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should return error if role not found', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await roleService.deleteRole('non-existent-role');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role not found');
    });

    it('should return error if trying to delete system role', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'admin',
        isSystem: true,
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);

      const result = await roleService.deleteRole('role-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete system roles');
    });

    it('should return error if role is assigned to users', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'test-role',
        isSystem: false,
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prisma.userRole.count as jest.Mock).mockResolvedValue(2); // Users assigned

      const result = await roleService.deleteRole('role-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete role that is assigned to users');
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      const mockUser = { id: userId };
      const mockRole = { id: roleId, name: 'test-role' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prisma.userRole.findUnique as jest.Mock).mockResolvedValue(null); // Role not already assigned
      (prisma.userRole.create as jest.Mock).mockResolvedValue({ userId, roleId });

      const result = await roleService.assignRoleToUser(userId, roleId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ userId, roleId });
    });

    it('should return error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await roleService.assignRoleToUser('non-existent-user', 'role-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error if role not found', async () => {
      const mockUser = { id: 'user-1' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await roleService.assignRoleToUser('user-1', 'non-existent-role');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role not found');
    });

    it('should return error if role already assigned to user', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      const mockUser = { id: userId };
      const mockRole = { id: roleId, name: 'test-role' };
      const mockUserRole = { userId, roleId };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prisma.userRole.findUnique as jest.Mock).mockResolvedValue(mockUserRole); // Role already assigned

      const result = await roleService.assignRoleToUser(userId, roleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role is already assigned to this user');
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user successfully', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      const mockUser = { id: userId };
      const mockRole = { id: roleId, name: 'test-role' };
      const mockUserRole = { userId, roleId };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prisma.userRole.findUnique as jest.Mock).mockResolvedValue(mockUserRole); // Role is assigned
      (prisma.userRole.delete as jest.Mock).mockResolvedValue(mockUserRole);

      const result = await roleService.removeRoleFromUser(userId, roleId);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should return error if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await roleService.removeRoleFromUser('non-existent-user', 'role-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error if role not found', async () => {
      const mockUser = { id: 'user-1' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await roleService.removeRoleFromUser('user-1', 'non-existent-role');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role not found');
    });

    it('should return error if role not assigned to user', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      const mockUser = { id: userId };
      const mockRole = { id: roleId, name: 'test-role' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prisma.userRole.findUnique as jest.Mock).mockResolvedValue(null); // Role not assigned

      const result = await roleService.removeRoleFromUser(userId, roleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Role is not assigned to this user');
    });
  });

  describe('getUserRoles', () => {
    it('should get user roles successfully', async () => {
      const userId = 'user-1';
      const mockUserRoles = [
        {
          id: 'ur-1',
          userId,
          roleId: 'role-1',
          assignedAt: new Date(),
          role: {
            id: 'role-1',
            name: 'admin',
            description: 'Administrator role',
          },
        },
        {
          id: 'ur-2',
          userId,
          roleId: 'role-2',
          assignedAt: new Date(),
          role: {
            id: 'role-2',
            name: 'user',
            description: 'Regular user role',
          },
        },
      ];

      const mockRoles = [
        {
          id: 'role-1',
          name: 'admin',
          description: 'Administrator role',
        },
        {
          id: 'role-2',
          name: 'user',
          description: 'Regular user role',
        },
      ];

      (prisma.userRole.findMany as jest.Mock).mockResolvedValue(mockUserRoles);

      const result = await roleService.getUserRoles(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRoles);
      expect(prisma.userRole.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          role: true,
        },
      });
    });

    it('should handle database errors', async () => {
      (prisma.userRole.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await roleService.getUserRoles('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get user roles');
    });
  });
});
