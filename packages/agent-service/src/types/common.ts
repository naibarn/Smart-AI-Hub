// Common Types Used Across Services

export interface User {
  id: string;
  email: string;
  name: string;
  organizationId?: string;
  agencyId?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  allowPublicSharing: boolean;
  allowCrossAgencySharing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agency {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  allowPublicSharing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams extends PaginationParams, SortParams, FilterParams {
  q?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  agencyId?: string;
  iat: number;
  exp: number;
}

export interface RequestContext {
  user: User;
  requestId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    idle: number;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  r2: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  vectorize: {
    endpoint: string;
    apiToken: string;
  };
  workersAi: {
    endpoint: string;
    apiToken: string;
  };
}

export interface ServiceConfig {
  port: number;
  env: 'development' | 'staging' | 'production';
  database: DatabaseConfig;
  redis: RedisConfig;
  cloudflare: CloudflareConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  logging: {
    level: string;
    format: string;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    cloudflare: ServiceHealth;
  };
  uptime: number;
  version: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: any;
}

export interface Lock {
  key: string;
  ttl: number;
  acquired: boolean;
  acquiredAt?: Date;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  key?: string;
}

export interface QueueJob {
  id: string;
  type: string;
  data: Record<string, any>;
  options: {
    delay?: number;
    attempts?: number;
    backoff?: string;
  };
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export interface Metrics {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, number[]>;
  timers: Record<string, number>;
}

export interface Event {
  id: string;
  type: string;
  source: string;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: Date;
  signature: string;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  fields?: string[];
  filters?: FilterParams;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

// Error Codes
export enum ErrorCode {
  // General
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Authentication
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Authorization
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',

  // File Upload
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // RAG System
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  EMBEDDING_FAILED = 'EMBEDDING_FAILED',
  SEARCH_FAILED = 'SEARCH_FAILED',

  // Pricing
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  PRICING_NOT_FOUND = 'PRICING_NOT_FOUND',
  COST_CALCULATION_FAILED = 'COST_CALCULATION_FAILED',

  // Skills
  SKILL_NOT_FOUND = 'SKILL_NOT_FOUND',
  SKILL_ALREADY_INSTALLED = 'SKILL_ALREADY_INSTALLED',
  INSTALLATION_FAILED = 'INSTALLATION_FAILED',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}
