/**
 * Connection Service Tests
 */

import { ConnectionService } from '../services/connection.service';
import { createMockUser, createMockWebSocket } from './setup';

describe('ConnectionService', () => {
  let connectionService: ConnectionService;
  let mockWs: any;
  let mockUser: any;

  beforeEach(() => {
    connectionService = new ConnectionService();
    mockWs = createMockWebSocket();
    mockUser = createMockUser();
  });

  describe('createConnection', () => {
    it('should create a new connection', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);

      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.ws).toBe(mockWs);
      expect(connection.metadata.userId).toBe(mockUser.id);
      expect(connection.metadata.email).toBe(mockUser.email);
      expect(connection.metadata.role).toBe(mockUser.role);
    });

    it('should track connection in connections map', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);

      const retrievedConnection = connectionService.getConnection(connection.id);
      expect(retrievedConnection).toBe(connection);
    });

    it('should track user connections', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);

      const userConnections = connectionService.getUserConnections(mockUser.id);
      expect(userConnections).toHaveLength(1);
      expect(userConnections[0]).toBe(connection);
    });
  });

  describe('removeConnection', () => {
    it('should remove connection from tracking', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);

      connectionService.removeConnection(connection.id);

      const retrievedConnection = connectionService.getConnection(connection.id);
      expect(retrievedConnection).toBeUndefined();
    });

    it('should remove from user connections', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);

      connectionService.removeConnection(connection.id);

      const userConnections = connectionService.getUserConnections(mockUser.id);
      expect(userConnections).toHaveLength(0);
    });
    it('should not throw when removing a non-existent connection', () => {
      // This should not throw an error
      connectionService.removeConnection('non-existent-id');
    });
  });

  describe('getStats', () => {
    it('should return connection statistics', () => {
      connectionService.createConnection(mockWs, mockUser);

      const stats = connectionService.getStats();

      expect(stats.totalConnections).toBe(1);
      expect(stats.totalUsers).toBe(1);
      expect(stats.totalPendingRequests).toBe(0);
      expect(stats.connectionsByRole).toEqual({
        user: 1,
      });
    });
  });

  describe('getAllConnections', () => {
    it('should return all active connections', () => {
      connectionService.createConnection(createMockWebSocket() as any, createMockUser());
      connectionService.createConnection(createMockWebSocket() as any, createMockUser());
      const allConnections = connectionService.getAllConnections();
      expect(allConnections).toHaveLength(2);
    });
  });

  describe('updateActivity', () => {
    it('should update connection last activity', async () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      const originalActivity = connection.metadata.lastActivity;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 20));

      connectionService.updateActivity(connection.id);

      expect(connection.metadata.lastActivity.getTime()).toBeGreaterThan(
        originalActivity.getTime()
      );
    });
  });

  describe('markAlive and markNotAlive', () => {
    it('should mark a connection as alive', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      connection.metadata.isAlive = false;
      connectionService.markAlive(connection.id);
      expect(connection.metadata.isAlive).toBe(true);
    });

    it('should mark a connection as not alive', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      connection.metadata.isAlive = true;
      connectionService.markNotAlive(connection.id);
      expect(connection.metadata.isAlive).toBe(false);
    });
  });

  describe('Pending Requests', () => {
    it('should add and remove a pending request', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      const requestId = 'req-1';
      const request = { data: 'test' };

      connectionService.addPendingRequest(connection.id, requestId, request);
      expect(connection.pendingRequests.get(requestId)).toBe(request);

      connectionService.removePendingRequest(connection.id, requestId);
      expect(connection.pendingRequests.has(requestId)).toBe(false);
    });
  });

  describe('cleanupDeadConnections', () => {
    it('should remove dead connections', () => {
      const conn1 = connectionService.createConnection(
        createMockWebSocket() as any,
        createMockUser()
      );
      const conn2 = connectionService.createConnection(
        createMockWebSocket() as any,
        createMockUser()
      );

      connectionService.markNotAlive(conn1.id);
      (conn1.ws.readyState as any) = mockWs.CLOSED; // Simulate closed WebSocket

      const cleanedCount = connectionService.cleanupDeadConnections();
      expect(cleanedCount).toBe(1);
      expect(connectionService.getConnection(conn1.id)).toBeUndefined();
      expect(connectionService.getConnection(conn2.id)).toBeDefined();
    });
  });

  describe('WebSocket Handlers', () => {
    it('should remove connection on "close" event', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      mockWs.emit('close');
      expect(connectionService.getConnection(connection.id)).toBeUndefined();
    });

    it('should remove connection on "error" event', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      mockWs.emit('error', new Error('Test Error'));
      expect(connectionService.getConnection(connection.id)).toBeUndefined();
    });

    it('should mark connection as alive on "pong" event', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      connection.metadata.isAlive = false;
      mockWs.emit('pong');
      expect(connection.metadata.isAlive).toBe(true);
    });
  });

  describe('sendMessage', () => {
    it('should send message to connection', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      const message = { test: 'message' };

      mockWs.send = jest.fn();
      mockWs.readyState = mockWs.OPEN;

      const result = connectionService.sendMessage(connection.id, message);

      expect(result).toBe(true);
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should return false for non-existent connection', () => {
      const result = connectionService.sendMessage('non-existent-id', { test: 'message' });

      expect(result).toBe(false);
    });
    it('should return false if connection is closed', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      mockWs.readyState = mockWs.CLOSED;
      const result = connectionService.sendMessage(connection.id, { test: 'message' });
      expect(result).toBe(false);
    });

    it('should handle JSON stringify error', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      mockWs.readyState = mockWs.OPEN;
      const circularMessage = { a: {} };
      circularMessage.a = circularMessage; // Create circular reference

      const result = connectionService.sendMessage(connection.id, circularMessage);
      expect(result).toBe(false);
    });
  });

  describe('broadcastToUser', () => {
    it('should send a message to all connections for a user', () => {
      const ws1 = createMockWebSocket() as any;
      const ws2 = createMockWebSocket() as any;
      connectionService.createConnection(ws1, mockUser);
      connectionService.createConnection(ws2, mockUser);

      ws1.readyState = ws1.OPEN;
      ws2.readyState = ws2.OPEN;
      ws1.send = jest.fn();
      ws2.send = jest.fn();

      const sentCount = connectionService.broadcastToUser(mockUser.id, { test: 'broadcast' });
      expect(sentCount).toBe(2);
      expect(ws1.send).toHaveBeenCalled();
      expect(ws2.send).toHaveBeenCalled();
    });
  });

  describe('getConnectionMetadata', () => {
    it('should return metadata for a connection', () => {
      const connection = connectionService.createConnection(mockWs, mockUser);
      const metadata = connectionService.getConnectionMetadata(connection.id);
      expect(metadata).toBe(connection.metadata);
    });

    it('should return null for a non-existent connection', () => {
      const metadata = connectionService.getConnectionMetadata('non-existent-id');
      expect(metadata).toBeNull();
    });
  });
});
