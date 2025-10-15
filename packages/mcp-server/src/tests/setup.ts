/**
 * Test Setup
 * Global test configuration and utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use test DB
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set up test timeout
jest.setTimeout(10000);

// Global test utilities
export const createMockJWT = (payload: any) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET);
};

export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'user',
});

export const createMockMCPRequest = () => ({
  id: 'test-request-id',
  type: 'completion',
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'user',
      content: 'Test message',
    },
  ],
  stream: false,
  maxTokens: 100,
  temperature: 0.7,
});

export const createMockWebSocket = () => {
  const mockWs = {
    send: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    terminate: jest.fn(),
    ping: jest.fn(),
    pong: jest.fn(),
    readyState: 1, // OPEN
    OPEN: 1,
    CLOSED: 3,
    CONNECTING: 0,
    CLOSING: 2,
    emit: jest.fn(),
  };
  mockWs.on.mockImplementation((event, listener) => {
    if (event === 'close') {
      mockWs.close = listener;
    }
    if (event === 'error') {
      // you might want to store this listener if you want to trigger it
    }
    if (event === 'pong') {
      // you might want to store this listener if you want to trigger it
    }
  });
  mockWs.emit.mockImplementation((event, ...args) => {
    const listeners = mockWs.on.mock.calls.filter((call) => call[0] === event);
    listeners.forEach((call) => call[1](...args));
  });
  return mockWs;
};

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  // Close any open connections
  // Clean up test data
});
