#!/usr/bin/env node

/**
 * Initialize Browser Pilot project configuration at session start.
 * This script is called by the SessionStart hook to automatically register
 * the current project in the shared configuration file.
 */

const fs = require('fs');
const path = require('path');

/**
 * Get project root from environment or current directory
 */
function getProjectRoot() {
  return process.env.CLAUDE_PROJECT_ROOT || process.cwd();
}

/**
 * Get project name from root folder name
 */
function getProjectName(projectRoot) {
  return path.basename(projectRoot);
}

/**
 * Get shared config file path
 */
function getSharedConfigPath() {
  // Plugin root is provided by hook environment variable
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) {
    console.error('Error: CLAUDE_PLUGIN_ROOT not set');
    process.exit(1);
  }

  return path.join(pluginRoot, 'skills', 'browser-pilot-config.json');
}

/**
 * Load shared configuration
 */
function loadSharedConfig() {
  const configPath = getSharedConfigPath();

  if (!fs.existsSync(configPath)) {
    return { projects: {} };
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading config:', error.message);
    return { projects: {} };
  }
}

/**
 * Save shared configuration
 */
function saveSharedConfig(config) {
  const configPath = getSharedConfigPath();

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving config:', error.message);
    process.exit(1);
  }
}

/**
 * Check if a port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find available port
 */
async function findAvailablePort(usedPorts, basePort = 9222) {
  let port = basePort;

  while (usedPorts.includes(port) || !(await isPortAvailable(port))) {
    port++;
    if (port > basePort + 100) {
      throw new Error(`No available port found in range ${basePort}-${basePort + 100}`);
    }
  }

  return port;
}

/**
 * Create .browser-pilot output directory in project root
 */
function createOutputDirectory(projectRoot) {
  const outputDir = path.join(projectRoot, '.browser-pilot');

  // Create .browser-pilot directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create .gitignore in .browser-pilot if it doesn't exist
  const gitignorePath = path.join(outputDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `# Browser Pilot generated files
*
`;
    fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
  }
}

/**
 * Initialize project configuration
 */
async function initializeProject() {
  const projectRoot = getProjectRoot();
  const projectName = getProjectName(projectRoot);
  const sharedConfig = loadSharedConfig();

  // Always ensure .browser-pilot directory exists
  createOutputDirectory(projectRoot);

  // Check if project already exists by rootPath
  const existingEntry = Object.entries(sharedConfig.projects).find(
    ([_, config]) => config.rootPath === projectRoot
  );

  if (existingEntry) {
    const [existingName, config] = existingEntry;

    // If name changed, update key
    if (existingName !== projectName) {
      delete sharedConfig.projects[existingName];
      sharedConfig.projects[projectName] = config;
      saveSharedConfig(sharedConfig);
      console.log(`✅ Browser Pilot: Updated project name: ${existingName} → ${projectName}`);
    } else {
      // Project exists with same name, just update lastUsed
      config.lastUsed = new Date().toISOString();
      saveSharedConfig(sharedConfig);
      console.log(`✅ Browser Pilot: Project "${projectName}" ready (Port: ${config.port})`);
    }

    return;
  }

  // Check if name already exists with different path
  if (sharedConfig.projects[projectName]) {
    console.error(`⚠️  Browser Pilot: Project name "${projectName}" already exists with different path`);
    console.error(`   Existing: ${sharedConfig.projects[projectName].rootPath}`);
    console.error(`   Current:  ${projectRoot}`);
    return; // Don't fail, just warn
  }

  // Create new project config
  const basePort = parseInt(process.env.CDP_DEBUG_PORT || '9222');
  const usedPorts = Object.values(sharedConfig.projects).map(p => p.port);
  const port = await findAvailablePort(usedPorts, basePort);

  const projectConfig = {
    rootPath: projectRoot,
    port: port,
    outputDir: '.browser-pilot',
    lastUsed: new Date().toISOString(),
    autoCleanup: false
  };

  sharedConfig.projects[projectName] = projectConfig;
  saveSharedConfig(sharedConfig);

  console.log(`✅ Browser Pilot: Registered project "${projectName}"`);
  console.log(`   Port: ${port}`);
  console.log(`   Output: ${projectConfig.outputDir}`);
}

// Run initialization
initializeProject()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error initializing Browser Pilot:', error.message);
    process.exit(1);
  });
