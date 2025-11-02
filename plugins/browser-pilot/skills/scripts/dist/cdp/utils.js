"use strict";
/**
 * Utility functions for Browser Pilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectRoot = findProjectRoot;
/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. CLAUDE_PROJECT_ROOT (set by SKILL.md before cd)
 * 2. process.cwd() (fallback)
 */
function findProjectRoot() {
    // SKILL.md sets CLAUDE_PROJECT_ROOT before cd to preserve original project root
    if (process.env.CLAUDE_PROJECT_ROOT) {
        return process.env.CLAUDE_PROJECT_ROOT;
    }
    // Fallback to current working directory
    return process.cwd();
}
//# sourceMappingURL=utils.js.map