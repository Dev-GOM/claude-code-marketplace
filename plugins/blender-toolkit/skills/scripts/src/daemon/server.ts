/**
 * Blender Toolkit Daemon Server
 * Detached background process that maintains connection to Blender WebSocket
 * and provides IPC interface for CLI commands
 */

import { Server as NetServer, Socket as NetSocket, createServer } from 'net';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BlenderClient } from '../blender/client';
import { getOutputDir, getProjectConfig } from '../blender/config';
import {
  IPCRequest,
  IPCResponse,
  DaemonState,
  DAEMON_COMMANDS,
  PID_FILENAME,
  SOCKET_PATH_PREFIX,
  getProjectSocketName
} from './protocol';
import { DAEMON } from '../constants';
import { logger } from '../utils/logger';

class DaemonServer {
  private ipcServer: NetServer | null = null;
  private blenderClient: BlenderClient;
  private socketPath: string;
  private pidPath: string;
  private startTime: number;
  private lastActivity: number;
  private blenderPort: number = 9400;
  private shutdownRequested: boolean = false;
  // Browser Pilot 패턴: 활성 연결 추적
  private activeSockets: Set<NetSocket> = new Set();
  // Browser Pilot 패턴: shutdown Promise (race condition 방지)
  private shutdownPromise: Promise<void> | null = null;

  constructor() {
    const outputDir = getOutputDir();
    this.socketPath = this.getSocketPath(outputDir);
    this.pidPath = join(outputDir, PID_FILENAME);
    this.blenderClient = new BlenderClient();
    this.startTime = Date.now();
    this.lastActivity = Date.now();
  }

  /**
   * Get socket path (platform-specific)
   */
  private getSocketPath(outputDir: string): string {
    if (process.platform === 'win32') {
      const socketName = getProjectSocketName();
      return `\\\\.\\pipe\\${socketName}`;
    } else {
      return join(outputDir, `${SOCKET_PATH_PREFIX}.sock`);
    }
  }

  /**
   * Start daemon server
   */
  async start(): Promise<void> {
    try {
      // Get project config for Blender port
      const config = await getProjectConfig();
      this.blenderPort = config.port;

      logger.info(`Starting Blender Toolkit Daemon on port ${this.blenderPort}`);

      // Write PID file
      writeFileSync(this.pidPath, String(process.pid), 'utf-8');
      logger.info(`PID file written: ${this.pidPath}`);

      // Start IPC server
      await this.startIPCServer();

      // Setup shutdown handlers
      this.setupShutdownHandlers();

      logger.info(' Daemon started successfully');
      console.log(`Blender Toolkit Daemon started (PID: ${process.pid})`);
    } catch (error) {
      logger.error('Failed to start daemon:', error);
      process.exit(1);
    }
  }

  /**
   * Start IPC server for CLI communication
   */
  private async startIPCServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Remove existing socket file (Unix only)
      if (process.platform !== 'win32' && existsSync(this.socketPath)) {
        unlinkSync(this.socketPath);
      }

      this.ipcServer = createServer((socket: NetSocket) => {
        this.handleIPCConnection(socket);
      });

      this.ipcServer.on('error', (error) => {
        logger.error('IPC server error:', error);
        reject(error);
      });

      this.ipcServer.listen(this.socketPath, () => {
        logger.info(`IPC server listening on ${this.socketPath}`);
        resolve();
      });
    });
  }

  /**
   * Handle IPC connection from CLI
   */
  private handleIPCConnection(socket: NetSocket): void {
    logger.info('CLI client connected');

    // Browser Pilot 패턴: 활성 소켓 추적
    this.activeSockets.add(socket);

    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();

      // Browser Pilot 패턴: 메시지 크기 제한 (DoS 방지)
      if (buffer.length > DAEMON.MAX_MESSAGE_SIZE) {
        logger.error(`Message size exceeded limit: ${buffer.length} bytes`);
        socket.destroy();
        return;
      }

      // Process newline-delimited JSON
      const messages = buffer.split('\n');
      buffer = messages.pop() || '';

      for (const message of messages) {
        if (!message.trim()) continue;

        try {
          const request: IPCRequest = JSON.parse(message);
          const response = await this.handleIPCRequest(request);
          socket.write(JSON.stringify(response) + '\n');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error('Failed to handle IPC request:', errorMessage);
        }
      }
    });

    socket.on('error', (error) => {
      logger.warn('IPC socket error:', error);
      // Browser Pilot 패턴: 활성 소켓에서 제거
      this.activeSockets.delete(socket);
    });

    socket.on('close', () => {
      logger.info('CLI client disconnected');
      // Browser Pilot 패턴: 활성 소켓에서 제거
      this.activeSockets.delete(socket);
    });
  }

  /**
   * Handle IPC request from CLI
   */
  private async handleIPCRequest(request: IPCRequest): Promise<IPCResponse> {
    this.lastActivity = Date.now();

    try {
      logger.info(`Handling command: ${request.command}`);

      switch (request.command) {
        case DAEMON_COMMANDS.PING:
          return { id: request.id, success: true, data: { status: 'alive' } };

        case DAEMON_COMMANDS.GET_STATUS:
          return { id: request.id, success: true, data: this.getStatus() };

        case DAEMON_COMMANDS.SHUTDOWN:
          this.shutdown();
          return { id: request.id, success: true, data: { message: 'Shutting down' } };

        case DAEMON_COMMANDS.BLENDER_COMMAND:
          // Forward command to Blender WebSocket
          const result = await this.forwardToBlender(request.params);
          return { id: request.id, success: true, data: result };

        default:
          return {
            id: request.id,
            success: false,
            error: `Unknown command: ${request.command}`
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Command failed: ${errorMessage}`);
      return {
        id: request.id,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Forward command to Blender WebSocket
   */
  private async forwardToBlender(params: Record<string, unknown>): Promise<unknown> {
    try {
      // Connect to Blender if not connected
      if (!this.blenderClient.isConnected()) {
        await this.blenderClient.connect(this.blenderPort);
        logger.info(`Connected to Blender on port ${this.blenderPort}`);
      }

      // Extract command method and params
      const method = params.method as string;
      const commandParams = params.params as Record<string, unknown>;

      // Send command to Blender
      const result = await this.blenderClient.sendCommand(method, commandParams);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Blender command failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get daemon status
   */
  private getStatus(): DaemonState {
    const uptime = Date.now() - this.startTime;

    return {
      connected: this.blenderClient.isConnected(),
      port: this.blenderPort,
      host: '127.0.0.1',
      uptime,
      lastActivity: this.lastActivity
    };
  }

  /**
   * Setup shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down...`);
      void this.shutdown();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    if (process.platform !== 'win32') {
      process.on('SIGHUP', () => shutdown('SIGHUP'));
    }
  }

  /**
   * Shutdown daemon
   * Browser Pilot 패턴: Race condition 방지
   */
  private shutdown(): Promise<void> {
    // Race condition 방지: 이미 shutdown 중이면 기존 Promise 반환
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.shutdownRequested = true;
    this.shutdownPromise = this.performShutdown();
    return this.shutdownPromise;
  }

  /**
   * 실제 shutdown 수행 (내부 메서드)
   * Browser Pilot 패턴: Promise 기반 안전한 종료
   */
  private async performShutdown(): Promise<void> {
    logger.info('Shutting down daemon...');

    try {
      // 1. Close all active client connections
      logger.info(`Closing ${this.activeSockets.size} active connections...`);
      for (const socket of this.activeSockets) {
        try {
          socket.destroy();
        } catch (error) {
          // Ignore individual socket errors
        }
      }
      this.activeSockets.clear();

      // 2. Close Blender connection
      if (this.blenderClient.isConnected()) {
        this.blenderClient.disconnect();
        logger.info('Disconnected from Blender');
      }

      // 3. Close IPC server with timeout
      if (this.ipcServer) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            logger.warn('IPC server close timeout, forcing...');
            resolve();
          }, DAEMON.SHUTDOWN_TIMEOUT);

          this.ipcServer!.close(() => {
            clearTimeout(timeout);
            logger.info('IPC server closed');
            resolve();
          });
        });
      }

      // 4. Remove socket file (Unix only)
      if (process.platform !== 'win32' && existsSync(this.socketPath)) {
        unlinkSync(this.socketPath);
        logger.info('Socket file removed');
      }

      // 5. Remove PID file
      if (existsSync(this.pidPath)) {
        unlinkSync(this.pidPath);
        logger.info('PID file removed');
      }

      logger.info('✓ Daemon shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    } finally {
      process.exit(0);
    }
  }
}


// Main entry point
if (require.main === module) {
  const server = new DaemonServer();
  server.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default DaemonServer;
