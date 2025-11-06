"use strict";
/**
 * Configuration management for browser debugging port and state.
 * Uses a shared config file in the plugin folder for multi-project support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutputDir = getOutputDir;
exports.loadSharedConfig = loadSharedConfig;
exports.saveSharedConfig = saveSharedConfig;
exports.getProjectConfig = getProjectConfig;
exports.updateProjectLastUsed = updateProjectLastUsed;
exports.getProjectPort = getProjectPort;
exports.cleanupProjectIfNeeded = cleanupProjectIfNeeded;
exports.setAutoCleanup = setAutoCleanup;
exports.resetProjectConfig = resetProjectConfig;
exports.listProjects = listProjects;
exports.isPortAvailable = isPortAvailable;
exports.findAvailablePort = findAvailablePort;
const fs_1 = require("fs");
const path_1 = require("path");
const net_1 = require("net");
const utils_1 = require("./utils");
const constants_1 = require("../constants");
const logger_1 = require("../utils/logger");
/**
 * Get local timestamp string (same format as logger)
 * Format: YYYY-MM-DD HH:MM:SS.mmm
 */
function getLocalTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}
/**
 * Get shared config file path in plugin skills folder
 * Uses hardcoded home directory path for reliability
 */
function getSharedConfigPath() {
    const { homedir } = require('os');
    const homeDir = homedir();
    return (0, path_1.join)(homeDir, '.claude', 'plugins', 'marketplaces', 'dev-gom-plugins', 'plugins', 'browser-pilot', 'skills', 'browser-pilot-config.json');
}
/**
 * Get project name from root folder name
 */
function getProjectName(projectRoot) {
    return (0, path_1.basename)(projectRoot);
}
/**
 * Get output directory for the current project
 * Creates .browser-pilot folder in project root
 */
function getOutputDir() {
    const projectRoot = (0, utils_1.findProjectRoot)();
    const outputDir = (0, path_1.join)(projectRoot, constants_1.FS.OUTPUT_DIR);
    // Ensure .browser-pilot directory exists
    if (!(0, fs_1.existsSync)(outputDir)) {
        (0, fs_1.mkdirSync)(outputDir, { recursive: true });
    }
    // Always ensure .gitignore exists in .browser-pilot
    const gitignorePath = (0, path_1.join)(outputDir, '.gitignore');
    if (!(0, fs_1.existsSync)(gitignorePath)) {
        (0, fs_1.writeFileSync)(gitignorePath, constants_1.FS.GITIGNORE_CONTENT, 'utf-8');
    }
    return outputDir;
}
/**
 * Load shared configuration from plugin folder
 * Auto-creates default config if not exists
 */
function loadSharedConfig() {
    const configPath = getSharedConfigPath();
    if (!(0, fs_1.existsSync)(configPath)) {
        // Auto-create default config
        const defaultConfig = {
            projects: {}
        };
        saveSharedConfig(defaultConfig);
        return defaultConfig;
    }
    try {
        const data = (0, fs_1.readFileSync)(configPath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        logger_1.logger.error('Failed to load shared config', error);
        logger_1.logger.warn('Returning empty config - existing project settings may be lost');
        logger_1.logger.warn(`Config path: ${configPath}`);
        return {
            projects: {}
        };
    }
}
/**
 * Save shared configuration to plugin folder
 */
function saveSharedConfig(config) {
    const configPath = getSharedConfigPath();
    try {
        (0, fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (error) {
        logger_1.logger.error('Failed to save shared config', error);
        logger_1.logger.warn(`Config path: ${configPath}`);
        throw new Error('Configuration save failed. Please check file permissions.');
    }
}
/**
 * Get configuration for current project
 * Auto-creates with available port if not exists
 */
async function getProjectConfig() {
    const projectRoot = (0, utils_1.findProjectRoot)();
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();
    // Find existing config by rootPath (in case name changed)
    const existingEntry = Object.entries(sharedConfig.projects).find(([_, config]) => config.rootPath === projectRoot);
    if (existingEntry) {
        const [existingName, config] = existingEntry;
        // If name changed, update key
        if (existingName !== projectName) {
            delete sharedConfig.projects[existingName];
            sharedConfig.projects[projectName] = config;
            saveSharedConfig(sharedConfig);
            logger_1.logger.info(`📝 Updated project name: ${existingName} → ${projectName}`);
        }
        return config;
    }
    // Check if name already exists (different path)
    if (sharedConfig.projects[projectName]) {
        logger_1.logger.warn(`⚠️  Project name "${projectName}" already exists with different path`);
        logger_1.logger.warn(`   Existing: ${sharedConfig.projects[projectName].rootPath}`);
        logger_1.logger.warn(`   Current:  ${projectRoot}`);
        throw new Error(`Project name conflict: "${projectName}"`);
    }
    // Create new project config with available port
    const basePort = parseInt(process.env.CDP_DEBUG_PORT || String(constants_1.CDP.DEFAULT_PORT));
    // Find next available port that's not used by any project
    const usedPorts = Object.values(sharedConfig.projects).map(p => p.port);
    let port = basePort;
    // Find first available port not in use by other projects
    while (usedPorts.includes(port) || !(await isPortAvailable(port))) {
        port++;
        if (port > basePort + constants_1.CDP.PORT_RANGE_MAX) {
            throw new Error(`No available port found in range ${basePort}-${basePort + constants_1.CDP.PORT_RANGE_MAX}`);
        }
    }
    const projectConfig = {
        rootPath: projectRoot,
        port,
        outputDir: constants_1.FS.OUTPUT_DIR,
        lastUsed: getLocalTimestamp(),
        autoCleanup: false // Default to false for safety
    };
    // Save new project config
    sharedConfig.projects[projectName] = projectConfig;
    saveSharedConfig(sharedConfig);
    logger_1.logger.info(`📝 Created config for project: ${projectName}`);
    logger_1.logger.info(`   Path: ${projectRoot}`);
    logger_1.logger.info(`   Port: ${port}`);
    return projectConfig;
}
/**
 * Update last used timestamp for current project
 */
function updateProjectLastUsed() {
    const projectRoot = (0, utils_1.findProjectRoot)();
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();
    if (sharedConfig.projects[projectName]) {
        sharedConfig.projects[projectName].lastUsed = getLocalTimestamp();
        saveSharedConfig(sharedConfig);
    }
}
/**
 * Get debug port for current project
 */
async function getProjectPort() {
    const config = await getProjectConfig();
    return config.port;
}
/**
 * Clean up project config if autoCleanup is enabled
 */
function cleanupProjectIfNeeded() {
    const projectRoot = (0, utils_1.findProjectRoot)();
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();
    const projectConfig = sharedConfig.projects[projectName];
    if (projectConfig && projectConfig.autoCleanup) {
        delete sharedConfig.projects[projectName];
        saveSharedConfig(sharedConfig);
        logger_1.logger.info(`🗑️  Auto-cleaned config for project: ${projectName}`);
    }
}
/**
 * Set autoCleanup flag for current project
 */
function setAutoCleanup(enabled) {
    const projectRoot = (0, utils_1.findProjectRoot)();
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();
    if (sharedConfig.projects[projectName]) {
        sharedConfig.projects[projectName].autoCleanup = enabled;
        saveSharedConfig(sharedConfig);
        logger_1.logger.info(`${enabled ? '✅' : '❌'} Auto-cleanup ${enabled ? 'enabled' : 'disabled'} for: ${projectName}`);
    }
}
/**
 * Reset configuration for current project
 */
function resetProjectConfig() {
    const projectRoot = (0, utils_1.findProjectRoot)();
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();
    delete sharedConfig.projects[projectName];
    saveSharedConfig(sharedConfig);
    logger_1.logger.info(`🗑️  Removed config for project: ${projectName}`);
}
/**
 * List all configured projects
 */
function listProjects() {
    const sharedConfig = loadSharedConfig();
    const projects = Object.entries(sharedConfig.projects);
    if (projects.length === 0) {
        logger_1.logger.info('No projects configured yet.');
        return;
    }
    logger_1.logger.info(`\n📋 Configured Projects (${projects.length}):\n`);
    projects.forEach(([name, config]) => {
        logger_1.logger.info(`   ${name}`);
        logger_1.logger.info(`   ├─ Path: ${config.rootPath}`);
        logger_1.logger.info(`   ├─ Port: ${config.port}`);
        logger_1.logger.info(`   ├─ Output: ${config.outputDir}`);
        logger_1.logger.info(`   ├─ Auto-cleanup: ${config.autoCleanup ? 'Yes' : 'No'}`);
        logger_1.logger.info(`   └─ Last Used: ${config.lastUsed || 'Never'}\n`);
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
        server.listen(port, constants_1.CDP.LOCALHOST);
    });
}
/**
 * Find an available port starting from startPort
 */
async function findAvailablePort(startPort = constants_1.CDP.DEFAULT_PORT, maxAttempts = 10) {
    for (let port = startPort; port < startPort + maxAttempts; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
}
//# sourceMappingURL=config.js.map