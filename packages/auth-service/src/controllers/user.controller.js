// src/controllers/user.controller.js
const db = require('../config/database');

const userController = {
  /**
   * Get User Profile - ดึงข้อมูล profile ของ user
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.params.id || req.user.id;

      const { rows } = await db.query(
        `SELECT 
          u.id, u.email, u.username, u.is_active, u.created_at,
          r.name as role_name,
          up.full_name, up.phone_number, up.address, up.date_of_birth,
          ca.balance as credit_balance
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         LEFT JOIN credit_accounts ca ON u.id = ca.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }

      res.json({
        success: true,
        data: { profile: rows[0] }
      });
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

      // ตรวจสอบว่ามี profile อยู่แล้วหรือไม่
      const { rows: existingProfile } = await db.query(
        `SELECT * FROM user_profiles WHERE user_id = $1`,
        [userId]
      );

      let result;

      if (existingProfile.length === 0) {
        // สร้าง profile ใหม่
        const { rows } = await db.query(
          `INSERT INTO user_profiles (user_id, full_name, phone_number, address, date_of_birth)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [userId, full_name, phone_number, address, date_of_birth]
        );
        result = rows[0];
      } else {
        // อัปเดต profile ที่มีอยู่
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (full_name !== undefined) {
          fields.push(`full_name = $${paramCount}`);
          values.push(full_name);
          paramCount++;
        }
        if (phone_number !== undefined) {
          fields.push(`phone_number = $${paramCount}`);
          values.push(phone_number);
          paramCount++;
        }
        if (address !== undefined) {
          fields.push(`address = $${paramCount}`);
          values.push(address);
          paramCount++;
        }
        if (date_of_birth !== undefined) {
          fields.push(`date_of_birth = $${paramCount}`);
          values.push(date_of_birth);
          paramCount++;
        }

        if (fields.length === 0) {
          return res.status(400).json({
            success: false,
            error: { message: 'No fields to update' }
          });
        }

        values.push(userId);

        const { rows } = await db.query(
          `UPDATE user_profiles 
           SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $${paramCount}
           RETURNING *`,
          values
        );
        result = rows[0];
      }

      res.json({
        success: true,
        data: { profile: result },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * List All Users - แสดงรายการ users ทั้งหมด (admin only)
   */
  async listUsers(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { rows } = await db.query(
        `SELECT 
          u.id, u.email, u.username, u.is_active, u.created_at,
          r.name as role_name,
          ca.balance as credit_balance
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN credit_accounts ca ON u.id = ca.user_id
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const { rows: countRows } = await db.query(
        `SELECT COUNT(*) FROM users`
      );

      res.json({
        success: true,
        data: {
          users: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countRows[0].count)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;