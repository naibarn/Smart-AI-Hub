import { WebSocketServer } from 'ws';
import { createServer, Server } from 'http';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { authenticateWebSocket } from '../utils/jwt.util';
import WebSocket from 'ws';

jest.mock('../utils/jwt.util', () => ({
  ...jest.requireActual('../utils/jwt.util'),
  authenticateWebSocket: jest.fn(),
}));

const mockedAuth = authenticateWebSocket as jest.Mock;

describe('WebSocket Server Integration', () => {
  let server: Server;
  let wss: WebSocketServer;
  let port: number;

  beforeAll((done) => {
    server = createServer();
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
      mockedAuth(req)
        .then((authResult: any) => {
          if (authResult) {
            ws.send('authenticated');
          } else {
            ws.terminate();
          }
        })
        .catch(() => ws.terminate());
    });

    server.listen(() => {
      port = (server.address() as any).port;
      done();
    });
  });

  afterAll(() => {
    wss.close();
    server.close();
  });

  it('should accept connection with valid JWT', (done) => {
    mockedAuth.mockResolvedValue({ user: { id: 'user-123' } });
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('message', (message) => {
      expect(message.toString()).toBe('authenticated');
      ws.close();
      done();
    });
  });

  it('should reject connection without JWT', (done) => {
    mockedAuth.mockResolvedValue(null);
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('close', (code) => {
      expect(code).toBe(1006); // Abnormal closure
      done();
    });
  });

  it('should reject connection with invalid JWT', (done) => {
    mockedAuth.mockRejectedValue(new Error('Invalid token'));
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('close', (code) => {
      expect(code).toBe(1006); // Abnormal closure
      done();
    });
  });

  it('should respond to ping with pong', (done) => {
    mockedAuth.mockResolvedValue({ user: { id: 'user-123' } });
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on('open', () => {
      let pongReceived = false;
      ws.on('pong', () => {
        pongReceived = true;
        ws.close();
        expect(pongReceived).toBe(true);
        done();
      });
      ws.ping();
    });
  });
});
