#!/usr/bin/env node

/**
 * Clean up Blender Toolkit project configuration at session end.
 * This script is called by the SessionEnd hook to remove the current project
 * from the shared configuration file.
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('./logger');
const processUtils = require('./process-utils');

// Get hookInput early to determine project name
let hookInput = null;
try {
  if (process.argv[2]) {
    hookInput = JSON.parse(process.argv[2]);
  }
} catch (error) {
  // Invalid JSON, will use environment variable
}

// Get project name early for logging
let projectName = null;
if (process.env.CLAUDE_PROJECT_DIR) {
  projectName = path.basename(process.env.CLAUDE_PROJECT_DIR);
} else if (hookInput && hookInput.cwd) {
  projectName = path.basename(hookInput.cwd);
}

const logger = createLogger('cleanup-log.txt', 'Blender Toolkit Cleanup Log', projectName || 'unknown');

/**
 * Get project root from environment variable or hook input
 */
function getProjectRoot(hookInput) {
  let projectRoot = process.env.CLAUDE_PROJECT_DIR;

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

  return processUtils.validateProjectRoot(projectRoot, logger);
}

/**
 * Get project name from root folder name
 */
function getProjectName(projectRoot) {
  return path.basename(projectRoot);
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get shared config file path
 */
function getSharedConfigPath() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) {
    logger.error('Error: CLAUDE_PLUGIN_ROOT not set');
    logger.close();
    process.exit(1);
  }

  return path.join(pluginRoot, 'skills', 'blender-config.json');
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
 * Clean up cache files in .blender-toolkit directory
 * Keeps the local scripts but removes cache files
 */
function cleanupCacheFiles(projectRoot) {
  const blenderToolkitDir = path.join(projectRoot, '.blender-toolkit');

  if (!fs.existsSync(blenderToolkitDir)) {
    logger.log('Blender Toolkit: No .blender-toolkit directory found');
    return;
  }

  logger.log('Blender Toolkit: Cleaning up cache files...');

  // Remove cache files (keep local scripts)
  const filesToRemove = [
    'animation-cache.json',
    'bone-mapping-cache.json',
    'mixamo-cache.json'
  ];

  let removedCount = 0;
  filesToRemove.forEach(file => {
    const filePath = path.join(blenderToolkitDir, file);
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
    logger.log('✓ Blender Toolkit: Cleaned up ' + removedCount + ' cache file(s)');
  } else {
    logger.log('Blender Toolkit: No cache files to clean up');
  }

  logger.log('Note: Local scripts preserved in .blender-toolkit/skills/scripts');
}

/**
 * Clean up project configuration
 */
async function cleanupProject(hookInput) {
  try {
    logger.log('Blender Toolkit: Starting cleanup...');

    const projectRoot = getProjectRoot(hookInput);
    const projectName = getProjectName(projectRoot);
    const sharedConfig = loadSharedConfig();

    logger.log('Blender Toolkit: Project: ' + projectName);
    logger.log('Blender Toolkit: Root: ' + projectRoot);

    // Clean up cache files (preserve local scripts)
    cleanupCacheFiles(projectRoot);

    // Check if project exists
    if (!sharedConfig.projects[projectName]) {
      logger.log('Blender Toolkit: Project not found in shared config');
      logger.log('✓ Blender Toolkit: Cleanup complete');
      return;
    }

    const projectConfig = sharedConfig.projects[projectName];

    // Check if rootPath matches
    const normalizedConfigPath = path.normalize(projectConfig.rootPath);
    const normalizedCurrentPath = path.normalize(projectRoot);

    if (normalizedConfigPath !== normalizedCurrentPath) {
      logger.warn('⚠  Blender Toolkit: Project name mismatch');
      logger.warn('   Config path: ' + normalizedConfigPath);
      logger.warn('   Current path: ' + normalizedCurrentPath);
      logger.log('✓ Blender Toolkit: Cleanup complete (with path mismatch warning)');
      return;
    }

    // Remove project from config if autoCleanup is enabled
    if (projectConfig.autoCleanup) {
      logger.log('Blender Toolkit: Auto-cleanup enabled, removing project from shared config...');
      delete sharedConfig.projects[projectName];
      saveSharedConfig(sharedConfig);
      logger.log('✓ Blender Toolkit: Removed from shared config');
    } else {
      logger.log('Blender Toolkit: Auto-cleanup disabled, preserving project config');
    }

    logger.log('✓ Blender Toolkit: Cleanup complete for project "' + projectName + '"');
  } catch (error) {
    logger.error('❌ Blender Toolkit Cleanup FAILED: ' + error.message);
    logger.error('   Stack: ' + error.stack);
    throw error;
  }
}

/**
 * Acquire lock file
 */
async function acquireLock(projectRoot) {
  const lockFile = path.join(projectRoot, '.blender-toolkit', '.cleanup.lock');
  const maxWait = 30000;
  const checkInterval = 500;
  const startTime = Date.now();

  while (fs.existsSync(lockFile)) {
    try {
      const stats = fs.statSync(lockFile);
      const age = Date.now() - stats.mtimeMs;
      if (age > 300000) {
        logger.log('Removing stale lock file (age: ' + Math.floor(age / 1000) + 's)');
        fs.unlinkSync(lockFile);
        break;
      }
    } catch (error) {
      break;
    }

    if (Date.now() - startTime > maxWait) {
      throw new Error('Timeout waiting for lock file');
    }

    logger.log('Waiting for another cleanup process to complete...');
    await sleep(checkInterval);
  }

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
        resolve({});
      }
    });

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

  worker.unref();

  logger.log('✓ Background worker started (PID: ' + worker.pid + ')');
  logger.log('✓ Cleanup will continue in background');
}

/**
 * Execute cleanup in worker mode
 */
async function runWorker() {
  let lockFile = null;

  try {
    const hookInput = process.env.HOOK_INPUT ? JSON.parse(process.env.HOOK_INPUT) : {};

    logger.log('[Worker] Starting background cleanup...');
    logger.log('[Worker] Hook input: ' + JSON.stringify(hookInput));

    const projectRoot = getProjectRoot(hookInput);
    lockFile = await acquireLock(projectRoot);

    await cleanupProject(hookInput);

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
