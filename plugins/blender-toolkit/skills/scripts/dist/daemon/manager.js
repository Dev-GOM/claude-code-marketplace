"use strict";
/**
 * Daemon Process Manager
 * Handles starting, stopping, and checking status of the Blender Toolkit Daemon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaemonManager = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const config_1 = require("../blender/config");
const client_1 = require("./client");
const protocol_1 = require("./protocol");
const logger_1 = require("../utils/logger");
class DaemonManager {
    constructor() {
        this.outputDir = (0, config_1.getOutputDir)();
        this.pidPath = (0, path_1.join)(this.outputDir, protocol_1.PID_FILENAME);
    }
    /**
     * Start daemon process
     */
    async start(options = {}) {
        const { verbose = true } = options;
        // Check if already running
        if (await this.isRunning()) {
            if (verbose) {
                console.log(' Daemon is already running');
            }
            return;
        }
        if (verbose) {
            console.log('=� Starting Blender Toolkit Daemon...');
        }
        // Get path to server.js (compiled output)
        const serverPath = (0, path_1.join)(__dirname, 'server.js');
        if (!(0, fs_1.existsSync)(serverPath)) {
            throw new Error(`Daemon server not found at ${serverPath}. Did you run 'npm run build'?`);
        }
        // Spawn daemon as detached process
        const daemon = (0, child_process_1.spawn)(process.execPath, [serverPath], {
            detached: true,
            stdio: 'ignore',
            cwd: process.cwd(),
            env: process.env
        });
        // Detach the process so it continues running when parent exits
        daemon.unref();
        // Wait for daemon to start
        await this.waitForDaemon();
        if (verbose) {
            console.log(' Daemon started successfully');
        }
    }
    /**
     * Wait for daemon to be ready
     */
    async waitForDaemon() {
        const maxAttempts = 10;
        const delay = 500; // 500ms
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, delay));
            if (await this.isRunning()) {
                return;
            }
        }
        throw new Error('Daemon failed to start');
    }
    /**
     * Stop daemon process
     */
    async stop(options = {}) {
        const { verbose = true, force = false } = options;
        if (!(await this.isRunning())) {
            if (verbose) {
                console.log('Daemon is not running');
            }
            return;
        }
        if (verbose) {
            console.log('=� Stopping Blender Toolkit Daemon...');
        }
        if (force) {
            // Force kill via PID
            await this.forceKill();
        }
        else {
            // Graceful shutdown via IPC
            try {
                const client = new client_1.IPCClient();
                await client.sendRequest(protocol_1.DAEMON_COMMANDS.SHUTDOWN, {});
                client.close();
                // Wait for shutdown
                await this.waitForShutdown();
            }
            catch (error) {
                if (verbose) {
                    console.log('�  Graceful shutdown failed, force killing...');
                }
                await this.forceKill();
            }
        }
        if (verbose) {
            console.log(' Daemon stopped');
        }
    }
    /**
     * Force kill daemon process
     */
    async forceKill() {
        if (!(0, fs_1.existsSync)(this.pidPath)) {
            return;
        }
        try {
            const pidStr = (0, fs_1.readFileSync)(this.pidPath, 'utf-8').trim();
            const pid = parseInt(pidStr, 10);
            if (isNaN(pid) || pid <= 0) {
                logger_1.logger.warn(`Invalid PID in ${this.pidPath}: ${pidStr}`);
                (0, fs_1.unlinkSync)(this.pidPath);
                return;
            }
            // Kill process
            try {
                process.kill(pid, 'SIGTERM');
                await new Promise(resolve => setTimeout(resolve, 1000));
                // If still running, force kill
                if (this.isProcessRunning(pid)) {
                    process.kill(pid, 'SIGKILL');
                }
            }
            catch (error) {
                // Process might already be dead
            }
            // Remove PID file
            if ((0, fs_1.existsSync)(this.pidPath)) {
                (0, fs_1.unlinkSync)(this.pidPath);
            }
        }
        catch (error) {
            logger_1.logger.error('Force kill failed:', error);
        }
    }
    /**
     * Wait for daemon to shutdown
     */
    async waitForShutdown() {
        const maxAttempts = 10;
        const delay = 500; // 500ms
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, delay));
            if (!(await this.isRunning())) {
                return;
            }
        }
        throw new Error('Daemon failed to shutdown gracefully');
    }
    /**
     * Restart daemon
     */
    async restart(options = {}) {
        const { verbose = true } = options;
        if (verbose) {
            console.log('= Restarting Blender Toolkit Daemon...');
        }
        await this.stop({ verbose: false });
        await this.start({ verbose: false });
        if (verbose) {
            console.log(' Daemon restarted');
        }
    }
    /**
     * Get daemon status
     */
    async getStatus(options = {}) {
        const { verbose = true } = options;
        if (!(await this.isRunning())) {
            if (verbose) {
                console.log('Daemon is not running');
            }
            return null;
        }
        try {
            const client = new client_1.IPCClient();
            const response = await client.sendRequest(protocol_1.DAEMON_COMMANDS.GET_STATUS, {});
            client.close();
            const state = response.data;
            if (verbose) {
                console.log('Daemon Status:');
                console.log(`  Connected to Blender: ${state.connected ? 'Yes' : 'No'}`);
                console.log(`  Blender Port: ${state.port}`);
                console.log(`  Uptime: ${Math.floor(state.uptime / 1000)}s`);
                console.log(`  Last Activity: ${Math.floor((Date.now() - state.lastActivity) / 1000)}s ago`);
            }
            return state;
        }
        catch (error) {
            if (verbose) {
                console.error('Failed to get status:', error);
            }
            return null;
        }
    }
    /**
     * Check if daemon is running
     */
    async isRunning() {
        if (!(0, fs_1.existsSync)(this.pidPath)) {
            return false;
        }
        try {
            const pidStr = (0, fs_1.readFileSync)(this.pidPath, 'utf-8').trim();
            const pid = parseInt(pidStr, 10);
            if (isNaN(pid) || pid <= 0) {
                return false;
            }
            return this.isProcessRunning(pid);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if process is running by PID
     */
    isProcessRunning(pid) {
        try {
            // Signal 0 checks if process exists without killing it
            process.kill(pid, 0);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.DaemonManager = DaemonManager;
//# sourceMappingURL=manager.js.map