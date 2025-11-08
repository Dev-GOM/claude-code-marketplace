"use strict";
/**
 * Daemon Process Manager
 * Handles starting, stopping, and checking status of the Browser Pilot Daemon
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaemonManager = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const net = __importStar(require("net"));
const config_1 = require("../cdp/config");
const client_1 = require("./client");
const protocol_1 = require("./protocol");
const logger_1 = require("../utils/logger");
const timestamp_1 = require("../utils/timestamp");
const constants_1 = require("../constants");
class DaemonManager {
    outputDir;
    pidPath;
    socketPath;
    cachedPid = null;
    PID_CACHE_TTL = 1000; // 1 second
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
     * Start daemon process with retry and port fallback
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
        // Try starting with retry logic
        const maxRetries = 2;
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Prepare environment variables
                const env = { ...process.env };
                if (initialUrl) {
                    env.BP_INITIAL_URL = initialUrl;
                    if (verbose && attempt === 1) {
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
                return; // Success!
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (verbose) {
                    console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
                }
                // Stop any partially started daemon
                if (this.isRunning()) {
                    if (verbose) {
                        console.log('🛑 Stopping partially started daemon...');
                    }
                    try {
                        await this.stop({ verbose: false, force: true });
                    }
                    catch (stopError) {
                        const errorMessage = stopError instanceof Error ? stopError.message : String(stopError);
                        logger_1.logger.warn(`Failed to stop partially started daemon: ${errorMessage}`);
                        // Continue to next retry
                    }
                }
                // On last retry, try changing port
                if (attempt === maxRetries) {
                    if (verbose) {
                        console.log('🔄 Attempting automatic port change...');
                    }
                    try {
                        await this.changePortAutomatically(verbose);
                        // One more attempt with new port
                        if (verbose) {
                            console.log('🚀 Retrying with new port...');
                        }
                        const env = { ...process.env };
                        if (initialUrl) {
                            env.BP_INITIAL_URL = initialUrl;
                        }
                        const daemon = (0, child_process_1.spawn)(process.execPath, [serverPath], {
                            detached: true,
                            stdio: 'ignore',
                            cwd: process.cwd(),
                            env
                        });
                        daemon.unref();
                        await this.waitForDaemon(constants_1.DAEMON.IPC_TIMEOUT);
                        if (verbose) {
                            console.log('✓ Daemon started successfully with new port');
                        }
                        return; // Success with new port!
                    }
                    catch (portChangeError) {
                        if (verbose) {
                            console.log(`⚠️  Port change also failed: ${portChangeError.message}`);
                        }
                    }
                }
                // Wait a bit before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        // All retries failed
        throw new Error(`Failed to start daemon after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown'}`);
    }
    /**
     * Change port automatically to find available port
     */
    async changePortAutomatically(verbose) {
        const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
        const projectName = (0, path_1.basename)(projectRoot);
        const config = (0, config_1.loadSharedConfig)();
        const projectConfig = config.projects[projectName];
        if (!projectConfig) {
            throw new Error('Project configuration not found');
        }
        const oldPort = projectConfig.port;
        const newPort = await this.findAvailablePort(oldPort);
        if (verbose) {
            console.log(`📍 Changing port: ${oldPort} → ${newPort}`);
        }
        projectConfig.port = newPort;
        projectConfig.lastUsed = (0, timestamp_1.getLocalTimestamp)();
        (0, config_1.saveSharedConfig)(config);
    }
    /**
     * Find available port starting from base + 1
     */
    async findAvailablePort(basePort) {
        const MAX_PORTS = 100;
        const timeout = 10000; // 10 seconds total timeout
        const startTime = Date.now();
        for (let port = basePort + 1; port < basePort + MAX_PORTS; port++) {
            if (Date.now() - startTime > timeout) {
                throw new Error('Timeout while searching for available port');
            }
            if (await this.isPortAvailable(port)) {
                return port;
            }
        }
        throw new Error(`No available ports found in range ${basePort + 1}-${basePort + MAX_PORTS}`);
    }
    /**
     * Check if port is available
     */
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            let resolved = false;
            const cleanup = () => {
                if (!resolved) {
                    resolved = true;
                    try {
                        server.close();
                    }
                    catch (error) {
                        // Ignore close errors
                    }
                }
            };
            const timeout = setTimeout(() => {
                cleanup();
                resolve(false); // Timeout = not available
            }, 2000);
            server.once('error', () => {
                clearTimeout(timeout);
                cleanup();
                resolve(false);
            });
            server.once('listening', () => {
                clearTimeout(timeout);
                cleanup();
                resolve(true);
            });
            server.listen(port, '127.0.0.1');
        });
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
            // Process doesn't exist, clean up stale PID file and invalidate cache
            this.cachedPid = null;
            if ((0, fs_1.existsSync)(this.pidPath)) {
                (0, fs_1.unlinkSync)(this.pidPath);
            }
            return false;
        }
    }
    /**
     * Get daemon PID from PID file (with caching)
     */
    getPid() {
        // Use cached value if available and fresh
        if (this.cachedPid && Date.now() - this.cachedPid.timestamp < this.PID_CACHE_TTL) {
            return this.cachedPid.pid;
        }
        if (!(0, fs_1.existsSync)(this.pidPath)) {
            this.cachedPid = { pid: null, timestamp: Date.now() };
            return null;
        }
        try {
            const pidStr = (0, fs_1.readFileSync)(this.pidPath, 'utf-8').trim();
            const pid = parseInt(pidStr, 10);
            const result = isNaN(pid) ? null : pid;
            this.cachedPid = { pid: result, timestamp: Date.now() };
            return result;
        }
        catch (_error) {
            this.cachedPid = { pid: null, timestamp: Date.now() };
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