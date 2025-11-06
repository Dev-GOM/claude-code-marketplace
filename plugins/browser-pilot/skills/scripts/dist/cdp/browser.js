"use strict";
/**
 * Chrome browser launcher and connection manager.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromeBrowser = void 0;
const child_process_1 = require("child_process");
const os_1 = require("os");
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = require("./client");
const config_1 = require("./config");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
class ChromeBrowser {
    headless;
    debugPort = null;
    chromeProcess = null;
    client = null;
    consoleMessages = [];
    networkErrors = [];
    MAX_CONSOLE_MESSAGES = constants_1.TIMING.MAP_CACHE_TTL / 600; // 1000 messages (10min / 600ms)
    MAX_NETWORK_ERRORS = constants_1.TIMING.MAP_CACHE_TTL / 600; // 1000 errors
    pendingRequests = new Map();
    REQUEST_TIMEOUT = constants_1.TIMING.DAEMON_IDLE_TIMEOUT / 30; // ~60 seconds
    cleanupInterval = null;
    eventListeners = new Map();
    constructor(headless = false) {
        this.headless = headless;
        // Debug port will be loaded from shared config in launch/connect methods
    }
    /**
     * Add console message with size limit to prevent memory issues.
     */
    addConsoleMessage(message) {
        this.consoleMessages.push(message);
        // Keep only the most recent messages
        if (this.consoleMessages.length > this.MAX_CONSOLE_MESSAGES) {
            this.consoleMessages = this.consoleMessages.slice(-this.MAX_CONSOLE_MESSAGES);
        }
    }
    /**
     * Add network error with size limit to prevent memory issues.
     */
    addNetworkError(error) {
        this.networkErrors.push(error);
        // Keep only the most recent errors
        if (this.networkErrors.length > this.MAX_NETWORK_ERRORS) {
            this.networkErrors = this.networkErrors.slice(-this.MAX_NETWORK_ERRORS);
        }
    }
    /**
     * Clean up stale pending requests to prevent memory leak.
     */
    cleanupStaleRequests() {
        const now = Date.now();
        for (const [requestId, request] of this.pendingRequests.entries()) {
            if (request.processed || (now - request.timestamp > this.REQUEST_TIMEOUT)) {
                this.pendingRequests.delete(requestId);
            }
        }
    }
    /**
     * Find Chrome executable path.
     */
    getChromePath() {
        const system = (0, os_1.platform)();
        let paths = [];
        if (system === 'win32') {
            paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                (0, path_1.join)((0, os_1.homedir)(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe')
            ];
        }
        else if (system === 'darwin') {
            paths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            ];
        }
        else {
            paths = [
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium'
            ];
        }
        for (const path of paths) {
            if ((0, fs_1.existsSync)(path)) {
                return path;
            }
        }
        throw new Error('Chrome not found. Please install Google Chrome.');
    }
    /**
     * Connect to already running Chrome instance.
     */
    async connect() {
        // Get project port from shared config
        const port = await (0, config_1.getProjectPort)();
        // Check if the port is in use (browser running)
        const portAvailable = await (0, config_1.isPortAvailable)(port);
        if (!portAvailable) {
            // Port is in use, browser is running
            this.debugPort = port;
            logger_1.logger.info(`Connecting to existing Chrome on port ${this.debugPort}...`);
            await this.connectToPage();
            (0, config_1.updateProjectLastUsed)();
            return;
        }
        // No running browser found
        throw new Error(`No running browser found on port ${port}`);
    }
    /**
     * Launch Chrome in debugging mode.
     * @param initialUrl - Optional initial URL to open (defaults to about:blank)
     */
    async launch(initialUrl) {
        // Get project port from shared config (auto-creates if not exists)
        this.debugPort = await (0, config_1.getProjectPort)();
        const chromePath = this.getChromePath();
        const args = [
            `--remote-debugging-port=${this.debugPort}`,
            '--remote-allow-origins=*',
            '--no-first-run',
            '--no-default-browser-check',
            `--user-data-dir=${(0, path_1.join)((0, os_1.homedir)(), `.cdp_browser_profile_${this.debugPort}`)}`
        ];
        if (this.headless) {
            args.push('--headless=new', '--disable-gpu');
        }
        // Add initial URL or default to blank page
        if (initialUrl) {
            args.push(initialUrl);
            logger_1.logger.info(`Launching Chrome with initial URL: ${initialUrl}`);
        }
        else {
            args.push('about:blank');
        }
        logger_1.logger.info(`Launching Chrome on port ${this.debugPort} (headless: ${this.headless})...`);
        this.chromeProcess = (0, child_process_1.spawn)(chromePath, args, {
            stdio: 'ignore',
            detached: true
        });
        // Detach the process so it continues running when Node exits
        this.chromeProcess.unref();
        // Update last used timestamp
        (0, config_1.updateProjectLastUsed)();
        // Wait for Chrome to be ready by polling the JSON endpoint
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds (20 * 500ms)
        let connected = false;
        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`http://${constants_1.CDP.LOCALHOST}:${this.debugPort}/json/version`);
                if (response.ok) {
                    connected = true;
                    break;
                }
            }
            catch (_error) {
                // Connection may be refused while browser is starting up
            }
            attempts++;
            await this.sleep(constants_1.TIMING.NETWORK_IDLE_TIMEOUT);
        }
        if (!connected) {
            throw new Error(`Failed to connect to Chrome within the timeout period (${maxAttempts * constants_1.TIMING.NETWORK_IDLE_TIMEOUT / constants_1.TIMING.ACTION_DELAY_NAVIGATION} seconds).`);
        }
        // Connect to page target
        await this.connectToPage();
    }
    /**
     * Connect to a Chrome page target.
     */
    async connectToPage() {
        try {
            // Get list of targets
            const url = `http://${constants_1.CDP.LOCALHOST}:${this.debugPort}/json`;
            const response = await fetch(url);
            const targets = await response.json();
            // Find or create a page target
            let pageTarget = targets.find(t => t.type === 'page');
            if (!pageTarget) {
                // Create new target
                const newUrl = `http://${constants_1.CDP.LOCALHOST}:${this.debugPort}/json/new`;
                const newResponse = await fetch(newUrl);
                pageTarget = await newResponse.json();
            }
            const wsUrl = pageTarget.webSocketDebuggerUrl;
            logger_1.logger.info(`Connecting to: ${wsUrl}`);
            this.client = new client_1.CDPClient(wsUrl);
            await this.client.connect();
            logger_1.logger.info('Connected to Chrome DevTools Protocol');
            // Enable Log domain to receive console messages
            await this.client.sendCommand('Log.enable');
            await this.client.sendCommand('Runtime.enable');
            // Enable Network domain to track network errors
            await this.client.sendCommand('Network.enable');
            // Set up event listeners with references for cleanup
            const logEntryHandler = (params) => {
                const entry = params.entry;
                this.addConsoleMessage({
                    level: entry.level || 'log',
                    text: entry.text || '',
                    timestamp: entry.timestamp || Date.now(),
                    url: entry.url,
                    lineNumber: entry.lineNumber,
                    stackTrace: entry.stackTrace
                });
            };
            const consoleApiHandler = (params) => {
                const args = params.args || [];
                const text = args.map((arg) => arg.value || arg.description || '').join(' ');
                this.addConsoleMessage({
                    level: params.type || 'log',
                    text: text,
                    timestamp: params.timestamp || Date.now(),
                    url: params.stackTrace?.callFrames?.[0]?.url,
                    lineNumber: params.stackTrace?.callFrames?.[0]?.lineNumber
                });
            };
            const exceptionHandler = (params) => {
                const exception = params.exceptionDetails;
                const text = exception.exception?.description || exception.text || 'Unknown error';
                this.addConsoleMessage({
                    level: 'error',
                    text: text,
                    timestamp: exception.timestamp || Date.now(),
                    url: exception.url,
                    lineNumber: exception.lineNumber,
                    stackTrace: exception.stackTrace
                });
            };
            const requestWillBeSentHandler = (params) => {
                this.pendingRequests.set(params.requestId, {
                    url: params.request.url,
                    timestamp: params.timestamp !== undefined ? params.timestamp * constants_1.TIMING.ACTION_DELAY_NAVIGATION : Date.now(),
                    processed: false
                });
            };
            const loadingFailedHandler = (params) => {
                const request = this.pendingRequests.get(params.requestId);
                if (request && !request.processed && !params.canceled) {
                    this.addNetworkError({
                        url: request.url,
                        errorText: params.errorText,
                        timestamp: params.timestamp !== undefined ? params.timestamp * constants_1.TIMING.ACTION_DELAY_NAVIGATION : Date.now(),
                        requestId: params.requestId
                    });
                    request.processed = true;
                }
            };
            const responseReceivedHandler = (params) => {
                const { requestId, response } = params;
                const request = this.pendingRequests.get(requestId);
                if (request && !request.processed && response.status >= 400) {
                    this.addNetworkError({
                        url: response.url,
                        errorText: `HTTP ${response.status} ${response.statusText}`,
                        timestamp: Date.now(),
                        statusCode: response.status,
                        requestId: requestId
                    });
                    request.processed = true;
                }
            };
            // Register event listeners
            this.client.on('Log.entryAdded', logEntryHandler);
            this.eventListeners.set('Log.entryAdded', logEntryHandler);
            this.client.on('Runtime.consoleAPICalled', consoleApiHandler);
            this.eventListeners.set('Runtime.consoleAPICalled', consoleApiHandler);
            this.client.on('Runtime.exceptionThrown', exceptionHandler);
            this.eventListeners.set('Runtime.exceptionThrown', exceptionHandler);
            this.client.on('Network.requestWillBeSent', requestWillBeSentHandler);
            this.eventListeners.set('Network.requestWillBeSent', requestWillBeSentHandler);
            this.client.on('Network.loadingFailed', loadingFailedHandler);
            this.eventListeners.set('Network.loadingFailed', loadingFailedHandler);
            this.client.on('Network.responseReceived', responseReceivedHandler);
            this.eventListeners.set('Network.responseReceived', responseReceivedHandler);
            // Start periodic cleanup of stale requests
            this.cleanupInterval = setInterval(() => this.cleanupStaleRequests(), constants_1.TIMING.POLLING_INTERVAL_SLOW * 10);
        }
        catch (error) {
            throw new Error(`Failed to connect to Chrome: ${error}`);
        }
    }
    /**
     * Send CDP command.
     */
    async sendCommand(method, params) {
        if (!this.client) {
            throw new Error('Not connected to Chrome');
        }
        return this.client.sendCommand(method, params);
    }
    /**
     * Get collected console messages.
     */
    getConsoleMessages() {
        return [...this.consoleMessages];
    }
    /**
     * Clear console messages buffer.
     */
    clearConsoleMessages() {
        this.consoleMessages = [];
    }
    /**
     * Get collected network errors.
     */
    getNetworkErrors() {
        return [...this.networkErrors];
    }
    /**
     * Clear network errors buffer.
     */
    clearNetworkErrors() {
        this.networkErrors = [];
    }
    /**
     * Close browser and cleanup.
     */
    async close() {
        logger_1.logger.info('Closing browser...');
        // Stop cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        // Remove all event listeners
        for (const [event, handler] of this.eventListeners.entries()) {
            this.client?.off(event, handler);
        }
        this.eventListeners.clear();
        if (this.client) {
            try {
                // Send Browser.close command to gracefully close the browser
                await this.client.sendCommand('Browser.close');
                logger_1.logger.info('Browser closed via CDP command');
            }
            catch (_error) {
                logger_1.logger.info('Could not close browser via CDP, it may already be closed');
            }
            // Close WebSocket connection
            this.client.close();
        }
        // Clear pending requests
        this.pendingRequests.clear();
        // Clean up project config if autoCleanup is enabled
        (0, config_1.cleanupProjectIfNeeded)();
    }
    /**
     * Sleep for specified milliseconds.
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.ChromeBrowser = ChromeBrowser;
//# sourceMappingURL=browser.js.map