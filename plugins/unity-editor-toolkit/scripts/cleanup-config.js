#!/usr/bin/env node

/**
 * Clean up Unity WebSocket project configuration at session end.
 * This script is called by the SessionEnd hook to remove the current project
 * from the shared configuration file.
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
const logger = createLogger('cleanup-log.txt', 'Unity WebSocket Cleanup Log', projectName || 'unknown');

/**
 * Clean up project configuration
 */
async function cleanupProject(hookInput) {
  try {
    logger.log('Unity WebSocket: Starting cleanup...');

    const projectRoot = hookUtils.getProjectRoot(hookInput, logger);
    const projectName = hookUtils.getProjectName(projectRoot);
    const sharedConfig = hookUtils.loadSharedConfig(logger);

    logger.log('Unity WebSocket: Project: ' + projectName);
    logger.log('Unity WebSocket: Root: ' + projectRoot);

    // Check if project exists in config
    if (!sharedConfig.projects[projectName]) {
      logger.log('Unity WebSocket: Project not found in shared config');
      logger.log('✓ Unity WebSocket: Cleanup complete');
      return;
    }

    const projectConfig = sharedConfig.projects[projectName];

    // Verify rootPath matches
    const normalizedConfigPath = path.normalize(projectConfig.rootPath);
    const normalizedCurrentPath = path.normalize(projectRoot);

    if (normalizedConfigPath !== normalizedCurrentPath) {
      logger.warn('⚠️  Unity WebSocket: Project name mismatch');
      logger.warn('   Config path: ' + normalizedConfigPath);
      logger.warn('   Current path: ' + normalizedCurrentPath);
      logger.log('✓ Unity WebSocket: Cleanup complete (with path mismatch warning)');
      return;
    }

    // Check autoCleanup setting
    if (!projectConfig.autoCleanup) {
      logger.log('Unity WebSocket: autoCleanup disabled, preserving project config');
      logger.log('✓ Unity WebSocket: Cleanup complete (config preserved)');
      return;
    }

    // Remove project from config
    logger.log('Unity WebSocket: Removing project from shared config...');
    delete sharedConfig.projects[projectName];
    hookUtils.saveSharedConfig(sharedConfig, logger);
    logger.log('✓ Unity WebSocket: Removed from shared config');

    logger.log('✓ Unity WebSocket: Cleanup complete for project "' + projectName + '"');
  } catch (error) {
    logger.error('❌ Unity WebSocket Cleanup FAILED: ' + error.message);
    logger.error('   Stack: ' + error.stack);
    throw error;
  }
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

    const projectRoot = hookUtils.getProjectRoot(hookInput, logger);
    lockFile = await hookUtils.acquireLock(projectRoot, '.cleanup.lock', logger);

    await cleanupProject(hookInput);

    logger.close();
    hookUtils.releaseLock(lockFile, logger);
    process.exit(0);
  } catch (error) {
    logger.error('Error during cleanup: ' + error.message);
    logger.error('Stack: ' + error.stack);
    logger.close();
    if (lockFile) hookUtils.releaseLock(lockFile, logger);
    process.exit(1);
  }
})();
