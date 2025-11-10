"use strict";
/**
 * Blender Toolkit Daemon Server
 * Detached background process that maintains connection to Blender WebSocket
 * and provides IPC interface for CLI commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("net");
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = require("../blender/client");
const config_1 = require("../blender/config");
const protocol_1 = require("./protocol");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
class DaemonServer {
    constructor() {
        this.ipcServer = null;
        this.blenderPort = 9400;
        this.shutdownRequested = false;
        // Browser Pilot 패턴: 활성 연결 추적
        this.activeSockets = new Set();
        // Browser Pilot 패턴: shutdown Promise (race condition 방지)
        this.shutdownPromise = null;
        const outputDir = (0, config_1.getOutputDir)();
        this.socketPath = this.getSocketPath(outputDir);
        this.pidPath = (0, path_1.join)(outputDir, protocol_1.PID_FILENAME);
        this.blenderClient = new client_1.BlenderClient();
        this.startTime = Date.now();
        this.lastActivity = Date.now();
    }
    /**
     * Get socket path (platform-specific)
     */
    getSocketPath(outputDir) {
        if (process.platform === 'win32') {
            const socketName = (0, protocol_1.getProjectSocketName)();
            return `\\\\.\\pipe\\${socketName}`;
        }
        else {
            return (0, path_1.join)(outputDir, `${protocol_1.SOCKET_PATH_PREFIX}.sock`);
        }
    }
    /**
     * Start daemon server
     */
    async start() {
        try {
            // Get project config for Blender port
            const config = await (0, config_1.getProjectConfig)();
            this.blenderPort = config.port;
            logger_1.logger.info(`Starting Blender Toolkit Daemon on port ${this.blenderPort}`);
            // Write PID file
            (0, fs_1.writeFileSync)(this.pidPath, String(process.pid), 'utf-8');
            logger_1.logger.info(`PID file written: ${this.pidPath}`);
            // Start IPC server
            await this.startIPCServer();
            // Setup shutdown handlers
            this.setupShutdownHandlers();
            logger_1.logger.info(' Daemon started successfully');
            console.log(`Blender Toolkit Daemon started (PID: ${process.pid})`);
        }
        catch (error) {
            logger_1.logger.error('Failed to start daemon:', error);
            process.exit(1);
        }
    }
    /**
     * Start IPC server for CLI communication
     */
    async startIPCServer() {
        return new Promise((resolve, reject) => {
            // Remove existing socket file (Unix only)
            if (process.platform !== 'win32' && (0, fs_1.existsSync)(this.socketPath)) {
                (0, fs_1.unlinkSync)(this.socketPath);
            }
            this.ipcServer = (0, net_1.createServer)((socket) => {
                this.handleIPCConnection(socket);
            });
            this.ipcServer.on('error', (error) => {
                logger_1.logger.error('IPC server error:', error);
                reject(error);
            });
            this.ipcServer.listen(this.socketPath, () => {
                logger_1.logger.info(`IPC server listening on ${this.socketPath}`);
                resolve();
            });
        });
    }
    /**
     * Handle IPC connection from CLI
     */
    handleIPCConnection(socket) {
        logger_1.logger.info('CLI client connected');
        // Browser Pilot 패턴: 활성 소켓 추적
        this.activeSockets.add(socket);
        let buffer = '';
        socket.on('data', async (data) => {
            buffer += data.toString();
            // Browser Pilot 패턴: 메시지 크기 제한 (DoS 방지)
            if (buffer.length > constants_1.DAEMON.MAX_MESSAGE_SIZE) {
                logger_1.logger.error(`Message size exceeded limit: ${buffer.length} bytes`);
                socket.destroy();
                return;
            }
            // Process newline-delimited JSON
            const messages = buffer.split('\n');
            buffer = messages.pop() || '';
            for (const message of messages) {
                if (!message.trim())
                    continue;
                try {
                    const request = JSON.parse(message);
                    const response = await this.handleIPCRequest(request);
                    socket.write(JSON.stringify(response) + '\n');
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger_1.logger.error('Failed to handle IPC request:', errorMessage);
                }
            }
        });
        socket.on('error', (error) => {
            logger_1.logger.warn('IPC socket error:', error);
            // Browser Pilot 패턴: 활성 소켓에서 제거
            this.activeSockets.delete(socket);
        });
        socket.on('close', () => {
            logger_1.logger.info('CLI client disconnected');
            // Browser Pilot 패턴: 활성 소켓에서 제거
            this.activeSockets.delete(socket);
        });
    }
    /**
     * Handle IPC request from CLI
     */
    async handleIPCRequest(request) {
        this.lastActivity = Date.now();
        try {
            logger_1.logger.info(`Handling command: ${request.command}`);
            switch (request.command) {
                case protocol_1.DAEMON_COMMANDS.PING:
                    return { id: request.id, success: true, data: { status: 'alive' } };
                case protocol_1.DAEMON_COMMANDS.GET_STATUS:
                    return { id: request.id, success: true, data: this.getStatus() };
                case protocol_1.DAEMON_COMMANDS.SHUTDOWN:
                    this.shutdown();
                    return { id: request.id, success: true, data: { message: 'Shutting down' } };
                case protocol_1.DAEMON_COMMANDS.BLENDER_COMMAND:
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Command failed: ${errorMessage}`);
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
    async forwardToBlender(params) {
        try {
            // Connect to Blender if not connected
            if (!this.blenderClient.isConnected()) {
                await this.blenderClient.connect(this.blenderPort);
                logger_1.logger.info(`Connected to Blender on port ${this.blenderPort}`);
            }
            // Extract command method and params
            const method = params.method;
            const commandParams = params.params;
            // Send command to Blender
            const result = await this.blenderClient.sendCommand(method, commandParams);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.error(`Blender command failed: ${errorMessage}`);
            throw error;
        }
    }
    /**
     * Get daemon status
     */
    getStatus() {
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
    setupShutdownHandlers() {
        const shutdown = (signal) => {
            logger_1.logger.info(`Received ${signal}, shutting down...`);
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
    shutdown() {
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
    async performShutdown() {
        logger_1.logger.info('Shutting down daemon...');
        try {
            // 1. Close all active client connections
            logger_1.logger.info(`Closing ${this.activeSockets.size} active connections...`);
            for (const socket of this.activeSockets) {
                try {
                    socket.destroy();
                }
                catch (error) {
                    // Ignore individual socket errors
                }
            }
            this.activeSockets.clear();
            // 2. Close Blender connection
            if (this.blenderClient.isConnected()) {
                this.blenderClient.disconnect();
                logger_1.logger.info('Disconnected from Blender');
            }
            // 3. Close IPC server with timeout
            if (this.ipcServer) {
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        logger_1.logger.warn('IPC server close timeout, forcing...');
                        resolve();
                    }, constants_1.DAEMON.SHUTDOWN_TIMEOUT);
                    this.ipcServer.close(() => {
                        clearTimeout(timeout);
                        logger_1.logger.info('IPC server closed');
                        resolve();
                    });
                });
            }
            // 4. Remove socket file (Unix only)
            if (process.platform !== 'win32' && (0, fs_1.existsSync)(this.socketPath)) {
                (0, fs_1.unlinkSync)(this.socketPath);
                logger_1.logger.info('Socket file removed');
            }
            // 5. Remove PID file
            if ((0, fs_1.existsSync)(this.pidPath)) {
                (0, fs_1.unlinkSync)(this.pidPath);
                logger_1.logger.info('PID file removed');
            }
            logger_1.logger.info('✓ Daemon shutdown complete');
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown:', error);
        }
        finally {
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
exports.default = DaemonServer;
//# sourceMappingURL=server.js.map