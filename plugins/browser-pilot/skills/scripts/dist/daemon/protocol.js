"use strict";
/**
 * IPC Protocol definitions for Browser Pilot Daemon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAEMON_COMMANDS = exports.IPCErrorCodes = exports.IPCError = exports.IDLE_SHUTDOWN_TIMEOUT = exports.DEFAULT_TIMEOUT = exports.STATE_FILENAME = exports.PID_FILENAME = exports.SOCKET_PATH_PREFIX = void 0;
exports.getProjectSocketName = getProjectSocketName;
/**
 * Protocol constants
 */
exports.SOCKET_PATH_PREFIX = 'daemon';
exports.PID_FILENAME = 'daemon.pid';
exports.STATE_FILENAME = 'daemon-state.json';
exports.DEFAULT_TIMEOUT = 30000; // 30 seconds
exports.IDLE_SHUTDOWN_TIMEOUT = 1800000; // 30 minutes
/**
 * Get project-specific socket name
 * Uses project folder name to create unique socket for each project
 */
function getProjectSocketName() {
    const { basename } = require('path');
    const { findProjectRoot } = require('../cdp/utils');
    const projectRoot = findProjectRoot();
    const projectName = basename(projectRoot)
        .replace(/[^a-zA-Z0-9_-]/g, '-') // Replace special chars with hyphen
        .toLowerCase();
    return `${exports.SOCKET_PATH_PREFIX}-${projectName}`;
}
/**
 * Protocol errors
 */
class IPCError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'IPCError';
    }
}
exports.IPCError = IPCError;
exports.IPCErrorCodes = {
    TIMEOUT: 'TIMEOUT',
    DAEMON_NOT_RUNNING: 'DAEMON_NOT_RUNNING',
    DAEMON_ALREADY_RUNNING: 'DAEMON_ALREADY_RUNNING',
    BROWSER_NOT_CONNECTED: 'BROWSER_NOT_CONNECTED',
    COMMAND_FAILED: 'COMMAND_FAILED',
    INVALID_REQUEST: 'INVALID_REQUEST',
    CONNECTION_ERROR: 'CONNECTION_ERROR'
};
/**
 * Daemon command constants
 */
exports.DAEMON_COMMANDS = {
    // Navigation
    NAVIGATE: 'navigate',
    BACK: 'back',
    FORWARD: 'forward',
    RELOAD: 'reload',
    // Interaction
    CLICK: 'click',
    FILL: 'fill',
    HOVER: 'hover',
    PRESS: 'press',
    TYPE: 'type',
    // Capture
    SCREENSHOT: 'screenshot',
    PDF: 'pdf',
    // Data
    EXTRACT: 'extract',
    CONTENT: 'content',
    FIND: 'find',
    EVAL: 'eval',
    // Console
    CONSOLE: 'console',
    // Wait
    WAIT: 'wait',
    WAIT_IDLE: 'wait-idle',
    SLEEP: 'sleep',
    // Scroll
    SCROLL: 'scroll',
    // Daemon management
    DAEMON_STATUS: 'daemon-status',
    DAEMON_STOP: 'daemon-stop',
    // Map operations
    QUERY_MAP: 'query-map',
    GENERATE_MAP: 'generate-map',
    GET_MAP_STATUS: 'get-map-status'
};
//# sourceMappingURL=protocol.js.map