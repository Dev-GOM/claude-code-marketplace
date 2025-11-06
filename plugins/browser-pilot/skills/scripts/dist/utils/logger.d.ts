/**
 * Logger utility for CLI commands
 * Provides consistent logging with verbosity control
 */
export declare enum LogLevel {
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
 * Format timestamp in local time with milliseconds
 * Shared timestamp format for consistency across logger and interaction maps
 * Example: 2025-01-05 13:45:23.123
 */
export declare function getLocalTimestamp(): string;
declare class Logger {
    private level;
    private prefix;
    private timestamp;
    private logFile;
    constructor(options?: LoggerOptions);
    /**
     * Initialize log file (create or clear)
     */
    private initLogFile;
    /**
     * Write log message to file
     */
    private writeToFile;
    /**
     * Enable file logging
     */
    enableFileLogging(filePath: string): void;
    /**
     * Disable file logging
     */
    disableFileLogging(): void;
    /**
     * Enable timestamp in logs
     */
    enableTimestamp(): void;
    /**
     * Disable timestamp in logs
     */
    disableTimestamp(): void;
    /**
     * Format timestamp in local time
     * Example: 2025-01-05 13:45:23
     */
    private getTimestamp;
    private formatMessage;
    error(message: string, error?: unknown): void;
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
    verbose(message: string): void;
    success(message: string): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
}
export declare const logger: Logger;
export declare function createLogger(options?: LoggerOptions): Logger;
export {};
//# sourceMappingURL=logger.d.ts.map