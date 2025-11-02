"use strict";
/**
 * Configuration management for browser debugging port and state.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.resetConfig = resetConfig;
exports.isPortAvailable = isPortAvailable;
exports.findAvailablePort = findAvailablePort;
exports.initializeConfig = initializeConfig;
const fs_1 = require("fs");
const path_1 = require("path");
const net_1 = require("net");
const utils_1 = require("./utils");
/**
 * Get config file path in user's project root
 * Config is stored in .plugin-config/browser-pilot.json
 * Output files (screenshots, PDFs) go to .browser-pilot/
 */
function getConfigPath() {
    const projectRoot = (0, utils_1.findProjectRoot)();
    const configDir = (0, path_1.join)(projectRoot, '.plugin-config');
    const outputDir = (0, path_1.join)(projectRoot, '.browser-pilot');
    // Ensure .plugin-config directory exists
    if (!(0, fs_1.existsSync)(configDir)) {
        (0, fs_1.mkdirSync)(configDir, { recursive: true });
    }
    // Ensure .browser-pilot directory exists for output files
    if (!(0, fs_1.existsSync)(outputDir)) {
        (0, fs_1.mkdirSync)(outputDir, { recursive: true });
    }
    // Always ensure .gitignore exists in .browser-pilot
    const gitignorePath = (0, path_1.join)(outputDir, '.gitignore');
    if (!(0, fs_1.existsSync)(gitignorePath)) {
        const gitignoreContent = `# Browser Pilot generated files
*
`;
        (0, fs_1.writeFileSync)(gitignorePath, gitignoreContent, 'utf-8');
    }
    return (0, path_1.join)(configDir, 'browser-pilot.json');
}
/**
 * Load configuration from config.json
 * Auto-creates default config if not exists
 */
function loadConfig() {
    const configPath = getConfigPath();
    if (!(0, fs_1.existsSync)(configPath)) {
        // Auto-create default config
        const defaultConfig = {
            initialized: false,
            debugPort: null,
            lastUsed: null
        };
        saveConfig(defaultConfig);
        return defaultConfig;
    }
    try {
        const data = (0, fs_1.readFileSync)(configPath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error('Failed to load config:', error);
        return {
            initialized: false,
            debugPort: null,
            lastUsed: null
        };
    }
}
/**
 * Save configuration to config.json
 */
function saveConfig(config) {
    const configPath = getConfigPath();
    try {
        (0, fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('Failed to save config:', error);
    }
}
/**
 * Reset configuration to uninitialized state
 */
function resetConfig() {
    saveConfig({
        initialized: false,
        debugPort: null,
        lastUsed: null
    });
}
/**
 * Check if a port is available (not in use)
 */
async function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = (0, net_1.createServer)();
        server.once('error', () => {
            resolve(false);
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        // Listen on 127.0.0.1 specifically (same as Chrome)
        server.listen(port, '127.0.0.1');
    });
}
/**
 * Find an available port starting from startPort
 */
async function findAvailablePort(startPort = 9222, maxAttempts = 10) {
    for (let port = startPort; port < startPort + maxAttempts; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
}
/**
 * Initialize configuration with an available port
 */
async function initializeConfig() {
    const basePort = parseInt(process.env.CDP_DEBUG_PORT || '9222');
    const debugPort = await findAvailablePort(basePort);
    const config = {
        initialized: true,
        debugPort,
        lastUsed: new Date().toISOString()
    };
    saveConfig(config);
    return config;
}
//# sourceMappingURL=config.js.map