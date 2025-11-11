#!/usr/bin/env node

/**
 * Shared utilities for Unity WebSocket hook scripts
 *
 * Common functions used by both SessionStart (init-config.js) and SessionEnd (cleanup-config.js).
 * Includes security hardening for JSON parsing, path validation, and atomic lock operations.
 */

const fs = require('fs');
const path = require('path');
const processUtils = require('../process-utils');

/**
 * Get local timestamp string in format: YYYY-MM-DD HH:MM:SS
 */
function getLocalTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Safely parse JSON with structure validation
 *
 * @param {string} input - JSON string to parse
 * @param {Object} logger - Logger instance
 * @returns {Object|null} Parsed object or null if invalid
 */
function safeParseJSON(input, logger) {
  if (!input || typeof input !== 'string') {
    logger.warn('Invalid JSON input: not a string');
    return null;
  }

  try {
    const parsed = JSON.parse(input);

    // Validate structure
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      logger.warn('Invalid JSON structure: must be an object');
      return null;
    }

    // Validate field types
    if (parsed.cwd !== undefined && typeof parsed.cwd !== 'string') {
      logger.warn('Invalid cwd field: must be a string');
      return null;
    }

    if (parsed.source !== undefined && typeof parsed.source !== 'string') {
      logger.warn('Invalid source field: must be a string');
      return null;
    }

    return parsed;
  } catch (error) {
    logger.warn('JSON parsing failed: ' + error.message);
    return null;
  }
}

/**
 * Validate and normalize project root path (prevents path traversal)
 *
 * @param {string} projectRoot - Project root path to validate
 * @param {Object} logger - Logger instance
 * @returns {string} Normalized absolute path
 * @throws {Error} If path is invalid or contains path traversal
 */
function validateProjectRoot(projectRoot, logger) {
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('Project root is empty or invalid');
  }

  // 1. Normalize and resolve to absolute path
  const normalized = path.normalize(projectRoot);
  const resolved = path.resolve(normalized);

  // 2. Check for path traversal patterns
  if (normalized.includes('..') || resolved.includes('..')) {
    logger.error('Path traversal detected in project root: ' + projectRoot);
    throw new Error('Invalid project root: path traversal detected');
  }

  // 3. Ensure absolute path
  if (!path.isAbsolute(resolved)) {
    logger.error('Project root must be an absolute path: ' + projectRoot);
    throw new Error('Invalid project root: must be absolute path');
  }

  return resolved;
}

/**
 * Get project root from environment variable or hook input
 *
 * @param {Object} hookInput - Hook input object
 * @param {Object} logger - Logger instance
 * @returns {string} Validated project root path
 */
function getProjectRoot(hookInput, logger) {
  let projectRoot = process.env.CLAUDE_PROJECT_DIR;

  if (!projectRoot && hookInput && hookInput.cwd) {
    projectRoot = hookInput.cwd;
    logger.log('Using cwd from hook input as project root');
  }

  if (!projectRoot) {
    logger.error('Error: Could not determine project root');
    logger.error('CLAUDE_PROJECT_DIR not set and no cwd in hook input');
    throw new Error('Could not determine project root');
  }

  return validateProjectRoot(projectRoot, logger);
}

/**
 * Get project name from root folder name
 *
 * @param {string} projectRoot - Project root path
 * @returns {string} Project name
 */
function getProjectName(projectRoot) {
  return path.basename(projectRoot);
}

/**
 * Sleep utility for async delays
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get shared config file path
 *
 * @param {Object} logger - Logger instance
 * @returns {string} Config file path
 */
function getSharedConfigPath(logger) {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (!pluginRoot) {
    logger.error('Error: CLAUDE_PLUGIN_ROOT not set');
    throw new Error('CLAUDE_PLUGIN_ROOT not set');
  }

  return path.join(pluginRoot, 'skills', 'unity-websocket-config.json');
}

/**
 * Load shared configuration
 *
 * @param {Object} logger - Logger instance
 * @returns {Object} Shared config object
 */
function loadSharedConfig(logger) {
  const configPath = getSharedConfigPath(logger);

  if (!fs.existsSync(configPath)) {
    logger.log('Shared config not found, returning empty config');
    return { projects: {} };
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(data);

    // Validate structure
    if (typeof parsed !== 'object' || !parsed.projects) {
      logger.warn('Invalid config structure, returning empty config');
      return { projects: {} };
    }

    return parsed;
  } catch (error) {
    logger.error('Error loading config: ' + error.message);
    return { projects: {} };
  }
}

/**
 * Save shared configuration
 *
 * @param {Object} config - Config object to save
 * @param {Object} logger - Logger instance
 */
function saveSharedConfig(config, logger) {
  const configPath = getSharedConfigPath(logger);

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    logger.log('Shared config saved successfully');
  } catch (error) {
    logger.error('Error saving config: ' + error.message);
    throw error;
  }
}

/**
 * Acquire lock file with atomic operation (prevents race condition)
 *
 * @param {string} projectRoot - Project root path
 * @param {string} lockFileName - Lock file name (e.g., '.init.lock')
 * @param {Object} logger - Logger instance
 * @returns {Promise<string>} Lock file path
 */
async function acquireLock(projectRoot, lockFileName, logger) {
  const lockFile = path.join(projectRoot, '.unity-websocket', lockFileName);
  const maxWait = 30000;
  const checkInterval = 500;
  const startTime = Date.now();
  const STALE_LOCK_TIMEOUT = 120000; // 2 minutes

  // Ensure directory exists
  const lockDir = path.dirname(lockFile);
  if (!fs.existsSync(lockDir)) {
    fs.mkdirSync(lockDir, { recursive: true });
  }

  while (true) {
    try {
      // Atomic file creation (fails if exists)
      fs.writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
      logger.log('Lock acquired (PID: ' + process.pid + ')');
      return lockFile;
    } catch (error) {
      if (error.code !== 'EEXIST') {
        logger.error('Failed to acquire lock: ' + error.message);
        throw error;
      }

      // Lock file exists, check if stale
      try {
        const stats = fs.statSync(lockFile);
        const age = Date.now() - stats.mtimeMs;
        if (age > STALE_LOCK_TIMEOUT) {
          logger.log('Removing stale lock file (age: ' + Math.floor(age / 1000) + 's)');
          fs.unlinkSync(lockFile);
          continue; // Try again
        }
      } catch (statError) {
        // Lock file deleted by another process
        continue;
      }

      // Check timeout
      if (Date.now() - startTime > maxWait) {
        throw new Error('Timeout waiting for lock file');
      }

      logger.log('Waiting for another process to release lock...');
      await sleep(checkInterval);
    }
  }
}

/**
 * Release lock file
 *
 * @param {string} lockFile - Lock file path
 * @param {Object} logger - Logger instance
 */
function releaseLock(lockFile, logger) {
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
 * Read hook input from stdin with timeout
 *
 * @returns {Promise<Object>} Hook input object
 */
async function readHookInput() {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;

    const dataHandler = (chunk) => {
      if (!resolved) {
        data += chunk;
      }
    };

    const endHandler = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        try {
          const input = JSON.parse(data);
          resolve(input);
        } catch (error) {
          resolve({});
        }
      }
    };

    const cleanup = () => {
      process.stdin.removeListener('data', dataHandler);
      process.stdin.removeListener('end', endHandler);
    };

    process.stdin.on('data', dataHandler);
    process.stdin.on('end', endHandler);

    // Timeout after 100ms if no input
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({});
      }
    }, 100);
  });
}

/**
 * Validate npm command execution path
 *
 * @param {string} targetPath - Path where npm will be executed
 * @param {string} projectRoot - Project root path
 * @param {Object} logger - Logger instance
 * @throws {Error} If path is outside project root
 */
function validateNpmPath(targetPath, projectRoot, logger) {
  const resolvedTarget = path.resolve(path.normalize(targetPath));
  const resolvedRoot = path.resolve(path.normalize(projectRoot));

  if (!resolvedTarget.startsWith(resolvedRoot)) {
    logger.error('npm path must be within project root');
    logger.error('  Target: ' + resolvedTarget);
    logger.error('  Root: ' + resolvedRoot);
    throw new Error('Invalid npm execution path: outside project root');
  }

  return resolvedTarget;
}

/**
 * Get clean environment for npm execution (prevents env var injection)
 *
 * @returns {Object} Clean environment variables
 */
function getCleanNpmEnv() {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME || process.env.USERPROFILE,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
    SystemRoot: process.env.SystemRoot, // Windows
    APPDATA: process.env.APPDATA, // Windows
    // Do NOT include CLAUDE_PROJECT_DIR or other custom env vars
  };
}

module.exports = {
  // Time
  getLocalTimestamp,

  // Security
  safeParseJSON,
  validateProjectRoot,
  validateNpmPath,
  getCleanNpmEnv,

  // Project
  getProjectRoot,
  getProjectName,

  // Config
  getSharedConfigPath,
  loadSharedConfig,
  saveSharedConfig,

  // Lock
  acquireLock,
  releaseLock,

  // Input
  readHookInput,

  // Utilities
  sleep,
};
