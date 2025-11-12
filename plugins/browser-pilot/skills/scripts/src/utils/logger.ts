/**
 * Logger utility for CLI commands
 * Provides consistent logging with verbosity control
 */

import { writeFileSync, appendFileSync } from 'fs';
import { dirname } from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  logFile?: string;
}

/**
 * Get default log level from environment variable
 * Set BP_LOG_LEVEL=DEBUG to change log level
 */
function getDefaultLogLevel(): LogLevel {
  const envLevel = process.env.BP_LOG_LEVEL?.toUpperCase();
  switch (envLevel) {
    case 'ERROR': return LogLevel.ERROR;
    case 'WARN': return LogLevel.WARN;
    case 'INFO': return LogLevel.INFO;
    case 'DEBUG': return LogLevel.DEBUG;
    case 'VERBOSE': return LogLevel.VERBOSE;
    default: return LogLevel.INFO;
  }
}

/**
 * Format timestamp in local time with milliseconds
 * Shared timestamp format for consistency across logger and interaction maps
 * Example: 2025-11-05 13:45:23.123
 */
export function getLocalTimestamp(): string {
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

class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamp: boolean;
  private logFile: string | null;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? getDefaultLogLevel();
    this.prefix = options.prefix ?? '[browser-pilot]';
    this.timestamp = options.timestamp ?? false;
    this.logFile = options.logFile ?? null;

    // Initialize log file if specified
    if (this.logFile) {
      this.initLogFile();
    }
  }

  /**
   * Initialize log file (create or clear)
   */
  private initLogFile(): void {
    if (!this.logFile) return;

    try {
      // Create directory if needed
      const fs = require('fs');
      const dir = dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create empty log file
      writeFileSync(this.logFile, `=== Browser Pilot Daemon Log ===\nStarted: ${getLocalTimestamp()}\n\n`, 'utf-8');
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }

  /**
   * Write log message to file
   */
  private writeToFile(message: string): void {
    if (!this.logFile) return;

    try {
      appendFileSync(this.logFile, message + '\n', 'utf-8');
    } catch (_error) {
      // Silently fail - don't break logging
    }
  }

  /**
   * Enable file logging
   */
  enableFileLogging(filePath: string): void {
    this.logFile = filePath;
    this.timestamp = true; // Always enable timestamp for file logging
    this.initLogFile();
  }

  /**
   * Disable file logging
   */
  disableFileLogging(): void {
    this.logFile = null;
  }

  /**
   * Enable timestamp in logs
   */
  enableTimestamp(): void {
    this.timestamp = true;
  }

  /**
   * Disable timestamp in logs
   */
  disableTimestamp(): void {
    this.timestamp = false;
  }

  /**
   * Format timestamp in local time
   * Example: 2025-11-05 13:45:23
   */
  private getTimestamp(): string {
    return getLocalTimestamp();
  }

  private formatMessage(level: string, message: string): string {
    const parts: string[] = [];

    if (this.timestamp) {
      parts.push(`[${this.getTimestamp()}]`);
    }

    if (this.prefix) {
      parts.push(this.prefix);
    }

    parts.push(`[${level}]`, message);

    return parts.join(' ');
  }

  error(message: string, error?: unknown): void {
    if (this.level >= LogLevel.ERROR) {
      const formattedMsg = this.formatMessage('ERROR', message);
      console.error(formattedMsg);
      this.writeToFile(formattedMsg);

      if (error instanceof Error) {
        const errorMsg = '   ' + error.message;
        console.error(errorMsg);
        this.writeToFile(errorMsg);

        if (this.level >= LogLevel.VERBOSE && error.stack) {
          const stackMsg = '   Stack: ' + error.stack;
          console.error(stackMsg);
          this.writeToFile(stackMsg);
        }
      } else if (error) {
        const errorStr = '   ' + String(error);
        console.error(errorStr);
        this.writeToFile(errorStr);
      }
    }
  }

  warn(message: string): void {
    if (this.level >= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message);
      console.warn(formatted);
      this.writeToFile(formatted);
    }
  }

  info(message: string): void {
    if (this.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  debug(message: string): void {
    if (this.level >= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  verbose(message: string): void {
    if (this.level >= LogLevel.VERBOSE) {
      const formatted = this.formatMessage('VERBOSE', message);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  success(message: string): void {
    if (this.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('✓', message);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

// Default logger instance
export const logger = new Logger();

// Factory function for creating custom loggers
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}
