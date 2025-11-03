"use strict";
/**
 * Utility functions for Browser Pilot
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findProjectRoot = findProjectRoot;
exports.getFindElementScript = getFindElementScript;
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
//# sourceMappingURL=utils.js.map