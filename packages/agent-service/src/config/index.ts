import { ServiceConfig } from '@/types';

const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '3001'),
  env: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'agent_service',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idle: parseInt(process.env.DB_POOL_IDLE || '30000')
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'agent_service:'
  },
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    r2: {
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || '',
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || ''
    },
    vectorize: {
      endpoint: process.env.CLOUDFLARE_VECTORIZER_ENDPOINT || '',
      apiToken: process.env.CLOUDFLARE_VECTORIZER_API_TOKEN || ''
    },
    workersAi: {
      endpoint: process.env.CLOUDFLARE_WORKERS_AI_ENDPOINT || '',
      apiToken: process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN || ''
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};

export { config };