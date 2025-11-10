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
    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();

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
    });

    socket.on('close', () => {
      logger.info('CLI client disconnected');
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
      this.shutdown();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    if (process.platform !== 'win32') {
      process.on('SIGHUP', () => shutdown('SIGHUP'));
    }
  }

  /**
   * Shutdown daemon
   */
  private shutdown(): void {
    if (this.shutdownRequested) return;
    this.shutdownRequested = true;

    logger.info('Shutting down daemon...');

    // Close Blender connection
    if (this.blenderClient.isConnected()) {
      this.blenderClient.disconnect();
      logger.info('Disconnected from Blender');
    }

    // Close IPC server
    if (this.ipcServer) {
      this.ipcServer.close();
      logger.info('IPC server closed');
    }

    // Remove socket file (Unix only)
    if (process.platform !== 'win32' && existsSync(this.socketPath)) {
      unlinkSync(this.socketPath);
      logger.info('Socket file removed');
    }

    // Remove PID file
    if (existsSync(this.pidPath)) {
      unlinkSync(this.pidPath);
      logger.info('PID file removed');
    }

    logger.info(' Daemon shutdown complete');
    process.exit(0);
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
