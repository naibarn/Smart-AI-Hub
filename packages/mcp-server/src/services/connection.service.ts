/**
 * Connection Service
 * Manages WebSocket connection lifecycle and active connections
 */

import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ActiveConnection, ConnectionMetadata } from '../types/mcp.types';
import { UserInfo } from '../utils/jwt.util';
import { logger, logConnection } from '../utils/logger';

export class ConnectionService {
  private connections: Map<string, ActiveConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId → connectionIds

  /**
   * Create a new connection and add to tracking
   */
  public createConnection(ws: WebSocket, user: UserInfo): ActiveConnection {
    const connectionId = uuidv4();
    const now = new Date();

    const metadata: ConnectionMetadata = {
      userId: user.id,
      email: user.email,
      role: user.role,
      connectedAt: now,
      lastActivity: now,
      isAlive: true,
    };

    const connection: ActiveConnection = {
      id: connectionId,
      ws,
      metadata,
      pendingRequests: new Map(),
    };

    // Add to connections map
    this.connections.set(connectionId, connection);

    // Add to user connections map
    if (!this.userConnections.has(user.id)) {
      this.userConnections.set(user.id, new Set());
    }
    this.userConnections.get(user.id)!.add(connectionId);

    // Log connection creation
    logConnection(user.id, connectionId, 'connected', {
      email: user.email,
      role: user.role,
      totalConnections: this.connections.size,
    });

    // Set up WebSocket event handlers
    this.setupWebSocketHandlers(connection);

    return connection;
  }

  /**
   * Remove connection from tracking
   */
  public removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      logger.warn('Attempted to remove non-existent connection', { connectionId });
      return;
    }

    const { userId } = connection.metadata;

    // Remove from connections map
    this.connections.delete(connectionId);

    // Remove from user connections map
    const userConnIds = this.userConnections.get(userId);
    if (userConnIds) {
      userConnIds.delete(connectionId);
      if (userConnIds.size === 0) {
        this.userConnections.delete(userId);
      }
    }

    // Clean up pending requests
    connection.pendingRequests.clear();

    // Log connection removal
    logConnection(userId, connectionId, 'disconnected', {
      duration: Date.now() - connection.metadata.connectedAt.getTime(),
      pendingRequests: connection.pendingRequests.size,
      totalConnections: this.connections.size,
    });
  }

  /**
   * Get connection by ID
   */
  public getConnection(connectionId: string): ActiveConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections for a user
   */
  public getUserConnections(userId: string): ActiveConnection[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) {
      return [];
    }

    const connections: ActiveConnection[] = [];
    for (const connectionId of connectionIds) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        connections.push(connection);
      }
    }

    return connections;
  }

  /**
   * Get all active connections
   */
  public getAllConnections(): ActiveConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Update connection last activity
   */
  public updateActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.metadata.lastActivity = new Date();
      connection.metadata.isAlive = true;
    }
  }

  /**
   * Mark connection as alive (pong received)
   */
  public markAlive(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.metadata.isAlive = true;
    }
  }

  /**
   * Mark connection as not alive (for ping timeout)
   */
  public markNotAlive(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.metadata.isAlive = false;
    }
  }

  /**
   * Add pending request to connection
   */
  public addPendingRequest(connectionId: string, requestId: string, request: any): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.pendingRequests.set(requestId, request);
    }
  }

  /**
   * Remove pending request from connection
   */
  public removePendingRequest(connectionId: string, requestId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.pendingRequests.delete(requestId);
    }
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    totalConnections: number;
    totalUsers: number;
    totalPendingRequests: number;
    connectionsByRole: Record<string, number>;
  } {
    const connectionsByRole: Record<string, number> = {};
    let totalPendingRequests = 0;

    for (const connection of this.connections.values()) {
      const role = connection.metadata.role;
      connectionsByRole[role] = (connectionsByRole[role] || 0) + 1;
      totalPendingRequests += connection.pendingRequests.size;
    }

    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      totalPendingRequests,
      connectionsByRole,
    };
  }

  /**
   * Clean up dead connections (not alive)
   */
  public cleanupDeadConnections(): number {
    let cleaned = 0;
    const deadConnections: string[] = [];

    for (const [connectionId, connection] of this.connections.entries()) {
      if (!connection.metadata.isAlive) {
        deadConnections.push(connectionId);
      }
    }

    for (const connectionId of deadConnections) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        logger.info('Cleaning up dead connection', {
          connectionId,
          userId: connection.metadata.userId,
          lastActivity: connection.metadata.lastActivity,
        });

        // Terminate WebSocket if still open
        if (connection.ws.readyState === connection.ws.OPEN) {
          connection.ws.terminate();
        }

        this.removeConnection(connectionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up dead connections', { count: cleaned });
    }

    return cleaned;
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(connection: ActiveConnection): void {
    const { ws, id: connectionId } = connection;

    // Handle connection close
    ws.on('close', () => {
      this.removeConnection(connectionId);
    });

    // Handle connection error
    ws.on('error', (error: any) => {
      logger.error('WebSocket connection error', {
        connectionId,
        userId: connection.metadata.userId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.removeConnection(connectionId);
    });

    // Handle pong responses (for heartbeat)
    ws.on('pong', () => {
      this.markAlive(connectionId);
    });
  }

  /**
   * Send message to specific connection
   */
  public sendMessage(connectionId: string, message: any): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      logger.warn('Attempted to send message to non-existent connection', { connectionId });
      return false;
    }

    if (connection.ws.readyState !== connection.ws.OPEN) {
      logger.warn('Attempted to send message to closed connection', { connectionId });
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      connection.ws.send(messageStr);
      this.updateActivity(connectionId);
      return true;
    } catch (error) {
      logger.error('Error sending message to connection', {
        connectionId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Broadcast message to all user connections
   */
  public broadcastToUser(userId: string, message: any): number {
    const connections = this.getUserConnections(userId);
    let sent = 0;

    for (const connection of connections) {
      if (this.sendMessage(connection.id, message)) {
        sent++;
      }
    }

    return sent;
  }

  /**
   * Get connection metadata for monitoring
   */
  public getConnectionMetadata(connectionId: string): ConnectionMetadata | null {
    const connection = this.connections.get(connectionId);
    return connection ? connection.metadata : null;
  }
}

// Export singleton instance
export const connectionService = new ConnectionService();
