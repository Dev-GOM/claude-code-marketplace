"use strict";
/**
 * Browser Pilot Daemon Server
 * Maintains persistent CDP connection and handles IPC requests from CLI
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
exports.DaemonServer = void 0;
const net_1 = require("net");
const path_1 = require("path");
const fs_1 = require("fs");
const browser_1 = require("../cdp/browser");
const config_1 = require("../cdp/config");
const wait_1 = require("../cdp/actions/wait");
const protocol_1 = require("./protocol");
const map_manager_1 = require("./map-manager");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
const handlers = __importStar(require("./handlers"));
const navigation_handlers_1 = require("./handlers/navigation-handlers");
class DaemonServer {
    server = null;
    browser = null;
    socketPath;
    pidPath;
    outputDir;
    idleTimeout = null;
    lastActivity = Date.now();
    startTime = Date.now();
    isShuttingDown = false;
    mapManager = null;
    pendingNetworkRequests = new Set();
    mapGenerationInProgress = false;
    constructor() {
        this.outputDir = (0, config_1.getOutputDir)();
        this.socketPath = this.getSocketPath();
        this.pidPath = (0, path_1.join)(this.outputDir, protocol_1.PID_FILENAME);
        this.mapManager = new map_manager_1.MapManager(this.outputDir);
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
     * Start daemon server
     */
    async start() {
        // Enable file logging for daemon
        const logFile = (0, path_1.join)(this.outputDir, 'daemon.log');
        logger_1.logger.enableFileLogging(logFile);
        logger_1.logger.info('🚀 Browser Pilot Daemon starting...');
        logger_1.logger.info(`Log file: ${logFile}`);
        // Check if already running
        if (this.isAlreadyRunning()) {
            throw new protocol_1.IPCError('Daemon already running', protocol_1.IPCErrorCodes.DAEMON_ALREADY_RUNNING);
        }
        // Clean up stale socket file (Unix only)
        if (process.platform !== 'win32' && (0, fs_1.existsSync)(this.socketPath)) {
            (0, fs_1.unlinkSync)(this.socketPath);
        }
        // Initialize browser connection
        logger_1.logger.info('Starting Browser Pilot Daemon...');
        this.browser = new browser_1.ChromeBrowser(false);
        try {
            // Try to connect to existing browser first
            await this.browser.connect();
            logger_1.logger.info('Connected to existing Chrome instance');
        }
        catch (_error) {
            // If no browser running, launch new one
            const initialUrl = process.env.BP_INITIAL_URL;
            if (initialUrl) {
                logger_1.logger.info(`Launching new Chrome instance with initial URL: ${initialUrl}`);
                await this.browser.launch(initialUrl);
                // Clear environment variable after use
                delete process.env.BP_INITIAL_URL;
            }
            else {
                logger_1.logger.info('Launching new Chrome instance...');
                await this.browser.launch();
            }
            logger_1.logger.info('Chrome launched successfully');
        }
        // Set up Page domain for navigation events
        await this.setupPageDomain();
        // Set up Network tracking for auto-wait
        await this.setupNetworkTracking();
        // Auto-restore last visited URL if enabled
        await this.autoRestoreUrl();
        // Create IPC server
        this.server = (0, net_1.createServer)((socket) => this.handleConnection(socket));
        // Start listening
        this.server.listen(this.socketPath, () => {
            logger_1.logger.info(`IPC server listening on ${this.socketPath}`);
            this.writePidFile();
            this.startIdleTimer();
            logger_1.logger.info('Browser Pilot Daemon is ready');
        });
        // Handle server errors
        this.server.on('error', (error) => {
            logger_1.logger.error('Server error', error);
            this.shutdown();
        });
        // Setup graceful shutdown
        // Use async wrapper to properly await shutdown completion
        process.on('SIGINT', () => {
            this.shutdown().catch((error) => {
                logger_1.logger.error('Error during SIGINT shutdown', error);
                process.exit(1);
            });
        });
        process.on('SIGTERM', () => {
            this.shutdown().catch((error) => {
                logger_1.logger.error('Error during SIGTERM shutdown', error);
                process.exit(1);
            });
        });
    }
    /**
     * Auto-restore last visited URL if enabled
     */
    async autoRestoreUrl() {
        if (!this.browser)
            return;
        try {
            // Load shared config
            const config = (0, config_1.loadSharedConfig)();
            const projectRoot = process.cwd();
            const projectName = (0, path_1.basename)(projectRoot);
            const projectConfig = config.projects[projectName];
            // Check if autoRestore is enabled (default: true)
            const autoRestore = projectConfig?.autoRestore !== false;
            if (!autoRestore) {
                logger_1.logger.debug('Auto-restore disabled, skipping URL restoration');
                return;
            }
            // Load last visited URL
            const lastUrl = (0, navigation_handlers_1.loadLastUrl)(this.outputDir);
            if (!lastUrl) {
                logger_1.logger.debug('No last URL found, skipping restoration');
                return;
            }
            logger_1.logger.info(`🔄 Auto-restoring last visited URL: ${lastUrl}`);
            // Navigate to last URL
            await this.browser.sendCommand('Page.navigate', { url: lastUrl });
            logger_1.logger.info('✅ URL restored successfully');
        }
        catch (error) {
            logger_1.logger.warn(`Failed to auto-restore URL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Setup Page domain for navigation events
     */
    async setupPageDomain() {
        if (!this.browser)
            return;
        try {
            await this.browser.sendCommand('Page.enable');
            // Listen for frame navigation to auto-clear console
            this.browser.client?.on('Page.frameNavigated', (params) => {
                // Only process main frame navigation (no parent)
                if (!params.frame.parentId) {
                    logger_1.logger.info(`🔄 Main frame navigated to: ${params.frame.url}`);
                    if (this.browser) {
                        this.browser.clearConsoleMessages();
                        this.browser.clearNetworkErrors();
                    }
                }
            });
            // Listen for page load complete to ensure stable DOM
            this.browser.client?.on('Page.loadEventFired', async () => {
                logger_1.logger.info('📄 Page load complete');
                await this.generateMapAfterStabilization();
            });
            // Listen for SPA navigation (History API usage)
            this.browser.client?.on('Page.navigatedWithinDocument', async (params) => {
                // Ignore fragment navigation (same page anchor links)
                if (params.navigationType === 'fragment') {
                    logger_1.logger.debug(`🔗 Fragment navigation ignored: ${params.url}`);
                    return;
                }
                // SPA routing detected (History API: pushState/replaceState)
                logger_1.logger.info(`🔄 SPA navigation detected (${params.navigationType}): ${params.url}`);
                // Clear console/network errors for new route
                if (this.browser) {
                    this.browser.clearConsoleMessages();
                    this.browser.clearNetworkErrors();
                }
                // Generate map after DOM stabilization (skip loadEventFired for SPA)
                await this.generateMapAfterStabilization(true);
            });
            logger_1.logger.info('Page navigation listeners enabled (full page + SPA)');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.warn(`Could not enable Page domain: ${errorMessage}`);
        }
    }
    /**
     * Setup network request tracking
     */
    async setupNetworkTracking() {
        if (!this.browser)
            return;
        try {
            await this.browser.sendCommand('Network.enable');
            this.browser.client?.on('Network.requestWillBeSent', (params) => {
                logger_1.logger.debug(`📡 Network request: ${params.type} → ${params.request?.url || 'unknown'}`);
                if (params.type === 'XHR' || params.type === 'Fetch') {
                    this.pendingNetworkRequests.add(params.requestId);
                    logger_1.logger.info(`📤 XHR/Fetch started: ${params.request?.url || 'unknown'} (${this.pendingNetworkRequests.size} pending)`);
                }
            });
            this.browser.client?.on('Network.responseReceived', (params) => {
                if (this.pendingNetworkRequests.has(params.requestId)) {
                    this.pendingNetworkRequests.delete(params.requestId);
                    logger_1.logger.info(`📥 XHR/Fetch completed (${this.pendingNetworkRequests.size} pending)`);
                }
            });
            this.browser.client?.on('Network.loadingFailed', (params) => {
                if (this.pendingNetworkRequests.has(params.requestId)) {
                    this.pendingNetworkRequests.delete(params.requestId);
                    logger_1.logger.info(`❌ XHR/Fetch failed (${this.pendingNetworkRequests.size} pending)`);
                }
            });
            logger_1.logger.info('Network tracking enabled');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.warn(`Could not enable Network tracking: ${errorMessage}`);
        }
    }
    /**
     * Generate map after DOM stabilization
     * @param skipLoadEvent Skip waiting for Page.loadEventFired (for SPA navigation)
     */
    async generateMapAfterStabilization(skipLoadEvent = false) {
        if (!this.mapManager || !this.browser)
            return;
        // Prevent concurrent map generation
        if (this.mapGenerationInProgress) {
            logger_1.logger.debug(`⏭️  Skipping map generation (already in progress)`);
            return;
        }
        this.mapGenerationInProgress = true;
        try {
            logger_1.logger.debug(`🔨 Map generation requested (skipLoadEvent: ${skipLoadEvent})`);
            // Mark map as not ready while generating (for chain commands)
            if (this.mapManager) {
                this.mapManager.setMapReady(false);
                logger_1.logger.debug('📝 Map marked as not ready (generating...)');
            }
            // Wait for Page.loadEventFired only for full page loads
            if (!skipLoadEvent) {
                await new Promise((resolve) => {
                    const onLoad = () => {
                        this.browser?.client?.off('Page.loadEventFired', onLoad);
                        logger_1.logger.debug('✓ Page load event fired');
                        resolve();
                    };
                    // Add listener
                    this.browser?.client?.once('Page.loadEventFired', onLoad);
                    // Timeout fallback
                    setTimeout(() => {
                        this.browser?.client?.off('Page.loadEventFired', onLoad);
                        logger_1.logger.warn('⚠️  Page load event timeout, continuing anyway');
                        resolve();
                    }, 5000);
                });
            }
            else {
                logger_1.logger.info('⏭️  Skipping Page.loadEventFired (SPA navigation)');
                // Wait for React/Vue to start making network requests after SPA navigation
                logger_1.logger.info('⏳ Waiting for SPA to start network requests (100ms)...');
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Wait for network idle (all XHR/Fetch requests complete)
            logger_1.logger.info('⏳ Waiting for network idle...');
            const networkIdleStart = Date.now();
            const networkIdleTimeout = 10000; // 10s max wait
            while (this.pendingNetworkRequests.size > 0) {
                if (Date.now() - networkIdleStart > networkIdleTimeout) {
                    logger_1.logger.warn(`⚠️  Network idle timeout (${this.pendingNetworkRequests.size} requests still pending)`);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (this.pendingNetworkRequests.size === 0) {
                logger_1.logger.info(`✓ Network idle (waited ${Date.now() - networkIdleStart}ms)`);
            }
            // Wait for browser to be idle (React/Vue rendering complete)
            logger_1.logger.info('⏳ Waiting for browser idle (rendering complete)...');
            const idleScript = `
        new Promise((resolve) => {
          const startTime = Date.now();

          if (typeof requestIdleCallback !== 'undefined') {
            // Browser supports requestIdleCallback
            const idleId = requestIdleCallback(() => {
              resolve({ waited: Date.now() - startTime });
            }, { timeout: 2000 });

            // Safety timeout
            setTimeout(() => {
              cancelIdleCallback(idleId);
              resolve({ waited: Date.now() - startTime, timeout: true });
            }, 3000);
          } else {
            // Fallback for browsers without requestIdleCallback (Safari)
            setTimeout(() => {
              resolve({ waited: Date.now() - startTime, fallback: true });
            }, 0);
          }
        })
      `;
            try {
                const result = await this.browser.sendCommand('Runtime.evaluate', {
                    expression: idleScript,
                    awaitPromise: true,
                    returnByValue: true
                });
                const data = result.result?.value;
                if (data.timeout) {
                    logger_1.logger.info(`✓ Browser idle timeout (waited ${data.waited}ms)`);
                }
                else if (data.fallback) {
                    logger_1.logger.info(`✓ Browser idle fallback (waited ${data.waited}ms)`);
                }
                else {
                    logger_1.logger.info(`✓ Browser idle (waited ${data.waited}ms)`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger_1.logger.warn(`⚠️  Browser idle check failed: ${errorMessage}`);
            }
            // Wait for DOM to stabilize (100ms of no mutations)
            await (0, wait_1.waitForDomStable)(this.browser, 100, 10000, { verbose: false });
            logger_1.logger.info('✓ DOM stabilized');
            // Check again for pending network requests (may have started during DOM stabilization)
            if (this.pendingNetworkRequests.size > 0) {
                logger_1.logger.info(`⏳ Waiting for network requests triggered during DOM stabilization (${this.pendingNetworkRequests.size} pending)...`);
                const postDomNetworkStart = Date.now();
                const postDomNetworkTimeout = 10000;
                while (this.pendingNetworkRequests.size > 0) {
                    if (Date.now() - postDomNetworkStart > postDomNetworkTimeout) {
                        logger_1.logger.warn(`⚠️  Post-DOM network idle timeout (${this.pendingNetworkRequests.size} requests still pending)`);
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                if (this.pendingNetworkRequests.size === 0) {
                    logger_1.logger.info(`✓ Post-DOM network idle (waited ${Date.now() - postDomNetworkStart}ms)`);
                }
            }
            logger_1.logger.info('✓ Generating interaction map...');
            // Generate map with debounce
            await this.mapManager.generateMapSerially(this.browser, false).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger_1.logger.warn(`⚠️  Auto map generation failed: ${errorMessage}`);
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.warn(`⚠️  DOM stabilization failed: ${errorMessage}`);
        }
        finally {
            // Release lock
            this.mapGenerationInProgress = false;
        }
    }
    /**
     * Check if daemon is already running
     */
    isAlreadyRunning() {
        if (!(0, fs_1.existsSync)(this.pidPath)) {
            return false;
        }
        try {
            const pidStr = require('fs').readFileSync(this.pidPath, 'utf-8');
            const pid = parseInt(pidStr, 10);
            // Check if process with this PID exists
            process.kill(pid, 0); // Signal 0 checks existence without killing
            return true;
        }
        catch (_error) {
            // Process doesn't exist, clean up stale PID file
            (0, fs_1.unlinkSync)(this.pidPath);
            return false;
        }
    }
    /**
     * Write PID file
     */
    writePidFile() {
        (0, fs_1.writeFileSync)(this.pidPath, String(process.pid), 'utf-8');
    }
    /**
     * Start idle timer for auto-shutdown
     */
    startIdleTimer() {
        this.resetIdleTimer();
    }
    /**
     * Reset idle timer
     */
    resetIdleTimer() {
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
        }
        this.idleTimeout = setTimeout(() => {
            const idleTime = Date.now() - this.lastActivity;
            const idleSeconds = Math.floor(idleTime / constants_1.TIME_CONVERSION.MS_PER_SECOND);
            logger_1.logger.info(`⏱️  Idle for ${idleSeconds}s, shutting down...`);
            this.shutdown();
        }, protocol_1.IDLE_SHUTDOWN_TIMEOUT);
    }
    /**
     * Handle client connection
     */
    handleConnection(socket) {
        logger_1.logger.debug('🔗 Client connected');
        let buffer = '';
        socket.on('data', async (data) => {
            buffer += data.toString();
            // Process complete JSON messages (delimited by newline)
            const messages = buffer.split('\n');
            buffer = messages.pop() || ''; // Keep incomplete message in buffer
            for (const message of messages) {
                if (!message.trim())
                    continue;
                try {
                    const request = JSON.parse(message);
                    const response = await this.handleRequest(request);
                    socket.write(JSON.stringify(response) + '\n');
                }
                catch (error) {
                    const errorResponse = {
                        id: 'unknown',
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    };
                    socket.write(JSON.stringify(errorResponse) + '\n');
                }
            }
        });
        socket.on('end', () => {
            logger_1.logger.info('Client disconnected');
        });
        socket.on('error', (error) => {
            logger_1.logger.error('Socket error', error);
        });
    }
    /**
     * Handle IPC request
     */
    async handleRequest(request) {
        this.lastActivity = Date.now();
        this.resetIdleTimer();
        logger_1.logger.debug(`📨 Received command: ${request.command}`);
        if (!this.browser) {
            return {
                id: request.id,
                success: false,
                error: 'Browser not connected'
            };
        }
        try {
            let result;
            // Create handler context
            const context = {
                browser: this.browser,
                mapManager: this.mapManager || undefined,
                outputDir: this.outputDir
            };
            switch (request.command) {
                // Navigation commands
                case 'navigate':
                    result = await handlers.handleNavigate(context, request.params);
                    break;
                case 'back':
                    result = await handlers.handleBack(context, request.params);
                    break;
                case 'forward':
                    result = await handlers.handleForward(context, request.params);
                    break;
                case 'reload':
                    result = await handlers.handleReload(context, request.params);
                    break;
                // Interaction commands
                case 'click':
                    result = await handlers.handleClick(context, request.params);
                    break;
                case 'fill':
                    result = await handlers.handleFill(context, request.params);
                    break;
                case 'hover':
                    result = await handlers.handleHover(context, request.params);
                    break;
                case 'press':
                    result = await handlers.handlePress(context, request.params);
                    break;
                case 'type':
                    result = await handlers.handleType(context, request.params);
                    break;
                // Capture commands
                case 'screenshot':
                    result = await handlers.handleScreenshot(context, request.params);
                    break;
                case 'pdf':
                    result = await handlers.handlePdf(context, request.params);
                    break;
                case 'set-viewport':
                    result = await handlers.handleSetViewport(context, request.params);
                    break;
                case 'get-viewport':
                    result = await handlers.handleGetViewport(context, request.params);
                    break;
                case 'get-screen-info':
                    result = await handlers.handleGetScreenInfo(context, request.params);
                    break;
                // Data commands
                case 'extract':
                    result = await handlers.handleExtract(context, request.params);
                    break;
                case 'content':
                    result = await handlers.handleContent(context, request.params);
                    break;
                case 'find':
                    result = await handlers.handleFind(context, request.params);
                    break;
                case 'eval':
                    result = await handlers.handleEval(context, request.params);
                    break;
                // Map commands
                case 'query-map':
                    result = await handlers.handleQueryMap(context, request.params);
                    break;
                case 'generate-map':
                    result = await handlers.handleGenerateMap(context, request.params);
                    break;
                case 'get-map-status':
                    result = await handlers.handleGetMapStatus(context, request.params);
                    break;
                // Utility commands
                case 'scroll':
                    result = await handlers.handleScroll(context, request.params);
                    break;
                case 'wait':
                    result = await handlers.handleWait(context, request.params);
                    break;
                case 'console':
                    result = await handlers.handleConsole(context, request.params);
                    break;
                case 'status':
                    result = await handlers.handleStatus(context, request.params, this.startTime, this.lastActivity);
                    break;
                // Daemon management
                case 'shutdown':
                    setImmediate(() => this.shutdown());
                    result = { message: 'Daemon shutting down...' };
                    break;
                default:
                    throw new protocol_1.IPCError(`Unknown command: ${request.command}`, protocol_1.IPCErrorCodes.INVALID_REQUEST);
            }
            return {
                id: request.id,
                success: true,
                data: result
            };
        }
        catch (error) {
            logger_1.logger.error(`Command failed: ${request.command}`, error);
            return {
                id: request.id,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.isShuttingDown)
            return;
        this.isShuttingDown = true;
        logger_1.logger.info('Shutting down Browser Pilot Daemon...');
        // Stop idle timer
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
        }
        // Remove process signal listeners
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');
        // Close browser first
        if (this.browser) {
            try {
                await this.browser.close();
                logger_1.logger.info('Browser closed');
            }
            catch (error) {
                logger_1.logger.error('Error closing browser', error);
            }
        }
        // Close IPC server (wait for all connections to close with timeout)
        if (this.server) {
            const server = this.server;
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    logger_1.logger.warn('IPC server close timed out after 2 seconds. Continuing shutdown.');
                    resolve();
                }, 2000);
                server.close((err) => {
                    clearTimeout(timeout);
                    if (err) {
                        logger_1.logger.error('Error closing IPC server', err);
                    }
                    else {
                        logger_1.logger.info('IPC server closed');
                    }
                    resolve();
                });
            });
        }
        // Clean up socket file (Unix only) - safe after server.close() completes
        if (process.platform !== 'win32' && (0, fs_1.existsSync)(this.socketPath)) {
            try {
                (0, fs_1.unlinkSync)(this.socketPath);
                logger_1.logger.info('Socket file removed');
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger_1.logger.warn(`Failed to remove socket file: ${errorMsg}`);
            }
        }
        // Remove PID file
        if ((0, fs_1.existsSync)(this.pidPath)) {
            (0, fs_1.unlinkSync)(this.pidPath);
            logger_1.logger.info('PID file removed');
        }
        // Remove interaction map cache files
        const mapPath = (0, path_1.join)(this.outputDir, 'interaction-map.json');
        const mapCachePath = (0, path_1.join)(this.outputDir, 'map-cache.json');
        if ((0, fs_1.existsSync)(mapPath)) {
            try {
                (0, fs_1.unlinkSync)(mapPath);
                logger_1.logger.info('Interaction map cache removed');
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger_1.logger.warn(`Failed to remove interaction map: ${errorMsg}`);
            }
        }
        if ((0, fs_1.existsSync)(mapCachePath)) {
            try {
                (0, fs_1.unlinkSync)(mapCachePath);
                logger_1.logger.info('Map cache metadata removed');
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger_1.logger.warn(`Failed to remove map cache metadata: ${errorMsg}`);
            }
        }
        // Remove shutdown request flag (if exists from SessionEnd)
        // This flag is created by SessionEnd (cleanup-config.js) to track daemon shutdown
        const shutdownFlagPath = (0, path_1.join)(this.outputDir, 'daemon-to-stop.pid');
        if ((0, fs_1.existsSync)(shutdownFlagPath)) {
            try {
                (0, fs_1.unlinkSync)(shutdownFlagPath);
                logger_1.logger.info('Shutdown request flag removed');
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger_1.logger.warn(`Failed to remove shutdown flag: ${errorMsg}`);
                // Fallback: Mark as COMPLETED so next SessionStart knows shutdown succeeded
                // Even if file can't be deleted (Windows file lock), marking it prevents force-kill attempt
                try {
                    const { writeFileSync } = require('fs');
                    writeFileSync(shutdownFlagPath, `COMPLETED:${process.pid}`, 'utf-8');
                    logger_1.logger.info('Marked shutdown flag as COMPLETED (deletion failed due to file lock)');
                }
                catch (_writeError) {
                    logger_1.logger.error('Failed to mark shutdown flag as COMPLETED');
                }
            }
        }
        logger_1.logger.info('Daemon shutdown complete');
        process.exit(0);
    }
    /**
     * Get current browser instance (for testing)
     */
    get currentBrowser() {
        return this.browser;
    }
    /**
     * Expose client property for Page event listener
     */
    get client() {
        return this.browser?.client;
    }
}
exports.DaemonServer = DaemonServer;
// Start daemon if run directly
if (require.main === module) {
    const daemon = new DaemonServer();
    daemon.start().catch((error) => {
        logger_1.logger.error('Failed to start daemon', error);
        process.exit(1);
    });
}
//# sourceMappingURL=server.js.map