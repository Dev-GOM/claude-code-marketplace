#!/usr/bin/env node

/**
 * Clean up Browser Pilot project configuration at session end.
 * This script is called by the SessionEnd hook to remove the current project
 * from the shared configuration file.
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('./logger');
const processUtils = require('./process-utils');

// Get project name early for logging (from environment variable if available)
const projectName = process.env.CLAUDE_PROJECT_DIR ? path.basename(process.env.CLAUDE_PROJECT_DIR) : null;

// Create logger instance with project name
const logger = createLogger('cleanup-log.txt', 'Browser Pilot Cleanup Log', projectName);

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
 * Sleep utility for async delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  const shutdownFlagPath = path.join(projectRoot, '.browser-pilot', 'daemon-to-stop.pid');

  // Check if PID file exists
  if (!fs.existsSync(pidPath)) {
    logger.log('Browser Pilot: No daemon PID file found');
    return; // Daemon not running
  }

  // Read and validate PID
  let pid;
  try {
    const pidStr = fs.readFileSync(pidPath, 'utf-8').trim();
    pid = parseInt(pidStr, 10);

    if (!processUtils.isValidPid(pid)) {
      logger.log('Browser Pilot: Removed invalid daemon PID file (PID: ' + pidStr + ')');
      processUtils.removeFileWithFallback(pidPath, logger);
      return;
    }
  } catch (error) {
    logger.error('Error reading PID file: ' + error.message);
    return;
  }

  // Check if process is running
  if (!processUtils.isProcessRunning(pid)) {
    logger.log('Browser Pilot: Daemon process not running (PID: ' + pid + ')');
    processUtils.removeFileWithFallback(pidPath, logger);
    return;
  }

  logger.log('Browser Pilot: Stopping daemon (PID: ' + pid + ')...');

  // Create shutdown request file (daemon will delete this when it exits)
  if (!processUtils.writeShutdownFlag(shutdownFlagPath, pid, 0, logger)) {
    logger.warn('Failed to create shutdown flag, continuing anyway');
  } else {
    logger.log('Created shutdown request file');
  }

  // Kill process gracefully (SIGTERM → SIGKILL)
  const result = processUtils.killProcessGraceful(pid, logger, 5000);

  if (result.success) {
    if (result.graceful) {
      logger.log('✓ Browser Pilot Daemon stopped gracefully (PID: ' + pid + ')');

      // Check if daemon cleaned up the shutdown flag
      if (fs.existsSync(shutdownFlagPath)) {
        logger.warn('⚠️  Daemon did not clean up shutdown flag, removing manually');
        processUtils.removeFileWithFallback(shutdownFlagPath, logger, pid);
      } else {
        logger.log('✓ Daemon cleaned up shutdown flag successfully');
      }
    } else {
      logger.log('✓ Browser Pilot Daemon force-stopped (PID: ' + pid + ')');

      // Remove shutdown flag after force kill
      processUtils.removeFileWithFallback(shutdownFlagPath, logger, pid);
    }

    // Clean up PID file
    processUtils.removeFileWithFallback(pidPath, logger);

  } else {
    // Failed to stop daemon
    logger.error('❌ Failed to stop daemon process (PID: ' + pid + ')');
    const relativeFlagPath = path.relative(projectRoot, shutdownFlagPath);
    logger.error('   Shutdown flag left at: ' + relativeFlagPath);
    logger.error('   Next session will attempt cleanup');
    // Leave shutdown flag for next session to handle
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
  // Note: daemon.pid is already removed in stopDaemon()
  const filesToRemove = [
    'interaction-map.json',
    'map-cache.json'
    // 'daemon.pid' - removed by stopDaemon(), not here
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
 * Acquire lock file to prevent concurrent execution
 */
async function acquireLock(projectRoot) {
  const lockFile = path.join(projectRoot, '.browser-pilot', '.cleanup.lock');
  const maxWait = 30000; // 30 seconds
  const checkInterval = 500; // 500ms
  const startTime = Date.now();

  while (fs.existsSync(lockFile)) {
    // Check if lock file is stale (older than 5 minutes)
    try {
      const stats = fs.statSync(lockFile);
      const age = Date.now() - stats.mtimeMs;
      if (age > 300000) {
        logger.log('Removing stale lock file (age: ' + Math.floor(age / 1000) + 's)');
        fs.unlinkSync(lockFile);
        break;
      }
    } catch (error) {
      // Lock file deleted by other process
      break;
    }

    if (Date.now() - startTime > maxWait) {
      throw new Error('Timeout waiting for lock file. Another cleanup may be in progress.');
    }

    logger.log('Waiting for another cleanup process to complete...');
    await sleep(checkInterval);
  }

  // Create lock file
  const lockDir = path.dirname(lockFile);
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true });
  }
  fs.writeFileSync(lockFile, String(process.pid));
  logger.log('Lock acquired (PID: ' + process.pid + ')');

  return lockFile;
}

/**
 * Release lock file
 */
function releaseLock(lockFile) {
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      logger.log('Lock released');
    }
  } catch (error) {
    logger.log('Failed to release lock: ' + error.message);
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
  let lockFile = null;

  // Signal handlers to clean up lock file on interruption
  const cleanup = (signal) => {
    logger.log('Received ' + signal + ', cleaning up...');
    if (lockFile) {
      releaseLock(lockFile);
    }
    logger.close();
    process.exit(1);
  };

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('SIGHUP', () => cleanup('SIGHUP'));

  try {
    // Read hook input
    const hookInput = await readHookInput();

    logger.log('Hook input: ' + JSON.stringify(hookInput));

    // Skip cleanup for 'clear' reason
    // Context clear operations should not terminate the daemon (user is still in session)
    if (hookInput.reason === 'clear') {
      logger.log('Skipping cleanup for reason: ' + hookInput.reason);
      logger.close();
      process.exit(0);
    }

    // Get project root for lock file
    const projectRoot = getProjectRoot(hookInput);

    // Acquire lock before running cleanup
    lockFile = await acquireLock(projectRoot);

    // Run cleanup
    cleanupProject(hookInput);

    // Close log and exit
    logger.close();
    releaseLock(lockFile);
    process.exit(0);
  } catch (error) {
    logger.error('Unexpected error: ' + error.message);
    logger.error('Stack: ' + error.stack);
    logger.close();
    if (lockFile) releaseLock(lockFile);
    process.exit(1);
  }
})();
