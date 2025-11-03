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
/**
 * Get shared config file path in plugin skills folder
 * Config is stored in: {plugin-folder}/browser-pilot/skills/browser-pilot-config.json
 */
function getSharedConfigPath() {
    // Get plugin skills directory (3 levels up from dist/cdp/)
    const skillsDir = (0, path_1.join)(__dirname, '..', '..', '..');
    return (0, path_1.join)(skillsDir, 'browser-pilot-config.json');
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
    const outputDir = (0, path_1.join)(projectRoot, '.browser-pilot');
    // Ensure .browser-pilot directory exists
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
        console.error('Failed to load shared config:', error);
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
        console.error('Failed to save shared config:', error);
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
            console.log(`📝 Updated project name: ${existingName} → ${projectName}`);
        }
        return config;
    }
    // Check if name already exists (different path)
    if (sharedConfig.projects[projectName]) {
        console.warn(`⚠️  Project name "${projectName}" already exists with different path`);
        console.warn(`   Existing: ${sharedConfig.projects[projectName].rootPath}`);
        console.warn(`   Current:  ${projectRoot}`);
        throw new Error(`Project name conflict: "${projectName}"`);
    }
    // Create new project config with available port
    const basePort = parseInt(process.env.CDP_DEBUG_PORT || '9222');
    // Find next available port that's not used by any project
    const usedPorts = Object.values(sharedConfig.projects).map(p => p.port);
    let port = basePort;
    // Find first available port not in use by other projects
    while (usedPorts.includes(port) || !(await isPortAvailable(port))) {
        port++;
        if (port > basePort + 100) {
            throw new Error(`No available port found in range ${basePort}-${basePort + 100}`);
        }
    }
    const projectConfig = {
        rootPath: projectRoot,
        port,
        outputDir: '.browser-pilot',
        lastUsed: new Date().toISOString(),
        autoCleanup: false // Default to false for safety
    };
    // Save new project config
    sharedConfig.projects[projectName] = projectConfig;
    saveSharedConfig(sharedConfig);
    console.log(`📝 Created config for project: ${projectName}`);
    console.log(`   Path: ${projectRoot}`);
    console.log(`   Port: ${port}`);
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
        sharedConfig.projects[projectName].lastUsed = new Date().toISOString();
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
        console.log(`🗑️  Auto-cleaned config for project: ${projectName}`);
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
        console.log(`${enabled ? '✅' : '❌'} Auto-cleanup ${enabled ? 'enabled' : 'disabled'} for: ${projectName}`);
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
    console.log(`🗑️  Removed config for project: ${projectName}`);
}
/**
 * List all configured projects
 */
function listProjects() {
    const sharedConfig = loadSharedConfig();
    const projects = Object.entries(sharedConfig.projects);
    if (projects.length === 0) {
        console.log('No projects configured yet.');
        return;
    }
    console.log(`\n📋 Configured Projects (${projects.length}):\n`);
    projects.forEach(([name, config]) => {
        console.log(`   ${name}`);
        console.log(`   ├─ Path: ${config.rootPath}`);
        console.log(`   ├─ Port: ${config.port}`);
        console.log(`   ├─ Output: ${config.outputDir}`);
        console.log(`   ├─ Auto-cleanup: ${config.autoCleanup ? 'Yes' : 'No'}`);
        console.log(`   └─ Last Used: ${config.lastUsed || 'Never'}\n`);
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
//# sourceMappingURL=config.js.map