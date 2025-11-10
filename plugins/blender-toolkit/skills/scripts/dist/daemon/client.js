"use strict";
/**
 * IPC Client for Blender Toolkit Daemon
 * Used by CLI commands to communicate with the daemon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCClient = void 0;
const net_1 = require("net");
const path_1 = require("path");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const config_1 = require("../blender/config");
const protocol_1 = require("./protocol");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
class IPCClient {
    constructor() {
        this.socket = null;
        this.pendingRequests = new Map();
        this.buffer = '';
        const outputDir = (0, config_1.getOutputDir)();
        this.socketPath = this.getSocketPath(outputDir);
    }
    /**
     * Get socket path (platform-specific, project-unique)
     */
    getSocketPath(outputDir) {
        if (process.platform === 'win32') {
            // Windows: project-specific named pipe
            const socketName = (0, protocol_1.getProjectSocketName)();
            return `\\\\.\\pipe\\${socketName}`;
        }
        else {
            // Unix domain socket (already project-specific via outputDir)
            return (0, path_1.join)(outputDir, `${protocol_1.SOCKET_PATH_PREFIX}.sock`);
        }
    }
    /**
     * Connect to daemon
     */
    async connect() {
        if (this.socket && !this.socket.destroyed) {
            return; // Already connected
        }
        // Check if socket file exists (Unix only)
        if (process.platform !== 'win32' && !(0, fs_1.existsSync)(this.socketPath)) {
            throw new Error('Daemon not running (socket file not found)');
        }
        return new Promise((resolve, reject) => {
            // Browser Pilot 패턴: 연결 타임아웃
            const timeout = setTimeout(() => {
                this.socket?.destroy();
                reject(new Error(`Connection timeout after ${constants_1.DAEMON.CONNECT_TIMEOUT}ms`));
            }, constants_1.DAEMON.CONNECT_TIMEOUT);
            this.socket = (0, net_1.connect)(this.socketPath);
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
    setupSocket() {
        if (!this.socket)
            return;
        this.socket.on('data', (data) => {
            this.buffer += data.toString();
            // Browser Pilot 패턴: 메시지 크기 제한 (DoS 방지)
            if (this.buffer.length > constants_1.DAEMON.MAX_MESSAGE_SIZE) {
                logger_1.logger.error(`Message size exceeded limit: ${this.buffer.length} bytes`);
                this.socket?.destroy();
                this.rejectAllPending(new Error('Message size exceeded limit'));
                return;
            }
            // Process complete JSON messages (delimited by newline)
            const messages = this.buffer.split('\n');
            this.buffer = messages.pop() || ''; // Keep incomplete message in buffer
            for (const message of messages) {
                if (!message.trim())
                    continue;
                try {
                    const response = JSON.parse(message);
                    this.handleResponse(response);
                }
                catch (error) {
                    logger_1.logger.error('Failed to parse response', error);
                }
            }
        });
        this.socket.on('error', (error) => {
            logger_1.logger.error('Socket error', error);
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
    handleResponse(response) {
        const pending = this.pendingRequests.get(response.id);
        if (!pending) {
            logger_1.logger.warn(`Received response for unknown request: ${response.id}`);
            return;
        }
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(response.id);
        if (response.success) {
            pending.resolve(response);
        }
        else {
            pending.reject(new Error(response.error || 'Command failed'));
        }
    }
    /**
     * Reject all pending requests
     */
    rejectAllPending(error) {
        for (const [_id, pending] of this.pendingRequests.entries()) {
            clearTimeout(pending.timeout);
            pending.reject(error);
        }
        this.pendingRequests.clear();
    }
    /**
     * Send request to daemon
     */
    async sendRequest(command, params = {}, timeout = constants_1.DAEMON.IPC_TIMEOUT) {
        await this.connect();
        if (!this.socket) {
            throw new Error('Not connected to daemon');
        }
        const request = {
            id: (0, crypto_1.randomUUID)(),
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
            this.socket.write(JSON.stringify(request) + '\n');
        });
    }
    /**
     * Close connection
     */
    close() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.rejectAllPending(new Error('Client closed'));
    }
}
exports.IPCClient = IPCClient;
//# sourceMappingURL=client.js.map