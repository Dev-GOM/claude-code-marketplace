/**
 * IPC Client for Browser Pilot Daemon
 * Used by CLI commands to communicate with the daemon
 */

import { Socket, connect } from 'net';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { getOutputDir } from '../cdp/config';
import {
  IPCRequest,
  IPCResponse,
  IPCError,
  IPCErrorCodes,
  SOCKET_PATH_PREFIX,
  DEFAULT_TIMEOUT,
  getProjectSocketName
} from './protocol';
import { logger } from '../utils/logger';

export class IPCClient {
  private socket: Socket | null = null;
  private socketPath: string;
  private pendingRequests: Map<string, {
    resolve: (response: IPCResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private buffer: string = '';

  constructor() {
    const outputDir = getOutputDir();
    this.socketPath = this.getSocketPath(outputDir);
  }

  /**
   * Get socket path (platform-specific, project-unique)
   */
  private getSocketPath(outputDir: string): string {
    if (process.platform === 'win32') {
      // Windows: project-specific named pipe
      const socketName = getProjectSocketName();
      return `\\\\.\\pipe\\${socketName}`;
    } else {
      // Unix domain socket (already project-specific via outputDir)
      return join(outputDir, `${SOCKET_PATH_PREFIX}.sock`);
    }
  }

  /**
   * Connect to daemon
   */
  async connect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) {
      return; // Already connected
    }

    // Check if socket file exists (Unix only)
    if (process.platform !== 'win32' && !existsSync(this.socketPath)) {
      throw new IPCError('Daemon not running (socket file not found)', IPCErrorCodes.DAEMON_NOT_RUNNING);
    }

    return new Promise((resolve, reject) => {
      this.socket = connect(this.socketPath);

      this.socket.on('connect', () => {
        this.setupSocket();
        resolve();
      });

      this.socket.on('error', (error) => {
        reject(new IPCError(`Connection failed: ${error.message}`, IPCErrorCodes.CONNECTION_ERROR));
      });
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupSocket(): void {
    if (!this.socket) return;

    this.socket.on('data', (data) => {
      this.buffer += data.toString();

      // Process complete JSON messages (delimited by newline)
      const messages = this.buffer.split('\n');
      this.buffer = messages.pop() || ''; // Keep incomplete message in buffer

      for (const message of messages) {
        if (!message.trim()) continue;

        try {
          const response: IPCResponse = JSON.parse(message);
          this.handleResponse(response);
        } catch (error) {
          logger.error('Failed to parse response', error);
        }
      }
    });

    this.socket.on('error', (error) => {
      logger.error('Socket error', error);
      this.rejectAllPending(new IPCError(`Socket error: ${error.message}`, IPCErrorCodes.CONNECTION_ERROR));
    });

    this.socket.on('close', () => {
      this.socket = null;
      this.rejectAllPending(new IPCError('Connection closed', IPCErrorCodes.CONNECTION_ERROR));
    });
  }

  /**
   * Handle response from daemon
   */
  private handleResponse(response: IPCResponse): void {
    const pending = this.pendingRequests.get(response.id);

    if (!pending) {
      logger.warn(`Received response for unknown request: ${response.id}`);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.success) {
      pending.resolve(response);
    } else {
      pending.reject(new IPCError(response.error || 'Command failed', IPCErrorCodes.COMMAND_FAILED));
    }
  }

  /**
   * Reject all pending requests
   */
  private rejectAllPending(error: Error): void {
    for (const [_id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  /**
   * Send request to daemon
   */
  async sendRequest(command: string, params: Record<string, unknown> = {}, timeout: number = DEFAULT_TIMEOUT): Promise<IPCResponse> {
    await this.connect();

    if (!this.socket || this.socket.destroyed) {
      throw new IPCError('Not connected to daemon', IPCErrorCodes.CONNECTION_ERROR);
    }

    const requestId = randomUUID();
    const request: IPCRequest = {
      id: requestId,
      command,
      params,
      timeout
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new IPCError(`Request timeout after ${timeout}ms`, IPCErrorCodes.TIMEOUT));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle
      });

      // Send request
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.socket!.write(JSON.stringify(request) + '\n', (error) => {
        if (error) {
          clearTimeout(timeoutHandle);
          this.pendingRequests.delete(requestId);
          reject(new IPCError(`Failed to send request: ${error.message}`, IPCErrorCodes.CONNECTION_ERROR));
        }
      });
    });
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.rejectAllPending(new IPCError('Client closed', IPCErrorCodes.CONNECTION_ERROR));
  }

  /**
   * Check if daemon is running
   */
  static isDaemonRunning(): boolean {
    const outputDir = getOutputDir();
    const socketPath = process.platform === 'win32'
      ? `\\\\.\\pipe\\${SOCKET_PATH_PREFIX}`
      : join(outputDir, `${SOCKET_PATH_PREFIX}.sock`);

    return existsSync(socketPath);
  }
}
