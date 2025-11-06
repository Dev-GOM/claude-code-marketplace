"use strict";
/**
 * Helper functions for daemon-based CLI commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeViaDaemon = executeViaDaemon;
exports.displayResult = displayResult;
const client_1 = require("../daemon/client");
const manager_1 = require("../daemon/manager");
const constants_1 = require("../constants");
/**
 * Execute command via daemon (auto-start if needed)
 */
async function executeViaDaemon(command, params = {}, options = {}) {
    const { timeout = constants_1.TIMING.WAIT_FOR_NAVIGATION, verbose = true, autoStart = true } = options;
    // Ensure daemon is running
    if (autoStart) {
        const manager = new manager_1.DaemonManager();
        // If navigate command and daemon not running, pass initial URL
        const initialUrl = (command === 'navigate' && !manager.isRunning() && params.url)
            ? params.url
            : undefined;
        await manager.ensureRunning({ verbose, initialUrl });
    }
    // Send command to daemon
    const client = new client_1.IPCClient();
    try {
        const response = await client.sendRequest(command, params, timeout);
        return response;
    }
    finally {
        client.close();
    }
}
/**
 * Format and display command result
 */
function displayResult(response, verbose = true) {
    if (!verbose)
        return;
    if (response.success) {
        // Display success result based on data type
        const data = response.data;
        if (data && typeof data === 'object') {
            // Pretty print objects
            console.log(JSON.stringify(data, null, 2));
        }
        else if (data !== undefined) {
            // Print primitive values
            console.log(data);
        }
    }
    else {
        console.error('Error:', response.error);
    }
}
//# sourceMappingURL=daemon-helper.js.map