#!/usr/bin/env node

/**
 * Initialize Unity WebSocket project configuration at session start.
 * This script is called by the SessionStart hook to automatically register
 * the current Unity project in the shared configuration file.
 *
 * Only runs on 'startup' source - skips 'resume', 'clear', 'compact' events.
 *
 * NOTE: CLI installation is now handled by Unity Editor (EditorServerWindow.cs).
 * This script only manages port allocation and shared configuration.
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('./logger');
const hookUtils = require('./shared/hook-utils');

// Get hookInput early to determine project name (with safe parsing)
let hookInput = null;
const tempLogger = { warn: console.warn, log: console.log, error: console.error };
if (process.argv[2]) {
  hookInput = hookUtils.safeParseJSON(process.argv[2], tempLogger);
}

// Get project name early for logging
let projectName = null;
if (process.env.CLAUDE_PROJECT_DIR) {
  projectName = path.basename(process.env.CLAUDE_PROJECT_DIR);
} else if (hookInput && hookInput.cwd) {
  projectName = path.basename(hookInput.cwd);
}

// Create logger instance with project name
const logger = createLogger('init-log.txt', 'Unity WebSocket Initialization Log', projectName || 'unknown');

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
 * Find available port in range 9500-9600
 */
async function findAvailablePort(usedPorts, basePort = 9500) {
  let port = basePort;

  while (usedPorts.includes(port) || !(await isPortAvailable(port))) {
    port++;
    if (port > 9600) {
      throw new Error('No available port found in range 9500-9600');
    }
  }

  return port;
}

/**
 * Check if Unity project (has Assets and ProjectSettings folders)
 */
function isUnityProject(projectRoot) {
  const assetsDir = path.join(projectRoot, 'Assets');
  const projectSettingsDir = path.join(projectRoot, 'ProjectSettings');
  return fs.existsSync(assetsDir) && fs.existsSync(projectSettingsDir);
}

/**
 * Initialize project configuration
 */
async function initializeProject(hookInput) {
  logger.log('Unity WebSocket: Starting initialization...');

  const projectRoot = hookUtils.getProjectRoot(hookInput, logger);
  const projectName = hookUtils.getProjectName(projectRoot);

  logger.log('Unity WebSocket: Project: ' + projectName);
  logger.log('Unity WebSocket: Root: ' + projectRoot);

  // Check if Unity project
  if (!isUnityProject(projectRoot)) {
    logger.warn('⚠️  Not a Unity project (missing Assets or ProjectSettings folder)');
    logger.warn('Unity WebSocket Skill works best with Unity projects');
  }

  // Load and update shared config
  const sharedConfig = hookUtils.loadSharedConfig(logger);
  const normalizedProjectRoot = path.normalize(projectRoot);

  // Check if project exists
  const existingEntry = Object.entries(sharedConfig.projects).find(
    ([_, config]) => path.normalize(config.rootPath) === normalizedProjectRoot
  );

  if (existingEntry) {
    const [existingName, config] = existingEntry;

    if (existingName !== projectName) {
      delete sharedConfig.projects[existingName];
      sharedConfig.projects[projectName] = config;
      hookUtils.saveSharedConfig(sharedConfig, logger);
      logger.log(`✅ Unity WebSocket: Updated project name: ${existingName} → ${projectName}`);
    } else {
      config.lastUsed = hookUtils.getLocalTimestamp();
      hookUtils.saveSharedConfig(sharedConfig, logger);
      logger.log(`✅ Unity WebSocket: Project "${projectName}" ready (Port: ${config.port})`);
    }

    // Check if CLI is installed
    const cliPath = path.join(projectRoot, '.unity-websocket', 'skills', 'scripts', 'package.json');
    if (!fs.existsSync(cliPath)) {
      logger.warn('⚠️  CLI scripts not installed.');
      logger.warn('   Open Unity Editor → Window → Unity Editor Toolkit → Server Control');
      logger.warn('   Click "Install CLI Scripts" button to set up.');
    }

    return;
  }

  // Create new project config
  const basePort = parseInt(process.env.UNITY_WS_PORT || '9500');
  const usedPorts = Object.values(sharedConfig.projects).map(p => p.port);
  const port = await findAvailablePort(usedPorts, basePort);

  const projectConfig = {
    rootPath: normalizedProjectRoot,
    port: port,
    outputDir: '.unity-websocket',
    lastUsed: hookUtils.getLocalTimestamp(),
    autoCleanup: false
  };

  sharedConfig.projects[projectName] = projectConfig;
  hookUtils.saveSharedConfig(sharedConfig, logger);

  logger.log(`✅ Unity WebSocket: Registered project "${projectName}"`);
  logger.log(`   Port: ${port}`);
  logger.log(`   Output: ${projectConfig.outputDir}`);
  logger.log('');
  logger.log('⚠️  Next Step: Install CLI scripts');
  logger.log('   1. Open Unity Editor');
  logger.log('   2. Go to Window → Unity Editor Toolkit → Server Control');
  logger.log('   3. Click "Install CLI Scripts" button');
}


// Main execution
(async () => {
  let lockFile = null;

  const cleanup = (signal) => {
    logger.log('Received ' + signal + ', cleaning up...');
    if (lockFile) {
      hookUtils.releaseLock(lockFile, logger);
    }
    logger.close();
    process.exit(1);
  };

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));

  if (process.platform !== 'win32') {
    process.on('SIGHUP', () => cleanup('SIGHUP'));
  }

  try {
    const hookInput = await hookUtils.readHookInput();

    logger.log('Hook input: ' + JSON.stringify(hookInput));
    logger.log('CLAUDE_PROJECT_DIR env: ' + (process.env.CLAUDE_PROJECT_DIR || 'NOT SET'));

    // Skip clear and compact events
    if (hookInput.source === 'clear' || hookInput.source === 'compact') {
      logger.log('Skipping event: ' + hookInput.source);
      logger.close();
      process.exit(0);
    }

    const projectRoot = hookUtils.getProjectRoot(hookInput, logger);
    lockFile = await hookUtils.acquireLock(projectRoot, '.init.lock', logger);

    await initializeProject(hookInput);

    logger.close();
    hookUtils.releaseLock(lockFile, logger);
    process.exit(0);
  } catch (error) {
    logger.error('Error initializing Unity WebSocket: ' + error.message);
    logger.error('Stack: ' + error.stack);
    logger.close();
    if (lockFile) hookUtils.releaseLock(lockFile, logger);
    process.exit(1);
  }
})();
