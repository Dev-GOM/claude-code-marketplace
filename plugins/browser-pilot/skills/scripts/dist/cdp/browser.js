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
class ChromeBrowser {
    headless;
    debugPort = null;
    chromeProcess = null;
    client = null;
    consoleMessages = [];
    MAX_CONSOLE_MESSAGES = 1000;
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
            console.log(`Connecting to existing Chrome on port ${this.debugPort}...`);
            await this.connectToPage();
            (0, config_1.updateProjectLastUsed)();
            return;
        }
        // No running browser found
        throw new Error(`No running browser found on port ${port}`);
    }
    /**
     * Launch Chrome in debugging mode.
     */
    async launch() {
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
        console.log(`Launching Chrome on port ${this.debugPort} (headless: ${this.headless})...`);
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
                const response = await fetch(`http://localhost:${this.debugPort}/json/version`);
                if (response.ok) {
                    connected = true;
                    break;
                }
            }
            catch (error) {
                // Connection may be refused while browser is starting up
            }
            attempts++;
            await this.sleep(500);
        }
        if (!connected) {
            throw new Error('Failed to connect to Chrome within the timeout period (10 seconds).');
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
            const url = `http://localhost:${this.debugPort}/json`;
            const response = await fetch(url);
            const targets = await response.json();
            // Find or create a page target
            let pageTarget = targets.find(t => t.type === 'page');
            if (!pageTarget) {
                // Create new target
                const newUrl = `http://localhost:${this.debugPort}/json/new`;
                const newResponse = await fetch(newUrl);
                pageTarget = await newResponse.json();
            }
            const wsUrl = pageTarget.webSocketDebuggerUrl;
            console.log(`Connecting to: ${wsUrl}`);
            this.client = new client_1.CDPClient(wsUrl);
            await this.client.connect();
            console.log('Connected to Chrome DevTools Protocol');
            // Enable Log domain to receive console messages
            await this.client.sendCommand('Log.enable');
            await this.client.sendCommand('Runtime.enable');
            // Set up console message listeners
            this.client.on('Log.entryAdded', (params) => {
                const entry = params.entry;
                this.addConsoleMessage({
                    level: entry.level || 'log',
                    text: entry.text || '',
                    timestamp: entry.timestamp || Date.now(),
                    url: entry.url,
                    lineNumber: entry.lineNumber,
                    stackTrace: entry.stackTrace
                });
            });
            // Also listen to Runtime.consoleAPICalled for console.log/warn/error
            this.client.on('Runtime.consoleAPICalled', (params) => {
                const args = params.args || [];
                const text = args.map((arg) => arg.value || arg.description || '').join(' ');
                this.addConsoleMessage({
                    level: params.type || 'log',
                    text: text,
                    timestamp: params.timestamp || Date.now(),
                    url: params.stackTrace?.callFrames?.[0]?.url,
                    lineNumber: params.stackTrace?.callFrames?.[0]?.lineNumber
                });
            });
            // Listen to Runtime.exceptionThrown for errors
            this.client.on('Runtime.exceptionThrown', (params) => {
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
            });
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
     * Close browser and cleanup.
     */
    async close() {
        console.log('Closing browser...');
        if (this.client) {
            try {
                // Send Browser.close command to gracefully close the browser
                await this.client.sendCommand('Browser.close');
                console.log('Browser closed via CDP command');
            }
            catch (error) {
                console.log('Could not close browser via CDP, it may already be closed');
            }
            // Close WebSocket connection
            this.client.close();
        }
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