// Jest setup file for handling ES modules and other configurations

// Mock UUID to avoid ES module issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234-5678-9012'),
  v1: jest.fn(() => 'mock-uuid-v1-1234-5678-9012'),
  v3: jest.fn(() => 'mock-uuid-v3-1234-5678-9012'),
  v5: jest.fn(() => 'mock-uuid-v5-1234-5678-9012'),
  NIL: '00000000-0000-0000-0000-000000000000',
  version: jest.fn(() => 4),
  validate: jest.fn(() => true),
  stringify: jest.fn(() => 'mock-uuid-string'),
  parse: jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3001/api/auth/google/callback';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Increase timeout for async operations
jest.setTimeout(10000);