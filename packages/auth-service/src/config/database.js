// src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart_ai_hub_dev',
  user: process.env.DB_USER || 'smart_ai_user',
  password: process.env.DB_PASSWORD || 'smart_ai_pass_2024',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Query helper
const query = (text, params) => pool.query(text, params);

// Get client for transactions
const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool
};