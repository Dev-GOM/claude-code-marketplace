/**
 * Unity WebSocket Client
 *
 * WebSocket client for communicating with Unity Editor via JSON-RPC 2.0 protocol.
 */

import WebSocket from 'ws';
import { UNITY, JSONRPC } from '@/constants';
import * as logger from '@/utils/logger';
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCErrorResponse,
  isErrorResponse,
} from './protocol';

/**
 * Custom error class for Unity RPC errors
 */
export class UnityRPCError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = 'UnityRPCError';
    this.code = code;
    this.data = data;
  }
}

/**
 * Pending request information
 */
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
  method: string;
}

/**
 * Unity WebSocket Client
 */
export class UnityWebSocketClient {
  private ws: WebSocket | null = null;
  private connected = false;
  private host: string;
  private port: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = UNITY.MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = UNITY.RECONNECT_DELAY;
  private pendingRequests = new Map<string | number, PendingRequest>();
  private requestIdCounter = 0;

  /**
   * Create Unity WebSocket Client
   */
  constructor(port: number, host: string = UNITY.LOCALHOST) {
    // Validate port range (security: prevent invalid connections)
    if (port < UNITY.DEFAULT_PORT || port > UNITY.MAX_PORT) {
      throw new Error(`Port must be between ${UNITY.DEFAULT_PORT} and ${UNITY.MAX_PORT}`);
    }

    // Validate host (security: only allow localhost)
    if (host !== '127.0.0.1' && host !== 'localhost') {
      throw new Error('Only localhost connections are allowed');
    }

    this.host = host;
    this.port = port;
  }

  /**
   * Connect to Unity Editor WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${this.host}:${this.port}`;
      logger.debug(`Connecting to Unity Editor at ${wsUrl}...`);

      const ws = new WebSocket(wsUrl, {
        handshakeTimeout: UNITY.CONNECT_TIMEOUT,
      });

      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.terminate();
          reject(new Error(`Connection timeout after ${UNITY.CONNECT_TIMEOUT}ms`));
        }
      }, UNITY.CONNECT_TIMEOUT);

      ws.on('open', () => {
        clearTimeout(timeout);
        this.ws = ws;
        this.connected = true;
        this.reconnectAttempts = 0;
        logger.info('✓ Connected to Unity Editor');
        resolve();
      });

      ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeout);
        logger.error('WebSocket error', error);
        if (!this.connected) {
          reject(error);
        }
      });

      ws.on('close', (code: number, reason: string) => {
        clearTimeout(timeout);
        this.connected = false;
        logger.warn(`WebSocket closed (code: ${code}, reason: ${reason})`);

        // Reject all pending requests
        this.rejectAllPendingRequests(new Error('WebSocket connection closed'));

        // Auto-reconnect if needed
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      });
    });
  }

  /**
   * Disconnect from Unity Editor
   */
  disconnect(): void {
    if (this.ws) {
      // Reject all pending requests before closing
      this.rejectAllPendingRequests(new Error('Client disconnected'));

      // Close WebSocket connection
      this.ws.close();

      // Remove all event listeners
      this.ws.removeAllListeners();

      this.ws = null;
      this.connected = false;

      // Prevent reconnection
      this.reconnectAttempts = this.maxReconnectAttempts;

      logger.info('Disconnected from Unity Editor');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Send JSON-RPC request to Unity Editor
   */
  async sendRequest<T = unknown>(method: string, params?: unknown, timeout?: number): Promise<T> {
    // Validate input parameters
    if (!method || typeof method !== 'string' || method.trim() === '') {
      throw new UnityRPCError('Method name is required and must be a non-empty string', JSONRPC.INVALID_PARAMS);
    }

    if (timeout !== undefined && (typeof timeout !== 'number' || timeout <= 0)) {
      throw new UnityRPCError('Timeout must be a positive number', JSONRPC.INVALID_PARAMS);
    }

    if (!this.isConnected()) {
      throw new UnityRPCError('Not connected to Unity Editor', JSONRPC.UNITY_NOT_CONNECTED);
    }

    const requestId = `req_${++this.requestIdCounter}`;
    const request: JSONRPCRequest = {
      jsonrpc: JSONRPC.VERSION,
      id: requestId,
      method: method.trim(),
      params,
    };

    return new Promise((resolve, reject) => {
      const requestTimeout = timeout || UNITY.COMMAND_TIMEOUT;
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);

        // Log timeout with detailed information for debugging
        logger.warn(`Request timeout: ${method} (ID: ${requestId}, timeout: ${requestTimeout}ms)`);

        // Create detailed timeout error
        const timeoutError = new UnityRPCError(
          `Request timeout after ${requestTimeout}ms`,
          JSONRPC.INTERNAL_ERROR,
          {
            method,
            requestId,
            timeout: requestTimeout,
            params,
            timestamp: new Date().toISOString(),
          }
        );

        reject(timeoutError);
      }, requestTimeout);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
        method,
      });

      const message = JSON.stringify(request);
      logger.debug(`→ ${method}: ${message}`);

      this.ws!.send(message, (error) => {
        if (error) {
          clearTimeout(timer);
          this.pendingRequests.delete(requestId);

          const sendError = new UnityRPCError(
            `Failed to send request: ${error.message}`,
            JSONRPC.INTERNAL_ERROR,
            { method, requestId, originalError: error.message }
          );

          reject(sendError);
        }
      });
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: WebSocket.Data): void {
    let message: string;
    let response: any;

    try {
      message = data.toString();
      logger.debug(`← ${message}`);
      response = JSON.parse(message);
    } catch (error) {
      logger.error('Failed to parse message', error);
      return; // Parsing failed, pending requests will timeout
    }

    // Validate JSON-RPC structure
    if (!response || typeof response !== 'object') {
      logger.error('Invalid response structure');
      return;
    }

    if (!response.id) {
      logger.warn('Received response without ID, ignoring');
      return;
    }

    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      logger.warn(`Received response for unknown request ID: ${response.id}`);
      return;
    }

    clearTimeout(pending.timer);
    this.pendingRequests.delete(response.id);

    try {
      if ('error' in response) {
        const errorResponse = response as JSONRPCErrorResponse;
        const error = new UnityRPCError(
          errorResponse.error.message,
          errorResponse.error.code,
          errorResponse.error.data
        );
        pending.reject(error);
      } else if ('result' in response) {
        pending.resolve(response.result);
      } else {
        pending.reject(new Error('Invalid JSON-RPC response'));
      }
    } catch (error) {
      logger.error('Error processing response', error);
      pending.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    this.reconnectAttempts++;
    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));

    try {
      await this.connect();
      logger.info('✓ Reconnected successfully');
    } catch (error) {
      logger.error('Reconnection failed', error);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else {
        logger.error('Max reconnection attempts reached');
      }
    }
  }

  /**
   * Reject all pending requests
   */
  private rejectAllPendingRequests(error: Error): void {
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): { host: string; port: number; connected: boolean } {
    return {
      host: this.host,
      port: this.port,
      connected: this.connected,
    };
  }
}

/**
 * Create Unity WebSocket client
 */
export function createUnityClient(port: number, host?: string): UnityWebSocketClient {
  return new UnityWebSocketClient(port, host);
}
