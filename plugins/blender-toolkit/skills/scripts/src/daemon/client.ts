/**
 * IPC Client for Blender Toolkit Daemon
 * Used by CLI commands to communicate with the daemon
 */

import { Socket, connect } from 'net';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { getOutputDir } from '../blender/config';
import {
  IPCRequest,
  IPCResponse,
  SOCKET_PATH_PREFIX,
  getProjectSocketName
} from './protocol';
import { DAEMON } from '../constants';
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
      throw new Error('Daemon not running (socket file not found)');
    }

    return new Promise((resolve, reject) => {
      // Browser Pilot 패턴: 연결 타임아웃
      const timeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error(`Connection timeout after ${DAEMON.CONNECT_TIMEOUT}ms`));
      }, DAEMON.CONNECT_TIMEOUT);

      this.socket = connect(this.socketPath);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.setupSocket();
        resolve();
      });

      this.socket.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Connection failed: ${error.message}`));
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

      // Browser Pilot 패턴: 메시지 크기 제한 (DoS 방지)
      if (this.buffer.length > DAEMON.MAX_MESSAGE_SIZE) {
        logger.error(`Message size exceeded limit: ${this.buffer.length} bytes`);
        this.socket?.destroy();
        this.rejectAllPending(new Error('Message size exceeded limit'));
        return;
      }

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
      this.rejectAllPending(new Error(`Socket error: ${error.message}`));
      // Browser Pilot 패턴: 리소스 정리
      this.buffer = '';
      this.socket = null;
    });

    this.socket.on('close', () => {
      // Browser Pilot 패턴: 리소스 정리
      this.buffer = '';
      this.socket = null;
      this.rejectAllPending(new Error('Connection closed'));
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
      pending.reject(new Error(response.error || 'Command failed'));
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
  async sendRequest(command: string, params: Record<string, unknown> = {}, timeout: number = DAEMON.IPC_TIMEOUT): Promise<IPCResponse> {
    await this.connect();

    if (!this.socket) {
      throw new Error('Not connected to daemon');
    }

    const request: IPCRequest = {
      id: randomUUID(),
      command,
      params,
      timeout
    };

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(request.id, {
        resolve,
        reject,
        timeout: timeoutHandle
      });

      // Send request (newline-delimited JSON)
      this.socket!.write(JSON.stringify(request) + '\n');
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
    this.rejectAllPending(new Error('Client closed'));
  }
}
