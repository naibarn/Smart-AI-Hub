// src/config/redis.js
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
  console.log('❌ Redis client disconnected');
});

/**
 * Connect to Redis
 */
const connectRedis = async () => {
  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

/**
 * Store refresh token in Redis
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @param {number} expiresIn - Expiration time in seconds (7 days = 604800 seconds)
 */
const storeRefreshToken = async (userId, refreshToken, expiresIn = 604800) => {
  const key = `refresh_token:${userId}`;
  await redisClient.setEx(key, expiresIn, refreshToken);
};

/**
 * Get refresh token from Redis
 * @param {string} userId - User ID
 * @returns {string|null} Refresh token or null if not found
 */
const getRefreshToken = async (userId) => {
  const key = `refresh_token:${userId}`;
  return await redisClient.get(key);
};

/**
 * Remove refresh token from Redis
 * @param {string} userId - User ID
 */
const removeRefreshToken = async (userId) => {
  const key = `refresh_token:${userId}`;
  await redisClient.del(key);
};

/**
 * Log failed login attempt
 * @param {string} email - Email address
 * @param {string} ip - IP address
 * @param {string} userAgent - User agent string
 */
const logFailedLogin = async (email, ip, userAgent) => {
  const key = `failed_login:${email}`;
  const timestamp = new Date().toISOString();
  const attemptData = {
    timestamp,
    ip,
    userAgent: userAgent || 'unknown'
  };
  
  // Store failed attempt with expiration (24 hours)
  await redisClient.lPush(key, JSON.stringify(attemptData));
  await redisClient.expire(key, 86400); // 24 hours
  
  // Increment counter for rate limiting
  const counterKey = `failed_login_counter:${email}`;
  const count = await redisClient.incr(counterKey);
  await redisClient.expire(counterKey, 3600); // 1 hour
  
  return count;
};

/**
 * Get failed login attempts count
 * @param {string} email - Email address
 * @returns {number} Number of failed attempts in the last hour
 */
const getFailedLoginAttempts = async (email) => {
  const counterKey = `failed_login_counter:${email}`;
  const count = await redisClient.get(counterKey);
  return parseInt(count) || 0;
};

/**
 * Add token to blacklist
 * @param {string} jti - JWT ID
 * @param {number} expiresIn - Expiration time in seconds
 */
const addToBlacklist = async (jti, expiresIn) => {
  const key = `blacklist:${jti}`;
  await redisClient.setEx(key, expiresIn, '1');
};

/**
 * Check if token is blacklisted
 * @param {string} jti - JWT ID
 * @returns {boolean} True if token is blacklisted
 */
const isTokenBlacklisted = async (jti) => {
  const key = `blacklist:${jti}`;
  const result = await redisClient.get(key);
  return result === '1';
};

/**
 * Disconnect Redis client
 */
const disconnectRedis = async () => {
  await redisClient.quit();
};

module.exports = {
  redisClient,
  connectRedis,
  storeRefreshToken,
  getRefreshToken,
  removeRefreshToken,
  addToBlacklist,
  isTokenBlacklisted,
  logFailedLogin,
  getFailedLoginAttempts,
  disconnectRedis
};