/**
 * WebSocket Room Durable Object
 * Manages real-time WebSocket connections for a simulation (class period)
 * Each period gets its own Durable Object instance
 */

import { DurableObject } from "cloudflare:workers";

// Message types for WebSocket communication
export interface WebSocketMessage {
  type: 'timeline_advance' | 'industry_change' | 'civilization_update' | 'student_join' | 'student_leave';
  data: any;
  timestamp: number;
}

// Attachment data stored with each WebSocket
interface ConnectionAttachment {
  studentId: string;
  civilizationId: string;
  connectedAt: number;
}

export class WebSocketRoom extends DurableObject {
  constructor(state: DurableObjectState, env: any) {
    super(state, env);
  }

  /**
   * Handle incoming WebSocket upgrade requests and broadcast messages
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle internal broadcast requests (from teacher timeline advance)
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      try {
        const message = await request.json() as WebSocketMessage;
        this.broadcast(message);
        return new Response('Broadcast sent', { status: 200 });
      } catch (error) {
        console.error('Broadcast error:', error);
        return new Response('Broadcast failed', { status: 500 });
      }
    }
    
    // Check if this is a WebSocket upgrade request
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Extract student and civilization IDs from query params
    const studentId = url.searchParams.get('studentId');
    const civilizationId = url.searchParams.get('civilizationId');
    
    if (!studentId || !civilizationId) {
      return new Response('Missing studentId or civilizationId', { status: 400 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection using Durable Object API (enables hibernation)
    this.ctx.acceptWebSocket(server);

    // Store connection metadata with the WebSocket
    const attachment: ConnectionAttachment = {
      studentId,
      civilizationId,
      connectedAt: Date.now()
    };
    server.serializeAttachment(attachment);

    // Notify other connections about new student
    this.broadcast({
      type: 'student_join',
      data: { studentId, civilizationId },
      timestamp: Date.now()
    });

    // Return the client-side WebSocket
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      // Parse message
      const msg = typeof message === 'string' 
        ? JSON.parse(message) as WebSocketMessage
        : null;

      if (!msg) return;

      // Get connection metadata
      const attachment = ws.deserializeAttachment() as ConnectionAttachment | null;
      
      // Handle different message types
      switch (msg.type) {
        case 'timeline_advance':
          // Broadcast timeline advancement to all connections
          this.broadcast(msg);
          break;
          
        case 'industry_change':
          // Broadcast industry changes to all connections
          this.broadcast(msg);
          break;
          
        case 'civilization_update':
          // Broadcast civilization updates to all connections
          this.broadcast(msg);
          break;
          
        default:
          console.log('Unknown message type:', msg.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close events
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    // Get connection metadata before closing
    const attachment = ws.deserializeAttachment() as ConnectionAttachment | null;
    
    if (attachment) {
      // Notify other connections about student leaving
      this.broadcast({
        type: 'student_leave',
        data: { 
          studentId: attachment.studentId, 
          civilizationId: attachment.civilizationId 
        },
        timestamp: Date.now()
      });
    }

    // Close the WebSocket
    ws.close(code, reason);
  }

  /**
   * Handle WebSocket error events
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    ws.close(1011, 'WebSocket error');
  }

  /**
   * Broadcast a message to all connected WebSockets in this room
   */
  private broadcast(message: WebSocketMessage): void {
    const sockets = this.ctx.getWebSockets();
    const messageStr = JSON.stringify(message);
    
    for (const socket of sockets) {
      try {
        socket.send(messageStr);
      } catch (error) {
        console.error('Error broadcasting to socket:', error);
      }
    }
  }

  /**
   * Get current connection count (for debugging/monitoring)
   */
  getConnectionCount(): number {
    return this.ctx.getWebSockets().length;
  }
}
