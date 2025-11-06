"use strict";
/**
 * IPC Client for Browser Pilot Daemon
 * Used by CLI commands to communicate with the daemon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCClient = void 0;
const net_1 = require("net");
const path_1 = require("path");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const config_1 = require("../cdp/config");
const protocol_1 = require("./protocol");
const logger_1 = require("../utils/logger");
class IPCClient {
    socket = null;
    socketPath;
    pendingRequests = new Map();
    buffer = '';
    constructor() {
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
            throw new protocol_1.IPCError('Daemon not running (socket file not found)', protocol_1.IPCErrorCodes.DAEMON_NOT_RUNNING);
        }
        return new Promise((resolve, reject) => {
            this.socket = (0, net_1.connect)(this.socketPath);
            this.socket.on('connect', () => {
                this.setupSocket();
                resolve();
            });
            this.socket.on('error', (error) => {
                reject(new protocol_1.IPCError(`Connection failed: ${error.message}`, protocol_1.IPCErrorCodes.CONNECTION_ERROR));
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
            this.rejectAllPending(new protocol_1.IPCError(`Socket error: ${error.message}`, protocol_1.IPCErrorCodes.CONNECTION_ERROR));
        });
        this.socket.on('close', () => {
            this.socket = null;
            this.rejectAllPending(new protocol_1.IPCError('Connection closed', protocol_1.IPCErrorCodes.CONNECTION_ERROR));
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
            pending.reject(new protocol_1.IPCError(response.error || 'Command failed', protocol_1.IPCErrorCodes.COMMAND_FAILED));
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
    async sendRequest(command, params = {}, timeout = protocol_1.DEFAULT_TIMEOUT) {
        await this.connect();
        if (!this.socket || this.socket.destroyed) {
            throw new protocol_1.IPCError('Not connected to daemon', protocol_1.IPCErrorCodes.CONNECTION_ERROR);
        }
        const requestId = (0, crypto_1.randomUUID)();
        const request = {
            id: requestId,
            command,
            params,
            timeout
        };
        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new protocol_1.IPCError(`Request timeout after ${timeout}ms`, protocol_1.IPCErrorCodes.TIMEOUT));
            }, timeout);
            // Store pending request
            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout: timeoutHandle
            });
            // Send request
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.socket.write(JSON.stringify(request) + '\n', (error) => {
                if (error) {
                    clearTimeout(timeoutHandle);
                    this.pendingRequests.delete(requestId);
                    reject(new protocol_1.IPCError(`Failed to send request: ${error.message}`, protocol_1.IPCErrorCodes.CONNECTION_ERROR));
                }
            });
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
        this.rejectAllPending(new protocol_1.IPCError('Client closed', protocol_1.IPCErrorCodes.CONNECTION_ERROR));
    }
    /**
     * Check if daemon is running
     */
    static isDaemonRunning() {
        const outputDir = (0, config_1.getOutputDir)();
        const socketPath = process.platform === 'win32'
            ? `\\\\.\\pipe\\${protocol_1.SOCKET_PATH_PREFIX}`
            : (0, path_1.join)(outputDir, `${protocol_1.SOCKET_PATH_PREFIX}.sock`);
        return (0, fs_1.existsSync)(socketPath);
    }
}
exports.IPCClient = IPCClient;
//# sourceMappingURL=client.js.map