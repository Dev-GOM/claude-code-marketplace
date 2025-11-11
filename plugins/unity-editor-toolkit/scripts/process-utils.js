#!/usr/bin/env node

/**
 * Process management utilities for Unity WebSocket
 *
 * Common utilities for PID validation, process termination, and file cleanup
 * used by both SessionStart (init-config.js) and SessionEnd (cleanup-config.js) hooks.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const MAX_PID = 4194304; // Maximum PID on Windows/Linux

/**
 * Synchronous sleep using OS-specific sleep commands
 * More efficient than busy-wait loop
 */
function syncSleep(ms) {
  const isWindows = process.platform === 'win32';
  const seconds = Math.max(0.1, ms / 1000);

  try {
    if (isWindows) {
      // Windows: use timeout command (more reliable than ping)
      // timeout /T 0 doesn't work, minimum is 1 second, so use ping for sub-second delays
      if (seconds < 1) {
        const pings = Math.ceil(seconds * 1000 / 1000) + 1;
        execSync(`ping 127.0.0.1 -n ${pings} > nul`, { stdio: 'ignore' });
      } else {
        execSync(`timeout /T ${Math.ceil(seconds)} /NOBREAK > nul`, { stdio: 'ignore' });
      }
    } else {
      // Unix: use sleep command
      execSync(`sleep ${seconds}`, { stdio: 'ignore' });
    }
  } catch (error) {
    // Fallback to busy wait if sleep command fails
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Busy wait
    }
  }
}

/**
 * Validate PID value
 *
 * @param {number} pid - Process ID to validate
 * @returns {boolean} True if PID is valid
 */
function isValidPid(pid) {
  return Number.isInteger(pid) && pid > 0 && pid <= MAX_PID;
}

/**
 * Check if process is running
 *
 * @param {number} pid - Process ID to check
 * @returns {boolean} True if process is running
 */
function isProcessRunning(pid) {
  if (!isValidPid(pid)) {
    return false;
  }

  try {
    // Signal 0 checks if process exists without killing it
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for process to exit with timeout
 *
 * @param {number} pid - Process ID to wait for
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @param {number} checkIntervalMs - Interval between checks in milliseconds
 * @returns {boolean} True if process exited, false if timeout
 */
function waitForProcessExit(pid, timeoutMs = 5000, checkIntervalMs = 100) {
  const startTime = Date.now();

  while (isProcessRunning(pid)) {
    if (Date.now() - startTime > timeoutMs) {
      return false; // Timeout
    }
    syncSleep(checkIntervalMs);
  }

  return true; // Process exited
}

/**
 * Kill process gracefully with fallback to force kill
 * Tries SIGTERM first, then SIGKILL if process doesn't exit
 *
 * @param {number} pid - Process ID to kill
 * @param {Object} logger - Logger instance with log/warn/error methods
 * @param {number} gracefulTimeoutMs - Time to wait for graceful shutdown
 * @returns {Object} { success: boolean, graceful: boolean }
 */
function killProcessGraceful(pid, logger, gracefulTimeoutMs = 5000) {
  if (!isValidPid(pid)) {
    logger.error(`Invalid PID: ${pid}`);
    return { success: false, graceful: false };
  }

  if (!isProcessRunning(pid)) {
    logger.log(`Process not running (PID: ${pid})`);
    return { success: true, graceful: true };
  }

  try {
    // Step 1: Send SIGTERM for graceful shutdown
    logger.log(`Sending SIGTERM to process (PID: ${pid})...`);
    process.kill(pid, 'SIGTERM');

    // Wait for process to exit
    if (waitForProcessExit(pid, gracefulTimeoutMs)) {
      logger.log(`✓ Process stopped gracefully (PID: ${pid})`);
      return { success: true, graceful: true };
    }

    // Step 2: Force kill with SIGKILL or taskkill
    logger.warn(`⚠️  Process did not stop gracefully, forcing termination...`);

    if (process.platform === 'win32') {
      // Windows: Use taskkill for reliable termination
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      logger.log(`Sent taskkill /F to PID ${pid}`);
    } else {
      // Unix: Use SIGKILL
      process.kill(pid, 'SIGKILL');
      logger.log(`Sent SIGKILL to PID ${pid}`);
    }

    // Wait for force kill to complete
    syncSleep(1000);

    if (!isProcessRunning(pid)) {
      logger.log(`✓ Process force-stopped (PID: ${pid})`);
      return { success: true, graceful: false };
    }

    logger.error(`❌ Failed to stop process (PID: ${pid})`);
    return { success: false, graceful: false };

  } catch (error) {
    logger.error(`Error killing process (PID: ${pid}): ${error.message}`);
    return { success: false, graceful: false };
  }
}

/**
 * Read PID from flag file with validation
 * Supports both plain PID format and "PID:RETRY" format
 * Also detects "COMPLETED:" prefix indicating successful shutdown
 *
 * @param {string} flagPath - Path to flag file
 * @param {Object} logger - Logger instance
 * @returns {Object} { pid: number|null, retryCount: number, completed: boolean }
 */
function readShutdownFlag(flagPath, logger) {
  try {
    if (!fs.existsSync(flagPath)) {
      return { pid: null, retryCount: 0, completed: false };
    }

    const content = fs.readFileSync(flagPath, 'utf-8').trim();

    // Check for COMPLETED marker
    if (content.startsWith('COMPLETED')) {
      logger.log('Shutdown flag marked as completed');
      return { pid: null, retryCount: 0, completed: true };
    }

    // Parse "PID:RETRY" format or plain "PID"
    const [pidStr, retryCountStr] = content.split(':');
    const pid = parseInt(pidStr, 10);
    const retryCount = parseInt(retryCountStr || '0', 10);

    if (!isValidPid(pid)) {
      logger.warn(`Invalid PID in shutdown flag: ${content}`);
      return { pid: null, retryCount: 0, completed: false };
    }

    return { pid, retryCount, completed: false };

  } catch (error) {
    if (error.code === 'ENOENT') {
      // File deleted by another process
      return { pid: null, retryCount: 0, completed: false };
    }
    logger.error(`Error reading shutdown flag: ${error.message}`);
    return { pid: null, retryCount: 0, completed: false };
  }
}

/**
 * Write PID to shutdown flag file with optional retry count
 *
 * @param {string} flagPath - Path to flag file
 * @param {number} pid - Process ID
 * @param {number} retryCount - Number of retry attempts (optional)
 * @param {Object} logger - Logger instance
 * @returns {boolean} True if write succeeded
 */
function writeShutdownFlag(flagPath, pid, retryCount = 0, logger) {
  try {
    const content = retryCount > 0 ? `${pid}:${retryCount}` : `${pid}`;
    fs.writeFileSync(flagPath, content, 'utf-8');
    return true;
  } catch (error) {
    logger.error(`Failed to write shutdown flag: ${error.message}`);
    return false;
  }
}

/**
 * Mark shutdown flag as completed
 * Used when daemon shuts down successfully but can't delete the flag file
 *
 * @param {string} flagPath - Path to flag file
 * @param {number} pid - Process ID (for logging)
 * @param {Object} logger - Logger instance
 * @returns {boolean} True if mark succeeded
 */
function markFlagCompleted(flagPath, pid, logger) {
  try {
    fs.writeFileSync(flagPath, `COMPLETED:${pid}`, 'utf-8');
    logger.log('Marked shutdown flag as COMPLETED');
    return true;
  } catch (error) {
    logger.error(`Failed to mark flag as completed: ${error.message}`);
    return false;
  }
}

/**
 * Remove file with retry and fallback to COMPLETED marker
 *
 * @param {string} filePath - Path to file to remove
 * @param {Object} logger - Logger instance
 * @param {number} pid - PID for fallback COMPLETED marker (optional)
 * @returns {boolean} True if removal succeeded or marked as completed
 */
function removeFileWithFallback(filePath, logger, pid = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return true; // Already deleted
    }

    fs.unlinkSync(filePath);
    logger.log(`✓ Removed: ${path.basename(filePath)}`);
    return true;

  } catch (error) {
    if (error.code === 'ENOENT') {
      return true; // Already deleted by another process
    }

    logger.warn(`Failed to remove ${path.basename(filePath)}: ${error.message}`);

    // Fallback: mark as completed (for shutdown flags)
    if (pid !== null) {
      try {
        fs.writeFileSync(filePath, `COMPLETED:${pid}`, 'utf-8');
        logger.log(`Marked ${path.basename(filePath)} as COMPLETED (deletion failed)`);
        return true;
      } catch (writeError) {
        logger.error(`Failed to mark file as completed: ${writeError.message}`);
      }
    }

    return false;
  }
}

/**
 * Validate and normalize project root path
 * Prevents path traversal attacks
 *
 * @param {string} projectRoot - Project root path to validate
 * @param {Object} logger - Logger instance
 * @returns {string} Normalized path
 * @throws {Error} If path is invalid
 */
function validateProjectRoot(projectRoot, logger) {
  if (!projectRoot) {
    throw new Error('Project root is empty');
  }

  // Normalize path (converts to absolute, resolves ..)
  const normalizedRoot = path.resolve(projectRoot);

  // Check for path traversal attempts after normalization
  // If the normalized path is very different or contains .., it might be malicious
  const relative = path.relative(normalizedRoot, projectRoot);
  if (relative.includes('..')) {
    logger.error(`Path traversal detected in project root: ${projectRoot}`);
    throw new Error('Invalid project root: path traversal detected');
  }

  return normalizedRoot;
}

module.exports = {
  // Sleep
  syncSleep,

  // PID validation
  isValidPid,
  isProcessRunning,
  waitForProcessExit,

  // Process termination
  killProcessGraceful,

  // Flag file operations
  readShutdownFlag,
  writeShutdownFlag,
  markFlagCompleted,
  removeFileWithFallback,

  // Path validation
  validateProjectRoot
};
