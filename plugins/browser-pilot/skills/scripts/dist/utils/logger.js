"use strict";
/**
 * Logger utility for CLI commands
 * Provides consistent logging with verbosity control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
exports.getLocalTimestamp = getLocalTimestamp;
exports.createLogger = createLogger;
const fs_1 = require("fs");
const path_1 = require("path");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["VERBOSE"] = 4] = "VERBOSE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Get default log level from environment variable
 * Set BP_LOG_LEVEL=DEBUG to change log level
 */
function getDefaultLogLevel() {
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
 * Example: 2025-01-05 13:45:23.123
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
class Logger {
    level;
    prefix;
    timestamp;
    logFile;
    constructor(options = {}) {
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
    initLogFile() {
        if (!this.logFile)
            return;
        try {
            // Create directory if needed
            const fs = require('fs');
            const dir = (0, path_1.dirname)(this.logFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Create empty log file
            (0, fs_1.writeFileSync)(this.logFile, `=== Browser Pilot Daemon Log ===\nStarted: ${getLocalTimestamp()}\n\n`, 'utf-8');
        }
        catch (error) {
            console.error('Failed to initialize log file:', error);
        }
    }
    /**
     * Write log message to file
     */
    writeToFile(message) {
        if (!this.logFile)
            return;
        try {
            (0, fs_1.appendFileSync)(this.logFile, message + '\n', 'utf-8');
        }
        catch (_error) {
            // Silently fail - don't break logging
        }
    }
    /**
     * Enable file logging
     */
    enableFileLogging(filePath) {
        this.logFile = filePath;
        this.timestamp = true; // Always enable timestamp for file logging
        this.initLogFile();
    }
    /**
     * Disable file logging
     */
    disableFileLogging() {
        this.logFile = null;
    }
    /**
     * Enable timestamp in logs
     */
    enableTimestamp() {
        this.timestamp = true;
    }
    /**
     * Disable timestamp in logs
     */
    disableTimestamp() {
        this.timestamp = false;
    }
    /**
     * Format timestamp in local time
     * Example: 2025-01-05 13:45:23
     */
    getTimestamp() {
        return getLocalTimestamp();
    }
    formatMessage(level, message) {
        const parts = [];
        if (this.timestamp) {
            parts.push(`[${this.getTimestamp()}]`);
        }
        if (this.prefix) {
            parts.push(this.prefix);
        }
        parts.push(`[${level}]`, message);
        return parts.join(' ');
    }
    error(message, error) {
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
            }
            else if (error) {
                const errorStr = '   ' + String(error);
                console.error(errorStr);
                this.writeToFile(errorStr);
            }
        }
    }
    warn(message) {
        if (this.level >= LogLevel.WARN) {
            const formatted = this.formatMessage('WARN', message);
            console.warn(formatted);
            this.writeToFile(formatted);
        }
    }
    info(message) {
        if (this.level >= LogLevel.INFO) {
            const formatted = this.formatMessage('INFO', message);
            console.log(formatted);
            this.writeToFile(formatted);
        }
    }
    debug(message) {
        if (this.level >= LogLevel.DEBUG) {
            const formatted = this.formatMessage('DEBUG', message);
            console.log(formatted);
            this.writeToFile(formatted);
        }
    }
    verbose(message) {
        if (this.level >= LogLevel.VERBOSE) {
            const formatted = this.formatMessage('VERBOSE', message);
            console.log(formatted);
            this.writeToFile(formatted);
        }
    }
    success(message) {
        if (this.level >= LogLevel.INFO) {
            const formatted = this.formatMessage('✓', message);
            console.log(formatted);
            this.writeToFile(formatted);
        }
    }
    setLevel(level) {
        this.level = level;
    }
    getLevel() {
        return this.level;
    }
}
// Default logger instance
exports.logger = new Logger();
// Factory function for creating custom loggers
function createLogger(options = {}) {
    return new Logger(options);
}
//# sourceMappingURL=logger.js.map