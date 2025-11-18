/**
 * Unity WebSocket CLI Logger
 *
 * Centralized logging utility with configurable log levels.
 * Supports ERROR, WARN, INFO, DEBUG, and VERBOSE levels.
 */

import { LogLevel, LOG_LEVEL_NAMES, ENV } from '@/constants';

/**
 * Current log level (configurable via environment variable)
 */
let currentLogLevel: LogLevel = LogLevel.INFO;

// Read log level from environment
const envLogLevel = process.env[ENV.LOG_LEVEL];
if (envLogLevel) {
  const level = parseInt(envLogLevel, 10);
  if (level >= LogLevel.ERROR && level <= LogLevel.VERBOSE) {
    currentLogLevel = level;
  }
}

/**
 * Set log level programmatically
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Get current log level
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * Sanitize log message (prevents log injection)
 */
function sanitizeMessage(message: string): string {
  // Remove or escape newline characters to prevent log injection
  return message.replace(/[\r\n]/g, ' ').trim();
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  const timestamp = `${hours}:${minutes}:${seconds}.${ms}`;
  const levelName = LOG_LEVEL_NAMES[level];
  const sanitized = sanitizeMessage(message);
  return `[${timestamp}] [${levelName}] ${sanitized}`;
}

/**
 * Log error message (always shown)
 */
export function error(message: string, err?: Error | unknown): void {
  if (currentLogLevel >= LogLevel.ERROR) {
    console.error(formatMessage(LogLevel.ERROR, message));
    if (err instanceof Error) {
      console.error('  Error:', err.message);

      // Show UnityRPCError data if available
      if ('data' in err && err.data) {
        console.error('  Details:', err.data);
      }

      if (currentLogLevel >= LogLevel.DEBUG && err.stack) {
        console.error('  Stack:', err.stack);
      }
    } else if (err) {
      console.error('  Error:', String(err));
    }
  }
}

/**
 * Log warning message
 */
export function warn(message: string): void {
  if (currentLogLevel >= LogLevel.WARN) {
    console.warn(formatMessage(LogLevel.WARN, message));
  }
}

/**
 * Log info message (default level)
 */
export function info(message: string): void {
  if (currentLogLevel >= LogLevel.INFO) {
    console.log(formatMessage(LogLevel.INFO, message));
  }
}

/**
 * Log debug message
 */
export function debug(message: string): void {
  if (currentLogLevel >= LogLevel.DEBUG) {
    console.log(formatMessage(LogLevel.DEBUG, message));
  }
}

/**
 * Log verbose message (detailed)
 */
export function verbose(message: string): void {
  if (currentLogLevel >= LogLevel.VERBOSE) {
    console.log(formatMessage(LogLevel.VERBOSE, message));
  }
}

/**
 * Log object in JSON format (debug level)
 */
export function debugObject(label: string, obj: unknown): void {
  if (currentLogLevel >= LogLevel.DEBUG) {
    console.log(formatMessage(LogLevel.DEBUG, `${label}:`));
    console.log(JSON.stringify(obj, null, 2));
  }
}

/**
 * Logger interface (named exports above)
 */
export const logger = {
  setLogLevel,
  getLogLevel,
  error,
  warn,
  info,
  debug,
  verbose,
  debugObject,
};

export default logger;
