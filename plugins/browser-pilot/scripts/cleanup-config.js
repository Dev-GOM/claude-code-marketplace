#!/usr/bin/env node

/**
 * Clean up Browser Pilot project configuration at session end.
 * This script is called by the SessionEnd hook to remove the current project
 * from the shared configuration file.
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('./logger');

// Create logger instance
const logger = createLogger('cleanup-log.txt', 'Browser Pilot Cleanup Log');

/**
 * Get project root from environment variable or hook input
 */
function getProjectRoot(hookInput) {
  // Try environment variable first
  let projectRoot = process.env.CLAUDE_PROJECT_DIR;

  // Fallback to hook input cwd
  if (!projectRoot && hookInput && hookInput.cwd) {
    projectRoot = hookInput.cwd;
    logger.log('Using cwd from hook input as project root');
  }

  if (!projectRoot) {
    logger.error('Error: Could not determine project root');
    logger.error('CLAUDE_PROJECT_DIR not set and no cwd in hook input');
    logger.close();
    process.exit(1);
  }

  return projectRoot;
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
    logger.error('Error: CLAUDE_PLUGIN_ROOT not set');
    logger.close();
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
    logger.log('Shared config not found, returning empty config');
    return { projects: {} };
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error loading config: ' + error.message);
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
    logger.log('Shared config saved successfully');
  } catch (error) {
    logger.error('Error saving config: ' + error.message);
    logger.close();
    process.exit(1);
  }
}

/**
 * Stop daemon if running
 */
function stopDaemon(projectRoot) {
  const pidPath = path.join(projectRoot, '.browser-pilot', 'daemon.pid');

  // Check if PID file exists
  if (!fs.existsSync(pidPath)) {
    logger.log('Browser Pilot: No daemon PID file found');
    return; // Daemon not running
  }

  // Read PID
  const pidStr = fs.readFileSync(pidPath, 'utf-8').trim();
  const pid = parseInt(pidStr, 10);

  if (isNaN(pid)) {
    // Invalid PID, just remove file
    fs.unlinkSync(pidPath);
    logger.log('Browser Pilot: Removed invalid daemon PID file');
    return;
  }

  try {
    // Check if process exists and kill it
    process.kill(pid, 0); // Signal 0 checks if process exists
    process.kill(pid, 'SIGTERM'); // Graceful shutdown
    logger.log('✓ Browser Pilot Daemon stopped (PID: ' + pid + ')');
  } catch (error) {
    // Process doesn't exist, just clean up PID file
    if (fs.existsSync(pidPath)) {
      fs.unlinkSync(pidPath);
      logger.log('Browser Pilot: Cleaned up stale daemon PID file');
    }
  }
}

/**
 * Clean up cache files in .browser-pilot directory
 * Keeps the local scripts but removes cache files
 */
function cleanupCacheFiles(projectRoot) {
  const browserPilotDir = path.join(projectRoot, '.browser-pilot');

  if (!fs.existsSync(browserPilotDir)) {
    logger.log('Browser Pilot: No .browser-pilot directory found');
    return;
  }

  logger.log('Browser Pilot: Cleaning up cache files...');

  // Remove cache files (keep local scripts)
  const filesToRemove = [
    'interaction-map.json',
    'map-cache.json',
    'daemon.pid'
  ];

  let removedCount = 0;
  filesToRemove.forEach(file => {
    const filePath = path.join(browserPilotDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.log('  Removed: ' + file);
        removedCount++;
      } catch (error) {
        logger.warn('  Failed to remove ' + file + ': ' + error.message);
      }
    }
  });

  if (removedCount > 0) {
    logger.log('✓ Browser Pilot: Cleaned up ' + removedCount + ' cache file(s)');
  } else {
    logger.log('Browser Pilot: No cache files to clean up');
  }

  logger.log('Note: Local scripts preserved in .browser-pilot/skills/scripts');
}

/**
 * Clean up project configuration
 */
function cleanupProject(hookInput) {
  try {
    logger.log('Browser Pilot: Starting cleanup...');

    const projectRoot = getProjectRoot(hookInput);
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();

    logger.log('Browser Pilot: Project: ' + projectName);
    logger.log('Browser Pilot: Root: ' + projectRoot);

    // Stop daemon first
    stopDaemon(projectRoot);

    // Clean up cache files (preserve local scripts)
    cleanupCacheFiles(projectRoot);

    // Check if project exists
    if (!sharedConfig.projects[projectName]) {
      logger.log('Browser Pilot: Project not found in shared config');
      logger.log('✓ Browser Pilot: Cleanup complete');
      return;
    }

    const projectConfig = sharedConfig.projects[projectName];

    // Check if rootPath matches (ensure we're cleaning up the right project)
    // Normalize paths to handle forward/backward slash differences (Windows)
    const normalizedConfigPath = path.normalize(projectConfig.rootPath);
    const normalizedCurrentPath = path.normalize(projectRoot);

    if (normalizedConfigPath !== normalizedCurrentPath) {
      logger.warn('⚠  Browser Pilot: Project name mismatch');
      logger.warn('   Config path: ' + normalizedConfigPath);
      logger.warn('   Current path: ' + normalizedCurrentPath);
      logger.log('✓ Browser Pilot: Cleanup complete (with path mismatch warning)');
      return;
    }

    // Remove project from config
    logger.log('Browser Pilot: Removing project from shared config...');
    delete sharedConfig.projects[projectName];
    saveSharedConfig(sharedConfig);
    logger.log('✓ Browser Pilot: Removed from shared config');

    logger.log('✓ Browser Pilot: Cleanup complete for project "' + projectName + '"');
  } catch (error) {
    // Report error and exit with failure code
    logger.error('❌ Browser Pilot Cleanup FAILED: ' + error.message);
    logger.error('   Stack: ' + error.stack);
    logger.close();
    process.exit(1);
  }
}

/**
 * Read hook input from stdin
 */
async function readHookInput() {
  return new Promise((resolve) => {
    let data = '';

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        const input = JSON.parse(data);
        resolve(input);
      } catch (error) {
        // If no input or invalid JSON, return empty object
        resolve({});
      }
    });

    // Timeout after 100ms if no input
    setTimeout(() => {
      process.stdin.removeAllListeners();
      resolve({});
    }, 100);
  });
}

// Main execution
(async () => {
  try {
    // Read hook input
    const hookInput = await readHookInput();

    logger.log('Hook input: ' + JSON.stringify(hookInput));

    // Run cleanup
    cleanupProject(hookInput);

    // Close log and exit
    logger.close();
    process.exit(0);
  } catch (error) {
    logger.error('Unexpected error: ' + error.message);
    logger.error('Stack: ' + error.stack);
    logger.close();
    process.exit(1);
  }
})();
