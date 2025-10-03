// src/models/User.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  /**
   * สร้าง User ใหม่
   */
  async create({ email, password, role_name = 'user' }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find role_id by name
    const { rows: roleRows } = await db.query(
      `SELECT id FROM roles WHERE name = $1`,
      [role_name]
    );
    if (!roleRows[0]) {
      throw new Error(`Role '${role_name}' not found`);
    }
    const role_id = roleRows[0].id;

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, role_id)
       VALUES ($1, $2, $3)
       RETURNING id, email, role_id, email_verified, created_at`,
      [email, hashedPassword, role_id]
    );

    return rows[0];
  },

  /**
   * หา User จาก email
   */
  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.role_id, u.email_verified, u.created_at, u.updated_at,
              r.name as role_name, r.permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );

    return rows[0];
  },

  /**
   * หา User จาก ID
   */
  async findById(id) {
    const { rows } = await db.query(
      `SELECT u.id, u.email, u.username, u.is_active, u.created_at,
              r.name as role_name, r.permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );
    
    return rows[0];
  },

  /**
   * หา User พร้อม Profile และ Credit
   */
  async findByIdWithDetails(id) {
    const { rows } = await db.query(
      `SELECT u.id, u.email, u.username, u.is_active, u.created_at,
              r.name as role_name, r.permissions,
              up.full_name, up.phone_number, up.address, up.date_of_birth,
              ca.balance as credit_balance, ca.total_earned, ca.total_spent
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN credit_accounts ca ON u.id = ca.user_id
       WHERE u.id = $1`,
      [id]
    );
    
    return rows[0];
  },

  /**
   * อัปเดต User
   */
  async update(id, { username, is_active }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      fields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (is_active !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const { rows } = await db.query(
      `UPDATE users 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, email, username, is_active, updated_at`,
      values
    );

    return rows[0];
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
    const { rows } = await db.query(
      `UPDATE users 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    
    return rows[0];
  }
};

module.exports = User;