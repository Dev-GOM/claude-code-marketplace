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

  // Validate and normalize path to prevent path traversal
  return processUtils.validateProjectRoot(projectRoot, logger);
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
 * Stop daemon if running (async version with proper IPC shutdown)
 */
async function stopDaemon(projectRoot) {
  const pidPath = path.join(projectRoot, '.browser-pilot', 'daemon.pid');
  const shutdownFlagPath = path.join(projectRoot, '.browser-pilot', 'daemon-to-stop.pid');

  // Check if PID file exists
  if (!fs.existsSync(pidPath)) {
    logger.log('Browser Pilot: No daemon PID file found');
    return;
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

  // Try graceful shutdown via IPC first (properly async)
  try {
    const shutdownSuccess = await attemptIPCShutdown(projectRoot, pid);

    if (shutdownSuccess) {
      logger.log('✓ Browser Pilot Daemon stopped gracefully via IPC (PID: ' + pid + ')');
      processUtils.removeFileWithFallback(pidPath, logger);
      if (fs.existsSync(shutdownFlagPath)) {
        processUtils.removeFileWithFallback(shutdownFlagPath, logger);
      }
      return;
    }

    logger.warn('IPC shutdown failed or timeout, forcing kill...');
  } catch (error) {
    logger.warn('IPC shutdown error: ' + error.message);
  }

  // If graceful shutdown failed, force kill
  logger.log('Forcing daemon shutdown...');

  // Create shutdown request file
  if (!processUtils.writeShutdownFlag(shutdownFlagPath, pid, 0, logger)) {
    logger.warn('Failed to create shutdown flag, continuing anyway');
  } else {
    logger.log('Created shutdown request file');
  }

  // Kill process gracefully (SIGTERM → SIGKILL)
  const result = processUtils.killProcessGraceful(pid, logger, 5000);

  if (result.success) {
    if (result.graceful) {
      logger.log('✓ Browser Pilot Daemon stopped (forced graceful) (PID: ' + pid + ')');
    } else {
      logger.log('✓ Browser Pilot Daemon stopped (forced kill) (PID: ' + pid + ')');
    }

    if (fs.existsSync(shutdownFlagPath)) {
      logger.warn('⚠️  Daemon did not clean up shutdown flag, removing manually');
      processUtils.removeFileWithFallback(shutdownFlagPath, logger, pid);
    }

    processUtils.removeFileWithFallback(pidPath, logger);
  } else {
    logger.error('❌ Failed to stop daemon process (PID: ' + pid + ')');
    const relativeFlagPath = path.relative(projectRoot, shutdownFlagPath);
    logger.error('   Shutdown flag left at: ' + relativeFlagPath);
    logger.error('   Next session will attempt cleanup');
  }
}

// IPC shutdown constants
const GRACEFUL_SHUTDOWN_TIMEOUT = 5000; // 5 seconds
const POLLING_INTERVAL = 100; // 100ms

// Socket path constants (must match server.ts logic)
const SOCKET_PATH_PREFIX = 'daemon';

/**
 * Get project-specific socket name (matches protocol.ts logic)
 */
function getProjectSocketName(projectRoot) {
  const crypto = require('crypto');
  const projectName = path.basename(projectRoot)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .toLowerCase();

  // Add hash of full path to prevent collision
  const hash = crypto.createHash('sha256')
    .update(projectRoot)
    .digest('hex')
    .substring(0, 8); // Use first 8 chars for brevity

  return `${SOCKET_PATH_PREFIX}-${projectName}-${hash}`;
}

/**
 * Get socket path (platform-specific, must match server.ts)
 */
function getSocketPath(projectRoot) {
  if (process.platform === 'win32') {
    // Windows: Named pipe
    const socketName = getProjectSocketName(projectRoot);
    return `\\\\.\\pipe\\${socketName}`;
  } else {
    // Unix: Domain socket
    return path.join(projectRoot, '.browser-pilot', `${SOCKET_PATH_PREFIX}.sock`);
  }
}

/**
 * Attempt IPC shutdown (properly async)
 */
function attemptIPCShutdown(projectRoot, pid) {
  return new Promise((resolve) => {
    const net = require('net');
    const socketPath = getSocketPath(projectRoot);

    let resolved = false;
    let checkInterval = null;
    const client = net.createConnection(socketPath);

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (checkInterval) clearInterval(checkInterval);
        client.destroy();
        resolve(false);
      }
    }, GRACEFUL_SHUTDOWN_TIMEOUT);

    client.on('connect', () => {
      // Send shutdown command
      const request = JSON.stringify({
        id: Date.now().toString(),
        command: 'shutdown',
        params: {}
      }) + '\n';
      client.write(request);
      logger.log('✓ Sent graceful shutdown command via IPC');

      // Check process termination
      checkInterval = setInterval(() => {
        if (!processUtils.isProcessRunning(pid)) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          if (!resolved) {
            resolved = true;
            client.destroy();
            resolve(true);
          }
        }
      }, POLLING_INTERVAL);
    });

    client.on('error', (error) => {
      logger.warn('IPC connection failed: ' + error.message);
      clearTimeout(timeoutId);
      if (checkInterval) clearInterval(checkInterval);
      if (!resolved) {
        resolved = true;
        client.destroy();
        resolve(false);
      }
    });
  });
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
 * Clean up project configuration (async version)
 */
async function cleanupProject(hookInput) {
  try {
    logger.log('Browser Pilot: Starting cleanup...');

    const projectRoot = getProjectRoot(hookInput);
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();

    logger.log('Browser Pilot: Project: ' + projectName);
    logger.log('Browser Pilot: Root: ' + projectRoot);

    // Stop daemon first (async)
    await stopDaemon(projectRoot);

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
    logger.error('❌ Browser Pilot Cleanup FAILED: ' + error.message);
    logger.error('   Stack: ' + error.stack);
    throw error;
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

/**
 * Run cleanup as a detached background worker
 */
function spawnWorker(hookInput) {
  const { spawn } = require('child_process');

  logger.log('Spawning background worker for cleanup...');

  // Spawn detached worker process
  const worker = spawn(
    process.execPath,
    [__filename, '--worker'],
    {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        HOOK_INPUT: JSON.stringify(hookInput)
      }
    }
  );

  worker.unref(); // Allow parent to exit independently

  logger.log('✓ Background worker started (PID: ' + worker.pid + ')');
  logger.log('✓ Cleanup will continue in background');
}

/**
 * Execute cleanup in worker mode
 */
async function runWorker() {
  let lockFile = null;

  try {
    // Parse hook input from environment
    const hookInput = process.env.HOOK_INPUT ? JSON.parse(process.env.HOOK_INPUT) : {};

    logger.log('[Worker] Starting background cleanup...');
    logger.log('[Worker] Hook input: ' + JSON.stringify(hookInput));

    // Get project root for lock file
    const projectRoot = getProjectRoot(hookInput);

    // Acquire lock before running cleanup
    lockFile = await acquireLock(projectRoot);

    // Run cleanup with proper IPC shutdown
    await cleanupProject(hookInput);

    // Close log and exit
    logger.log('[Worker] ✓ Background cleanup complete');
    logger.close();
    releaseLock(lockFile);
    process.exit(0);
  } catch (error) {
    logger.error('[Worker] Cleanup failed: ' + error.message);
    logger.error('[Worker] Stack: ' + error.stack);
    logger.close();
    if (lockFile) releaseLock(lockFile);
    process.exit(1);
  }
}

// Main execution
(async () => {
  // Check if running in worker mode
  if (process.argv.includes('--worker')) {
    await runWorker();
    return;
  }

  // Normal mode: spawn worker and exit immediately
  try {
    // Read hook input
    const hookInput = await readHookInput();

    logger.log('Hook input: ' + JSON.stringify(hookInput));

    // Skip cleanup for 'clear' reason
    if (hookInput.reason === 'clear') {
      logger.log('Skipping cleanup for reason: ' + hookInput.reason);
      logger.close();
      process.exit(0);
    }

    // Spawn background worker
    spawnWorker(hookInput);

    // Exit immediately (worker continues in background)
    logger.close();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to spawn worker: ' + error.message);
    logger.error('Stack: ' + error.stack);
    logger.close();
    process.exit(1);
  }
})();
