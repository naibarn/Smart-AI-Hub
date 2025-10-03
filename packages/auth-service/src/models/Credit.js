// src/models/Credit.js
const db = require('../config/database');

const Credit = {
  /**
   * สร้าง Credit Account สำหรับ User ใหม่
   */
  async createAccount(user_id) {
    const { rows } = await db.query(
      `INSERT INTO credit_accounts (user_id, current_balance, total_purchased, total_used)
       VALUES ($1, 1, 0, 0)
       RETURNING *`,
      [user_id]
    );

    return rows[0];
  },

  /**
   * ดึงข้อมูล Credit Account
   */
  async getAccount(user_id) {
    const { rows } = await db.query(
      `SELECT * FROM credit_accounts WHERE user_id = $1`,
      [user_id]
    );
    
    return rows[0];
  },

  /**
   * เพิ่ม Credit (ซื้อ/ได้รับ)
   */
  async addCredits(user_id, amount, type = 'purchase', description = null) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // อัปเดต balance และ total_earned
      const { rows: accountRows } = await client.query(
        `UPDATE credit_accounts
         SET current_balance = current_balance + $1,
             total_purchased = total_purchased + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2
         RETURNING *`,
        [amount, user_id]
      );

      // บันทึก transaction
      const { rows: transactionRows } = await client.query(
        `INSERT INTO credit_transactions 
         (user_id, type, amount, balance_after, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, type, amount, accountRows[0].balance, description]
      );

      await client.query('COMMIT');
      
      return {
        account: accountRows[0],
        transaction: transactionRows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * ใช้ Credit
   */
  async useCredits(user_id, amount, description = null) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // ตรวจสอบ balance
      const { rows: checkRows } = await client.query(
        `SELECT current_balance FROM credit_accounts WHERE user_id = $1`,
        [user_id]
      );

      if (!checkRows[0] || checkRows[0].current_balance < amount) {
        throw new Error('Insufficient credits');
      }

      // อัปเดต balance และ total_spent
      const { rows: accountRows } = await client.query(
        `UPDATE credit_accounts
         SET current_balance = current_balance - $1,
             total_used = total_used + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2
         RETURNING *`,
        [amount, user_id]
      );

      // บันทึก transaction
      const { rows: transactionRows } = await client.query(
        `INSERT INTO credit_transactions 
         (user_id, type, amount, balance_after, description)
         VALUES ($1, 'usage', $2, $3, $4)
         RETURNING *`,
        [user_id, amount, accountRows[0].balance, description]
      );

      await client.query('COMMIT');
      
      return {
        account: accountRows[0],
        transaction: transactionRows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * ดึงประวัติ transactions
   */
  async getTransactions(user_id, limit = 50) {
    const { rows } = await db.query(
      `SELECT * FROM credit_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [user_id, limit]
    );
    
    return rows;
  }
};

module.exports = Credit;