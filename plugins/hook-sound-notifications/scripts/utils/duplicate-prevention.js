#!/usr/bin/env node

/**
 * Duplicate execution prevention utility
 * Prevents hooks from running multiple times within a short time window
 */

const fs = require('fs');
const path = require('path');

/**
 * Check and prevent duplicate execution
 * @param {string} scriptName - Name of the script (e.g., 'init-config', 'sound-hook-SessionStart')
 * @param {number} windowMs - Time window in milliseconds (default: 1000ms = 1 second)
 * @returns {boolean} - Returns true if script should continue, false if it's a duplicate
 */
function preventDuplicateExecution(scriptName, windowMs = 1000) {
  const stateDir = path.join(__dirname, '..', '..', '.state');
  const lockFile = path.join(stateDir, `.${scriptName}.lock`);
  const now = Date.now();

  try {
    // Ensure state directory exists
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    // Check if script ran recently
    if (fs.existsSync(lockFile)) {
      const lastRun = parseInt(fs.readFileSync(lockFile, 'utf8'));
      if (!isNaN(lastRun) && (now - lastRun < windowMs)) {
        // Script ran too recently - likely a duplicate execution
        return false;
      }
    }

    // Update lock file with current timestamp
    fs.writeFileSync(lockFile, now.toString(), 'utf8');
    return true;
  } catch (error) {
    // If lock file handling fails, allow execution anyway
    return true;
  }
}

/**
 * Check and prevent duplicate execution, exiting if duplicate detected
 * @param {string} scriptName - Name of the script
 * @param {number} windowMs - Time window in milliseconds (default: 1000ms)
 */
function preventDuplicateExecutionOrExit(scriptName, windowMs = 1000) {
  if (!preventDuplicateExecution(scriptName, windowMs)) {
    process.exit(0);
  }
}

module.exports = {
  preventDuplicateExecution,
  preventDuplicateExecutionOrExit
};
