"use strict";
/**
 * Utility functions for Browser Pilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectRoot = findProjectRoot;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. Git repository root (most reliable, works even after 'cd')
 * 2. INIT_CWD (npm's original working directory)
 * 3. process.cwd() (fallback)
 */
function findProjectRoot() {
    // Strategy 1: Try to find Git repository root
    try {
        const gitRoot = (0, child_process_1.execSync)('git rev-parse --show-toplevel', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
        // Convert Unix-style path to Windows path if needed
        if (gitRoot && (0, fs_1.existsSync)(gitRoot)) {
            return gitRoot.replace(/\//g, '\\');
        }
    }
    catch (error) {
        // Git not available or not in a Git repository, try next strategy
    }
    // Strategy 2: Use INIT_CWD (set by npm)
    if (process.env.INIT_CWD) {
        return process.env.INIT_CWD;
    }
    // Strategy 3: Fallback to current working directory
    return process.cwd();
}
//# sourceMappingURL=utils.js.map