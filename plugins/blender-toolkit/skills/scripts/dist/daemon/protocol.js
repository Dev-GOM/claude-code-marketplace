"use strict";
/**
 * IPC Protocol definitions for Blender Toolkit Daemon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAEMON_COMMANDS = exports.SOCKET_PATH_PREFIX = exports.PID_FILENAME = void 0;
exports.getProjectSocketName = getProjectSocketName;
const crypto_1 = require("crypto");
const path_1 = require("path");
/**
 * File names and paths
 */
exports.PID_FILENAME = 'daemon.pid';
exports.SOCKET_PATH_PREFIX = 'daemon';
/**
 * Get project-specific socket name for daemon IPC
 * Same logic as browser-pilot
 */
function getProjectSocketName(projectRoot) {
    const root = projectRoot || process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const projectName = (0, path_1.basename)(root)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .toLowerCase();
    // Add hash of full path to prevent collision
    const hash = (0, crypto_1.createHash)('sha256')
        .update(root)
        .digest('hex')
        .substring(0, 8);
    return `${exports.SOCKET_PATH_PREFIX}-${projectName}-${hash}`;
}
/**
 * Daemon commands
 */
exports.DAEMON_COMMANDS = {
    // Status commands
    PING: 'ping',
    GET_STATUS: 'get-status',
    SHUTDOWN: 'shutdown',
    // Blender commands (pass-through to Blender WebSocket)
    BLENDER_COMMAND: 'blender-command',
};
//# sourceMappingURL=protocol.js.map