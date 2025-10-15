// src/controllers/user.controller.js
const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const webhookService = require('../services/webhook.service');

const prisma = new PrismaClient();

const userController = {
  /**
   * Get User Profile - ดึงข้อมูล profile ของ user
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.params.id || req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true
            }
          },
          profile: true,
          creditAccount: true
        }
      });

      if (!user) {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found', null, req.requestId);
      }

      // Transform the data to match expected format
      const profile = {
        id: user.id,
        email: user.email,
        username: user.profile?.firstName + ' ' + user.profile?.lastName,
        is_active: true, // Assuming active if exists
        created_at: user.createdAt,
        roles: user.roles.map(ur => ur.role.name),
        credit_balance: user.creditAccount?.balance || 0,
        full_name: user.profile?.firstName + ' ' + user.profile?.lastName,
        phone_number: user.profile?.phoneNumber,
        address: user.profile?.address,
        date_of_birth: user.profile?.dateOfBirth
      };

      return successResponse({ profile }, res, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update Profile - แก้ไขข้อมูล profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { full_name, phone_number, address, date_of_birth } = req.body;

      // Split full_name into first and last name
      const names = full_name ? full_name.split(' ') : [];
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';

      // Update or create profile
      const profile = await prisma.userProfile.upsert({
        where: { userId: userId },
        update: {
          firstName,
          lastName,
          phoneNumber: phone_number,
          address,
          dateOfBirth: date_of_birth ? new Date(date_of_birth) : null
        },
        create: {
          userId: userId,
          firstName,
          lastName,
          phoneNumber: phone_number,
          address,
          dateOfBirth: date_of_birth ? new Date(date_of_birth) : null
        }
      });

      // Trigger webhook for profile update
      webhookService.triggerProfileUpdated(req.user, {
        full_name,
        phone_number,
        address,
        date_of_birth,
      }).catch(error => {
        console.error('Failed to trigger user.profile_updated webhook:', error);
      });

      return successResponse({ profile }, res, 200, req.requestId, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * List All Users - แสดงรายการ users ทั้งหมด (admin only)
   */
  async listUsers(req, res, next) {
    try {
      const { page = 1, per_page = 20 } = req.query;
      const pageNum = parseInt(page);
      const perPageNum = parseInt(per_page);
      const skip = (pageNum - 1) * perPageNum;

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          skip: skip,
          take: perPageNum,
          include: {
            roles: {
              include: {
                role: true
              }
            },
            creditAccount: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.user.count()
      ]);

      // Transform the data to match expected format
      const transformedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.profile?.firstName + ' ' + user.profile?.lastName,
        is_active: true,
        created_at: user.createdAt,
        roles: user.roles.map(ur => ur.role.name),
        credit_balance: user.creditAccount?.balance || 0
      }));

      const totalPages = Math.ceil(totalCount / perPageNum);
      
      return paginatedResponse(
        transformedUsers,
        pageNum,
        perPageNum,
        totalCount,
        totalPages,
        res,
        req.requestId
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign Roles to User - มอบหมายบทบาทให้ผู้ใช้ (admin only)
   */
  async assignRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleNames } = req.body;

      if (!roleNames || !Array.isArray(roleNames)) {
        return errorResponse(res, 400, 'INVALID_INPUT', 'roleNames array is required', null, req.requestId);
      }

      // Find roles by names
      const roles = await prisma.role.findMany({
        where: { name: { in: roleNames } }
      });

      if (roles.length !== roleNames.length) {
        const foundNames = roles.map(r => r.name);
        const missingNames = roleNames.filter(name => !foundNames.includes(name));
        return errorResponse(res, 404, 'ROLES_NOT_FOUND', `Roles not found: ${missingNames.join(', ')}`, null, req.requestId);
      }

      // Remove existing roles
      await prisma.userRole.deleteMany({
        where: { userId: userId }
      });

      // Assign new roles
      await prisma.userRole.createMany({
        data: roles.map(role => ({
          userId: userId,
          roleId: role.id,
          assignedAt: new Date()
        }))
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      // Trigger webhook for role assignment
      webhookService.triggerRolesAssigned(updatedUser, updatedUser.roles.map(ur => ur.role)).catch(error => {
        console.error('Failed to trigger user.roles_assigned webhook:', error);
      });

      return successResponse({
        userId: updatedUser.id,
        roles: updatedUser.roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          assignedAt: ur.assignedAt
        }))
      }, res, 200, req.requestId, 'Roles assigned successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove Role from User - ถอนบทบาทจากผู้ใช้ (admin only)
   */
  async removeRole(req, res, next) {
    try {
      const { userId, roleName } = req.params;

      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        return errorResponse(res, 404, 'ROLE_NOT_FOUND', `Role '${roleName}' not found`, null, req.requestId);
      }

      await prisma.userRole.deleteMany({
        where: {
          userId: userId,
          roleId: role.id
        }
      });

      return successResponse(null, res, 200, req.requestId, `Role '${roleName}' removed from user successfully`);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get User Permissions - ดึงสิทธิ์ของผู้ใช้
   */
  async getUserPermissions(req, res, next) {
    try {
      const userId = req.params.id || req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user) {
        return errorResponse(res, 404, 'USER_NOT_FOUND', 'User not found', null, req.requestId);
      }

      // Extract all unique permissions from all roles
      const permissions = user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission)
      );

      // Remove duplicates based on permission id
      const uniquePermissions = permissions.filter((permission, index, self) =>
        index === self.findIndex(p => p.id === permission.id)
      );

      return successResponse({
        userId: user.id,
        permissions: uniquePermissions
      }, res, 200, req.requestId);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;