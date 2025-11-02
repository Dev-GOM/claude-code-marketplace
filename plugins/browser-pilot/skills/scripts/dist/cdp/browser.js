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
    debugPort;
    chromeProcess = null;
    client = null;
    constructor(headless = false) {
        this.headless = headless;
        // Load debug port from config
        const config = (0, config_1.loadConfig)();
        this.debugPort = config.debugPort || 9222;
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
        const config = (0, config_1.loadConfig)();
        // Check if config is initialized and port exists
        if (config.initialized && config.debugPort) {
            // Check if the port is in use (browser running)
            const portAvailable = await (0, config_1.isPortAvailable)(config.debugPort);
            if (!portAvailable) {
                // Port is in use, browser is running
                this.debugPort = config.debugPort;
                console.log(`Connecting to existing Chrome on port ${this.debugPort}...`);
                await this.connectToPage();
                return;
            }
            else {
                // Port is available, browser died
                console.log('Previous browser session not found, resetting config...');
                (0, config_1.resetConfig)();
            }
        }
        // No running browser found
        throw new Error('No running browser found');
    }
    /**
     * Launch Chrome in debugging mode.
     */
    async launch() {
        // Initialize config and get available port
        const config = (0, config_1.loadConfig)();
        if (!config.initialized) {
            console.log('Initializing browser configuration...');
            const newConfig = await (0, config_1.initializeConfig)();
            this.debugPort = newConfig.debugPort;
        }
        else {
            this.debugPort = config.debugPort;
        }
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
        // Update config with initialization status
        (0, config_1.saveConfig)({
            initialized: true,
            debugPort: this.debugPort,
            lastUsed: new Date().toISOString()
        });
        // Wait for Chrome to start
        await this.sleep(2000);
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
        // Reset config to uninitialized state
        (0, config_1.resetConfig)();
        console.log('Browser configuration reset');
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