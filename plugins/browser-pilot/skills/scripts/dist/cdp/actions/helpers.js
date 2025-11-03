"use strict";
/**
 * Helper functions for Browser Pilot actions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OPTIONS = void 0;
exports.mergeOptions = mergeOptions;
exports.sleep = sleep;
exports.checkConsoleErrors = checkConsoleErrors;
exports.ensureOutputPath = ensureOutputPath;
const path_1 = require("path");
const fs_1 = require("fs");
const utils_1 = require("../utils");
/**
 * Default action options
 */
exports.DEFAULT_OPTIONS = {
    verbose: true
};
/**
 * Helper: Merge user options with defaults
 */
function mergeOptions(options) {
    return {
        verbose: options?.verbose ?? exports.DEFAULT_OPTIONS.verbose
    };
}
/**
 * Helper: Sleep for specified milliseconds.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Helper: Check browser console for errors and warnings after an action.
 */
function checkConsoleErrors(browser) {
    const messages = browser.getConsoleMessages();
    // Filter for errors and warnings from recent messages (last 5 seconds)
    const recentMessages = messages.filter(msg => {
        const age = Date.now() - msg.timestamp;
        return age < 5000; // Last 5 seconds
    });
    const errors = recentMessages.filter(msg => msg.level === 'error');
    const warnings = recentMessages.filter(msg => msg.level === 'warning');
    if (errors.length > 0) {
        console.error(`\n⚠️  ${errors.length} console error(s) detected:`);
        errors.forEach((err, idx) => {
            console.error(`   ${idx + 1}. ${err.text}`);
            if (err.url) {
                console.error(`      at ${err.url}:${err.lineNumber || 0}`);
            }
        });
    }
    if (warnings.length > 0) {
        console.warn(`\n⚠️  ${warnings.length} console warning(s) detected:`);
        warnings.forEach((warn, idx) => {
            console.warn(`   ${idx + 1}. ${warn.text}`);
        });
    }
}
/**
 * Helper: Ensure output path (convert relative to .browser-pilot/).
 * Security: Prevents path traversal attacks and rejects absolute paths.
 */
function ensureOutputPath(path) {
    // Reject absolute paths
    if ((0, path_1.resolve)(path) === path) {
        throw new Error('Absolute paths are not allowed. Use relative paths only.');
    }
    // Relative path - save to project root/.browser-pilot/
    const projectRoot = (0, utils_1.findProjectRoot)();
    const outputDir = (0, path_1.resolve)(projectRoot, '.browser-pilot');
    const absolutePath = (0, path_1.resolve)(outputDir, path);
    // Prevent path traversal attacks
    if (!absolutePath.startsWith(outputDir)) {
        throw new Error('Path traversal detected. Files must be within .browser-pilot directory.');
    }
    // Ensure directory exists
    if (!(0, fs_1.existsSync)(outputDir)) {
        (0, fs_1.mkdirSync)(outputDir, { recursive: true });
    }
    return absolutePath;
}
//# sourceMappingURL=helpers.js.map