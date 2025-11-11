/**
 * Simple synchronous logger for hook scripts
 * Logs to both console and file buffer, writes to file on close
 */

const fs = require('fs');
const path = require('path');

/**
 * Get local timestamp string
 */
function getLocalTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Create a logger instance
 * @param {string} logFileName - Name of the log file (e.g., 'init-log.txt')
 * @param {string} title - Title for the log file (e.g., 'Unity WebSocket Initialization Log')
 * @param {string} [projectName] - Optional project name to include in log filename
 */
function createLogger(logFileName, title, projectName) {
  // If projectName is provided, insert it into the filename
  let finalLogFileName = logFileName;
  if (projectName) {
    const ext = path.extname(logFileName);
    const base = path.basename(logFileName, ext);
    finalLogFileName = `${base}-${projectName}${ext}`;
  }

  const logFile = path.join(__dirname, finalLogFileName);
  const logBuffer = [];

  // Initialize log
  logBuffer.push(`=== ${title} ===`);
  logBuffer.push(`Started: ${getLocalTimestamp()}`);
  logBuffer.push('');

  return {
    /**
     * Log info message
     */
    log(message) {
      const timestamp = getLocalTimestamp();
      const logMessage = `[${timestamp}] ${message}`;
      console.log(message);
      logBuffer.push(logMessage);
    },

    /**
     * Log error message
     */
    error(message) {
      const timestamp = getLocalTimestamp();
      const logMessage = `[${timestamp}] ERROR: ${message}`;
      console.error(message);
      logBuffer.push(logMessage);
    },

    /**
     * Log warning message
     */
    warn(message) {
      const timestamp = getLocalTimestamp();
      const logMessage = `[${timestamp}] WARN: ${message}`;
      console.warn(message);
      logBuffer.push(logMessage);
    },

    /**
     * Write log buffer to file and close
     */
    close() {
      try {
        logBuffer.push('');
        logBuffer.push(`Completed: ${getLocalTimestamp()}`);
        fs.writeFileSync(logFile, logBuffer.join('\n'), 'utf-8');
      } catch (error) {
        console.error('Failed to write log file:', error.message);
      }
    }
  };
}

module.exports = { createLogger };
