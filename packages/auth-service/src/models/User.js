// src/models/User.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const User = {
  /**
   * สร้าง User ใหม่
   */
  async create({ email, password, role_names = ['user'] }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find roles by names
    const roles = await prisma.role.findMany({
      where: { name: { in: role_names } }
    });

    if (roles.length !== role_names.length) {
      const foundNames = roles.map(r => r.name);
      const missingNames = role_names.filter(name => !foundNames.includes(name));
      throw new Error(`Roles not found: ${missingNames.join(', ')}`);
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        verified: false,  // Don't auto-verify, require email verification
        roles: {
          create: roles.map(role => ({
            roleId: role.id,
            assignedAt: new Date()
          }))
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return {
      id: user.id,
      email: user.email,
      verified: user.verified,
      createdAt: user.createdAt,
      roles: user.roles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        assignedAt: ur.assignedAt
      }))
    };
  },

  /**
   * หา User จาก email
   */
  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
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
        },
        profile: true
      }
    });

    if (user) {
      // Extract all permissions from all roles
      const permissions = user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission)
      );

      return {
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        verified: user.verified,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        roles: user.roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          assignedAt: ur.assignedAt
        })),
        permissions: permissions,
        profile: user.profile
      };
    }

    return null;
  },

  /**
   * หา User จาก ID
   */
  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id: id.toString() },
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

    if (user) {
      // Extract all permissions from all roles
      const permissions = user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission)
      );

      return {
        id: user.id,
        email: user.email,
        username: user.profile?.firstName + ' ' + user.profile?.lastName,
        is_active: true, // Assuming active if exists
        created_at: user.createdAt,
        roles: user.roles.map(ur => ur.role.name),
        permissions: permissions
      };
    }

    return null;
  },

  /**
   * หา User พร้อม Profile และ Credit
   */
  async findByIdWithDetails(id) {
    const user = await prisma.user.findUnique({
      where: { id: id.toString() },
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
        },
        profile: true,
        creditAccount: true
      }
    });

    if (user) {
      // Extract all permissions from all roles
      const permissions = user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission)
      );

      return {
        id: user.id,
        email: user.email,
        username: user.profile?.firstName + ' ' + user.profile?.lastName,
        is_active: true,
        created_at: user.createdAt,
        roles: user.roles.map(ur => ur.role.name),
        permissions: permissions,
        full_name: user.profile?.firstName + ' ' + user.profile?.lastName,
        phone_number: user.profile?.phoneNumber,
        address: user.profile?.address,
        date_of_birth: user.profile?.dateOfBirth,
        credit_balance: user.creditAccount?.balance || 0
      };
    }

    return null;
  },

  /**
   * อัปเดต User
   */
  async update(id, { username, is_active }) {
    const updateData = {};
    
    if (username !== undefined) {
      // Split username into first and last name for profile
      const names = username.split(' ');
      updateData.profile = {
        upsert: {
          create: {
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || ''
          },
          update: {
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || ''
          }
        }
      };
    }

    if (is_active !== undefined) {
      // In Prisma schema, we don't have is_active field, so we might need to add it
      // For now, we'll skip this part
    }

    const user = await prisma.user.update({
      where: { id: id.toString() },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true
          }
        },
        profile: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      username: user.profile?.firstName + ' ' + user.profile?.lastName,
      is_active: true,
      updated_at: user.updatedAt,
      roles: user.roles.map(ur => ur.role.name)
    };
  },

  /**
   * เปรียบเทียบ password
   */
  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword || '');
  },

  /**
   * ลบ User (soft delete)
   */
  async delete(id) {
    // In Prisma schema, we don't have is_active field for soft delete
    // For now, we'll actually delete the record
    const user = await prisma.user.delete({
      where: { id: id.toString() },
      select: { id: true }
    });

    return user;
  },

  /**
   * Update email verification status
   */
  async updateEmailVerified(userId, isVerified) {
    const user = await prisma.user.update({
      where: { id: userId.toString() },
      data: { verified: isVerified },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        profile: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      verified: user.verified,
      updated_at: user.updatedAt,
      profile: user.profile,
      roles: user.roles.map(ur => ur.role.name)
    };
  },

  /**
   * Update user password
   */
  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.update({
      where: { id: userId.toString() },
      data: { passwordHash: hashedPassword },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        profile: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      verified: user.verified,
      updated_at: user.updatedAt,
      profile: user.profile,
      roles: user.roles.map(ur => ur.role.name)
    };
  },

  /**
   * Assign roles to user
   */
  async assignRoles(userId, roleNames) {
    // Find roles by names
    const roles = await prisma.role.findMany({
      where: { name: { in: roleNames } }
    });

    if (roles.length !== roleNames.length) {
      const foundNames = roles.map(r => r.name);
      const missingNames = roleNames.filter(name => !foundNames.includes(name));
      throw new Error(`Roles not found: ${missingNames.join(', ')}`);
    }

    // Remove existing roles
    await prisma.userRole.deleteMany({
      where: { userId: userId.toString() }
    });

    // Assign new roles
    const userRoles = await prisma.userRole.createMany({
      data: roles.map(role => ({
        userId: userId.toString(),
        roleId: role.id,
        assignedAt: new Date()
      }))
    });

    return await this.findById(userId);
  },

  /**
   * Remove role from user
   */
  async removeRole(userId, roleName) {
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    await prisma.userRole.deleteMany({
      where: {
        userId: userId.toString(),
        roleId: role.id
      }
    });

    return await this.findById(userId);
  },

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId, resource, action) {
    const user = await prisma.user.findUnique({
      where: { id: userId.toString() },
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
      return false;
    }

    // Check if any of the user's roles have the required permission
    const hasPermission = user.roles.some(ur =>
      ur.role.permissions.some(rp =>
        rp.permission.resource === resource && rp.permission.action === action
      )
    );

    return hasPermission;
  },

  /**
   * Get user permissions
   */
  async getUserPermissions(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId.toString() },
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
      return [];
    }

    // Extract all unique permissions from all roles
    const permissions = user.roles.flatMap(ur => 
      ur.role.permissions.map(rp => rp.permission)
    );

    // Remove duplicates based on permission id
    const uniquePermissions = permissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    return uniquePermissions;
  }
};

module.exports = User;