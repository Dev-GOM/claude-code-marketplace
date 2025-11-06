"use strict";
/**
 * Daemon Process Manager
 * Handles starting, stopping, and checking status of the Browser Pilot Daemon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaemonManager = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const config_1 = require("../cdp/config");
const client_1 = require("./client");
const protocol_1 = require("./protocol");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
class DaemonManager {
    outputDir;
    pidPath;
    socketPath;
    constructor() {
        this.outputDir = (0, config_1.getOutputDir)();
        this.pidPath = (0, path_1.join)(this.outputDir, protocol_1.PID_FILENAME);
        this.socketPath = this.getSocketPath();
    }
    /**
     * Get socket path (platform-specific, project-unique)
     */
    getSocketPath() {
        if (process.platform === 'win32') {
            // Windows: project-specific named pipe
            const socketName = (0, protocol_1.getProjectSocketName)();
            return `\\\\.\\pipe\\${socketName}`;
        }
        else {
            // Unix domain socket (already project-specific via outputDir)
            return (0, path_1.join)(this.outputDir, `${protocol_1.SOCKET_PATH_PREFIX}.sock`);
        }
    }
    /**
     * Start daemon process
     */
    async start(options = {}) {
        const { verbose = true, initialUrl } = options;
        // Check if already running
        if (this.isRunning()) {
            if (verbose) {
                console.log('✓ Daemon is already running');
            }
            return;
        }
        if (verbose) {
            console.log('🚀 Starting Browser Pilot Daemon...');
        }
        // Get path to server.js (compiled output)
        const serverPath = (0, path_1.join)(__dirname, 'server.js');
        if (!(0, fs_1.existsSync)(serverPath)) {
            throw new Error(`Daemon server not found at ${serverPath}. Did you run 'npm run build'?`);
        }
        // Prepare environment variables
        const env = { ...process.env };
        if (initialUrl) {
            env.BP_INITIAL_URL = initialUrl;
            if (verbose) {
                logger_1.logger.info(`Setting initial URL: ${initialUrl}`);
            }
        }
        // Spawn daemon as detached process
        const daemon = (0, child_process_1.spawn)(process.execPath, [serverPath], {
            detached: true,
            stdio: 'ignore', // Don't inherit stdio
            cwd: process.cwd(),
            env // Pass environment variables
        });
        // Detach the process so it continues running when parent exits
        daemon.unref();
        // Wait a bit for daemon to start
        await this.waitForDaemon(constants_1.DAEMON.IPC_TIMEOUT);
        if (verbose) {
            console.log('✓ Daemon started successfully');
        }
    }
    /**
     * Stop daemon process
     */
    async stop(options = {}) {
        const { verbose = true, force = false } = options;
        if (!this.isRunning()) {
            if (verbose) {
                console.log('⚠️  Daemon is not running');
            }
            return;
        }
        if (verbose) {
            console.log('🛑 Stopping Browser Pilot Daemon...');
        }
        try {
            // Try graceful shutdown via IPC first
            if (!force) {
                const client = new client_1.IPCClient();
                await client.sendRequest('shutdown', {}, constants_1.DAEMON.IPC_TIMEOUT);
                client.close();
                // Wait for daemon to stop
                await this.waitForStop(constants_1.DAEMON.IPC_TIMEOUT);
                if (verbose) {
                    console.log('✓ Daemon stopped gracefully');
                }
                return;
            }
        }
        catch (_error) {
            if (verbose) {
                logger_1.logger.warn('Graceful shutdown failed, forcing...');
            }
        }
        // Force kill if graceful shutdown failed
        const pid = this.getPid();
        if (pid) {
            try {
                process.kill(pid, 'SIGTERM');
                // Wait a bit
                await new Promise(resolve => setTimeout(resolve, constants_1.TIMING.POLLING_INTERVAL_SLOW));
                // Check if still running
                try {
                    process.kill(pid, 0);
                    // Still running, force kill
                    process.kill(pid, 'SIGKILL');
                }
                catch (_error) {
                    // Process is gone, good
                }
                if (verbose) {
                    console.log('✓ Daemon stopped (forced)');
                }
            }
            catch (_error) {
                // Process already gone
                if (verbose) {
                    console.log('✓ Daemon stopped');
                }
            }
            // Clean up PID file
            if ((0, fs_1.existsSync)(this.pidPath)) {
                (0, fs_1.unlinkSync)(this.pidPath);
            }
            // Clean up socket file (Unix only)
            if (process.platform !== 'win32' && (0, fs_1.existsSync)(this.socketPath)) {
                (0, fs_1.unlinkSync)(this.socketPath);
            }
        }
    }
    /**
     * Restart daemon
     */
    async restart(options = {}) {
        await this.stop(options);
        await new Promise(resolve => setTimeout(resolve, constants_1.TIMING.ACTION_DELAY_NAVIGATION)); // Wait a bit
        await this.start(options);
    }
    /**
     * Get daemon status
     */
    async getStatus(options = {}) {
        const { verbose = true } = options;
        if (!this.isRunning()) {
            if (verbose) {
                console.log('❌ Daemon is not running');
            }
            return null;
        }
        try {
            const client = new client_1.IPCClient();
            const response = await client.sendRequest('status', {}, constants_1.DAEMON.IPC_TIMEOUT);
            client.close();
            const state = response.data;
            if (verbose) {
                console.log('\n📊 Daemon Status:');
                console.log(`  Connected: ${state.connected ? '✓' : '✗'}`);
                console.log(`  Current URL: ${state.currentUrl || 'N/A'}`);
                console.log(`  Debug Port: ${state.debugPort || 'N/A'}`);
                console.log(`  Console Messages: ${state.consoleMessageCount}`);
                console.log(`  Network Errors: ${state.networkErrorCount}`);
                console.log(`  Uptime: ${Math.floor(state.uptime / constants_1.TIMING.ACTION_DELAY_NAVIGATION)}s`);
                console.log(`  Last Activity: ${new Date(state.lastActivity).toLocaleTimeString()}`);
            }
            return state;
        }
        catch (error) {
            if (verbose) {
                logger_1.logger.error('Failed to get daemon status', error);
            }
            return null;
        }
    }
    /**
     * Check if daemon is running
     */
    isRunning() {
        const pid = this.getPid();
        if (!pid) {
            return false;
        }
        try {
            // Signal 0 checks if process exists without killing it
            process.kill(pid, 0);
            return true;
        }
        catch (_error) {
            // Process doesn't exist, clean up stale PID file
            if ((0, fs_1.existsSync)(this.pidPath)) {
                (0, fs_1.unlinkSync)(this.pidPath);
            }
            return false;
        }
    }
    /**
     * Get daemon PID from PID file
     */
    getPid() {
        if (!(0, fs_1.existsSync)(this.pidPath)) {
            return null;
        }
        try {
            const pidStr = (0, fs_1.readFileSync)(this.pidPath, 'utf-8').trim();
            const pid = parseInt(pidStr, 10);
            return isNaN(pid) ? null : pid;
        }
        catch (_error) {
            return null;
        }
    }
    /**
     * Wait for daemon to start
     */
    async waitForDaemon(timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (this.isRunning()) {
                // Also check if socket is available
                if ((0, fs_1.existsSync)(this.socketPath) || process.platform === 'win32') {
                    return;
                }
            }
            await new Promise(resolve => setTimeout(resolve, constants_1.TIMING.POLLING_INTERVAL_FAST));
        }
        throw new Error('Daemon failed to start within timeout period');
    }
    /**
     * Wait for daemon to stop
     */
    async waitForStop(timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (!this.isRunning()) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, constants_1.TIMING.POLLING_INTERVAL_FAST));
        }
        throw new Error('Daemon failed to stop within timeout period');
    }
    /**
     * Ensure daemon is running (auto-start if needed)
     */
    async ensureRunning(options = {}) {
        if (!this.isRunning()) {
            await this.start(options);
        }
    }
    /**
     * Query interaction map for elements
     */
    async queryMap(params, options = {}) {
        const { verbose = true } = options;
        await this.ensureRunning({ verbose: false });
        try {
            const client = new client_1.IPCClient();
            const response = await client.sendRequest('query-map', params, constants_1.TIMING.WAIT_FOR_LOAD_STATE);
            client.close();
            const result = response.data;
            if (verbose) {
                console.log('\n🔍 Map Query Result:');
                console.log(`  Total matches: ${result.count}`);
                if (result.count > 0) {
                    const firstResult = result.results[0];
                    console.log(`  Best Selector: ${firstResult.selector}`);
                    console.log(`  Element: ${firstResult.element.tag} - "${firstResult.element.text || '(no text)'}"`);
                    console.log(`  Position: (${firstResult.element.position.x}, ${firstResult.element.position.y})`);
                    if (firstResult.alternatives.length > 0) {
                        console.log(`  Alternatives: ${firstResult.alternatives.length} available`);
                    }
                }
            }
            return result;
        }
        catch (error) {
            if (verbose) {
                logger_1.logger.error('Map query failed', error);
            }
            throw error;
        }
    }
    /**
     * Generate interaction map for current page
     */
    async generateMap(params, options = {}) {
        const { verbose = true } = options;
        await this.ensureRunning({ verbose: false });
        try {
            const client = new client_1.IPCClient();
            const response = await client.sendRequest('generate-map', params, constants_1.TIMING.WAIT_FOR_LOAD_STATE + constants_1.DAEMON.IPC_TIMEOUT);
            client.close();
            const result = response.data;
            if (verbose) {
                console.log('\n🗺️  Interaction Map Generated:');
                console.log(`  URL: ${result.url}`);
                console.log(`  Elements: ${result.elementCount}`);
                console.log(`  Timestamp: ${result.timestamp}`);
                console.log(`  Cached: ${result.cached ? '✓' : '✗'}`);
            }
            return result;
        }
        catch (error) {
            if (verbose) {
                logger_1.logger.error('Map generation failed', error);
            }
            throw error;
        }
    }
    /**
     * Get interaction map status
     */
    async getMapStatus(options = {}) {
        const { verbose = true } = options;
        await this.ensureRunning({ verbose: false });
        try {
            const client = new client_1.IPCClient();
            const response = await client.sendRequest('get-map-status', {}, constants_1.DAEMON.IPC_TIMEOUT);
            client.close();
            const result = response.data;
            if (verbose) {
                console.log('\n📊 Interaction Map Status:');
                console.log(`  Exists: ${result.exists ? '✓' : '✗'}`);
                if (result.exists) {
                    console.log(`  URL: ${result.url || 'N/A'}`);
                    console.log(`  Elements: ${result.elementCount}`);
                    console.log(`  Timestamp: ${result.timestamp || 'N/A'}`);
                    console.log(`  Cache Valid: ${result.cacheValid ? '✓' : '✗ (expired)'}`);
                }
            }
            return result;
        }
        catch (error) {
            if (verbose) {
                logger_1.logger.error('Failed to get map status', error);
            }
            throw error;
        }
    }
}
exports.DaemonManager = DaemonManager;
//# sourceMappingURL=manager.js.map