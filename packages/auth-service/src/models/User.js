// src/models/User.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const User = {
  /**
   * สร้าง User ใหม่
   */
  async create({ email, password, role_name = 'user' }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find role by name
    const role = await prisma.role.findUnique({
      where: { name: role_name }
    });

    if (!role) {
      throw new Error(`Role '${role_name}' not found`);
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        roleId: role.id,
        emailVerified: false  // Don't auto-verify, require email verification
      },
      select: {
        id: true,
        email: true,
        roleId: true,
        emailVerified: true,
        createdAt: true
      }
    });

    return user;
  },

  /**
   * หา User จาก email
   */
  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        profile: true
      }
    });

    if (user) {
      // Transform to match existing structure
      return {
        id: user.id,
        email: user.email,
        password_hash: user.passwordHash,
        role_id: user.roleId,
        email_verified: user.emailVerified,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        role_name: user.role?.name,
        permissions: user.role?.permissions,
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
        role: true
      }
    });

    if (user) {
      return {
        id: user.id,
        email: user.email,
        username: user.profile?.firstName + ' ' + user.profile?.lastName,
        is_active: true, // Assuming active if exists
        created_at: user.createdAt,
        role_name: user.role?.name,
        permissions: user.role?.permissions
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
        role: true,
        profile: true,
        creditAccount: true
      }
    });

    if (user) {
      return {
        id: user.id,
        email: user.email,
        username: user.profile?.firstName + ' ' + user.profile?.lastName,
        is_active: true,
        created_at: user.createdAt,
        role_name: user.role?.name,
        permissions: user.role?.permissions,
        full_name: user.profile?.firstName + ' ' + user.profile?.lastName,
        phone_number: user.profile?.phoneNumber,
        address: user.profile?.address,
        date_of_birth: user.profile?.dateOfBirth,
        credit_balance: user.creditAccount?.currentBalance || 0,
        total_earned: user.creditAccount?.totalPurchased || 0,
        total_spent: user.creditAccount?.totalUsed || 0
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
        role: true,
        profile: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      username: user.profile?.firstName + ' ' + user.profile?.lastName,
      is_active: true,
      updated_at: user.updatedAt
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
      data: { emailVerified: isVerified },
      include: {
        role: true,
        profile: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      email_verified: user.emailVerified,
      updated_at: user.updatedAt,
      profile: user.profile
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
        role: true,
        profile: true
      }
    });

    return {
      id: user.id,
      email: user.email,
      email_verified: user.emailVerified,
      updated_at: user.updatedAt,
      profile: user.profile
    };
  }
};

module.exports = User;