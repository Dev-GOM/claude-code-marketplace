"use strict";
/**
 * Helper functions for Browser Pilot actions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OPTIONS = exports.SELECTOR_RETRY_CONFIG = void 0;
exports.mergeOptions = mergeOptions;
exports.sleep = sleep;
exports.checkErrors = checkErrors;
exports.checkConsoleErrors = checkConsoleErrors;
exports.waitForActionComplete = waitForActionComplete;
exports.logActionError = logActionError;
exports.ensureOutputPath = ensureOutputPath;
const path_1 = require("path");
const fs_1 = require("fs");
const config_1 = require("../config");
const wait_1 = require("./wait");
const logger_1 = require("../../utils/logger");
const constants_1 = require("../../constants");
/**
 * Constants for error checking and timing
 */
const RECENT_MESSAGE_TIMEOUT_MS = constants_1.TIMING.RECENT_MESSAGE_WINDOW;
const NAVIGATION_WAIT_DELAY_MS = constants_1.TIMING.NETWORK_IDLE_TIMEOUT;
/**
 * Constants for selector retry logic
 */
exports.SELECTOR_RETRY_CONFIG = {
    MAX_ATTEMPTS: 3,
    MAP_FILENAME: constants_1.FS.INTERACTION_MAP_FILE,
    MAP_FOLDER: constants_1.FS.OUTPUT_DIR
};
/**
 * Default action options
 */
exports.DEFAULT_OPTIONS = {
    verbose: true,
    logLevel: 'all',
    waitForNavigation: false
};
/**
 * Helper: Merge user options with defaults
 */
function mergeOptions(options) {
    return {
        verbose: options?.verbose ?? exports.DEFAULT_OPTIONS.verbose,
        logLevel: options?.logLevel ?? exports.DEFAULT_OPTIONS.logLevel,
        waitForNavigation: options?.waitForNavigation ?? exports.DEFAULT_OPTIONS.waitForNavigation
    };
}
/**
 * Helper: Sleep for specified milliseconds.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Helper: Check browser console and network for errors and warnings after an action.
 * @param browser - ChromeBrowser instance
 * @param logLevel - Log level ('all', 'errors-only', 'none')
 */
function checkErrors(browser, logLevel = 'all') {
    if (logLevel === 'none') {
        return; // Skip logging
    }
    const messages = browser.getConsoleMessages();
    const networkErrors = browser.getNetworkErrors();
    // Filter for errors and warnings from recent messages
    const recentMessages = messages.filter(msg => {
        const age = Date.now() - msg.timestamp;
        return age < RECENT_MESSAGE_TIMEOUT_MS;
    });
    const recentNetworkErrors = networkErrors.filter(err => {
        const age = Date.now() - err.timestamp;
        return age < RECENT_MESSAGE_TIMEOUT_MS;
    });
    const consoleErrors = recentMessages.filter(msg => msg.level === 'error');
    const consoleWarnings = recentMessages.filter(msg => msg.level === 'warning');
    // Console Errors
    if (consoleErrors.length > 0) {
        logger_1.logger.error(`\n❌ ${consoleErrors.length} console error(s) detected:`);
        consoleErrors.forEach((err, idx) => {
            logger_1.logger.error(`   ${idx + 1}. ${err.text}`);
            if (err.url) {
                logger_1.logger.error(`      at ${err.url}:${err.lineNumber || 0}`);
            }
        });
    }
    // Console Warnings (only if logLevel is 'all')
    if (logLevel === 'all' && consoleWarnings.length > 0) {
        logger_1.logger.warn(`\n⚠️  ${consoleWarnings.length} console warning(s) detected:`);
        consoleWarnings.forEach((warn, idx) => {
            logger_1.logger.warn(`   ${idx + 1}. ${warn.text}`);
        });
    }
    // Network Errors
    if (recentNetworkErrors.length > 0) {
        logger_1.logger.error(`\n🌐 ${recentNetworkErrors.length} network error(s) detected:`);
        recentNetworkErrors.forEach((err, idx) => {
            logger_1.logger.error(`   ${idx + 1}. ${err.url}`);
            logger_1.logger.error(`      ${err.errorText}`);
            if (err.statusCode) {
                logger_1.logger.error(`      Status: ${err.statusCode}`);
            }
        });
    }
}
/**
 * @deprecated Use checkErrors instead
 */
function checkConsoleErrors(browser) {
    checkErrors(browser, 'all');
}
/**
 * Helper: Wait for action completion (navigation + errors check).
 * Reduces code duplication across click, fill, and other interactive actions.
 */
async function waitForActionComplete(browser, opts) {
    if (opts.waitForNavigation) {
        if (opts.verbose)
            logger_1.logger.info(`⏳ Waiting for page navigation...`);
        await (0, wait_1.waitForNetworkIdle)(browser, constants_1.TIMING.ACTION_DELAY_NAVIGATION, 0, { verbose: false });
        await sleep(NAVIGATION_WAIT_DELAY_MS); // Additional delay for errors to surface
    }
    checkErrors(browser, opts.logLevel);
}
/**
 * Helper: Log action error with consistent formatting
 * @param context - Error context (e.g., 'Get viewport failed')
 * @param error - Error object
 * @param verbose - Whether to log the error
 */
function logActionError(context, error, verbose) {
    if (!verbose)
        return;
    logger_1.logger.error(`❌ ${context}`);
    if (error instanceof Error) {
        logger_1.logger.error(`   Error: ${error.message}`);
    }
    else {
        logger_1.logger.error(`   Error: ${String(error)}`);
    }
}
/**
 * Helper: Ensure output path (convert relative to .browser-pilot/).
 * Security: Prevents path traversal attacks and rejects absolute paths.
 * Uses getOutputDir() from config to get project-specific output directory.
 */
function ensureOutputPath(path) {
    // Reject absolute paths
    if ((0, path_1.resolve)(path) === path) {
        throw new Error('Absolute paths are not allowed. Use relative paths only.');
    }
    // Get output directory from project config (auto-creates .browser-pilot/)
    const outputDir = (0, config_1.getOutputDir)();
    const absolutePath = (0, path_1.resolve)(outputDir, path);
    // Prevent path traversal attacks
    if (!absolutePath.startsWith(outputDir)) {
        throw new Error('Path traversal detected. Files must be within .browser-pilot directory.');
    }
    // Ensure subdirectory exists (if path includes subdirectories)
    const dir = (0, path_1.dirname)(absolutePath);
    if (!(0, fs_1.existsSync)(dir)) {
        (0, fs_1.mkdirSync)(dir, { recursive: true });
    }
    return absolutePath;
}
//# sourceMappingURL=helpers.js.map