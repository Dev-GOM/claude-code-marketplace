"use strict";
/**
 * Utility functions for Browser Pilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectRoot = findProjectRoot;
exports.getFindElementScript = getFindElementScript;
exports.humanDelay = humanDelay;
const fs_1 = require("fs");
const path_1 = require("path");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
/**
 * Get shared config file path in plugin skills folder
 * Uses hardcoded home directory path for reliability
 */
function getSharedConfigPath() {
    const { homedir } = require('os');
    const homeDir = homedir();
    return (0, path_1.join)(homeDir, '.claude', 'plugins', 'marketplaces', 'dev-gom-plugins', 'plugins', 'browser-pilot', 'skills', 'browser-pilot-config.json');
}
/**
 * Load shared configuration from plugin folder
 */
function loadSharedConfig() {
    const configPath = getSharedConfigPath();
    if (!(0, fs_1.existsSync)(configPath)) {
        return { projects: {} };
    }
    try {
        const data = (0, fs_1.readFileSync)(configPath, 'utf-8');
        return JSON.parse(data);
    }
    catch (_error) {
        return { projects: {} };
    }
}
/**
 * Compare two paths for equality (cross-platform, case-insensitive on Windows)
 */
function pathsEqual(path1, path2) {
    return (0, path_1.normalize)((0, path_1.resolve)(path1)).toLowerCase() ===
        (0, path_1.normalize)((0, path_1.resolve)(path2)).toLowerCase();
}
/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. CLAUDE_PROJECT_DIR environment variable
 * 2. Shared config file (if running from scripts folder)
 *
 * No fallback to process.cwd() - requires explicit project configuration.
 */
function findProjectRoot() {
    // 1. Environment variable has highest priority
    if (process.env.CLAUDE_PROJECT_DIR) {
        return process.env.CLAUDE_PROJECT_DIR;
    }
    const cwd = process.cwd();
    // 2. If running from scripts folder, check shared config
    // More robust check: compare exact path (cross-platform, case-insensitive)
    const scriptsDir = (0, path_1.join)(__dirname, '..', '..');
    if (pathsEqual(cwd, scriptsDir)) {
        try {
            const config = loadSharedConfig();
            const projects = Object.values(config.projects);
            if (projects.length === 1) {
                // Only one project configured, use it
                return projects[0].rootPath;
            }
            else if (projects.length > 1) {
                // Multiple projects: use the most recently used one
                const sorted = projects.sort((a, b) => {
                    // Handle invalid dates: treat as 0 to ensure predictable sorting
                    const aTime = new Date(a.lastUsed || 0).getTime();
                    const bTime = new Date(b.lastUsed || 0).getTime();
                    return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);
                });
                return sorted[0].rootPath;
            }
        }
        catch (error) {
            logger_1.logger.error(`Failed to load shared config: ${error}`);
            throw new Error('Could not determine project root: CLAUDE_PROJECT_DIR not set and no projects in shared config');
        }
    }
    // No fallback to process.cwd() - require explicit project configuration
    throw new Error('Could not determine project root: CLAUDE_PROJECT_DIR not set');
}
/**
 * Returns the findElement helper function as a JavaScript string
 * for injection into browser context.
 *
 * Supports:
 * - CSS selectors: 'button.primary'
 * - XPath selectors: '//button[@id="submit"]'
 * - XPath with indexing: '(//button[text()="Click"])[2]'
 */
function getFindElementScript() {
    return `
    function findElement(sel) {
      if (sel.startsWith('//') || sel.startsWith('(//')) {
        // XPath selector - check for indexing pattern: (...)[N]
        const indexMatch = sel.match(/^\\((.*)\\)\\[(\\d+)\\]$/);

        if (indexMatch) {
          // Has indexing: (//xpath)[N]
          const xpath = indexMatch[1];
          const index = parseInt(indexMatch[2]) - 1; // XPath is 1-based, JS is 0-based

          const result = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );

          return result.snapshotItem(index);
        } else {
          // No indexing - return first match
          const result = document.evaluate(
            sel,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          return result.singleNodeValue;
        }
      } else {
        // CSS selector
        return document.querySelector(sel);
      }
    }
  `;
}
/**
 * Human-like random delay to avoid bot detection
 * @param minMs Minimum delay in milliseconds (default: ACTION_DELAY_MEDIUM * 3)
 * @param maxMs Maximum delay in milliseconds (default: ACTION_DELAY_LONG + ACTION_DELAY_MEDIUM * 3)
 * @returns Promise that resolves after the delay
 */
function humanDelay(minMs = constants_1.TIMING.ACTION_DELAY_MEDIUM * 3, maxMs = constants_1.TIMING.ACTION_DELAY_LONG + constants_1.TIMING.ACTION_DELAY_MEDIUM * 3) {
    const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delayMs));
}
//# sourceMappingURL=utils.js.map