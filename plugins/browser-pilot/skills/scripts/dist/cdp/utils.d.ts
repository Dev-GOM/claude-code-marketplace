/**
 * Utility functions for Browser Pilot
 */
/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. CLAUDE_PROJECT_ROOT environment variable
 * 2. Shared config file (if running from scripts folder)
 * 3. process.cwd() (fallback)
 */
export declare function findProjectRoot(): string;
/**
 * Returns the findElement helper function as a JavaScript string
 * for injection into browser context.
 *
 * Supports:
 * - CSS selectors: 'button.primary'
 * - XPath selectors: '//button[@id="submit"]'
 * - XPath with indexing: '(//button[text()="Click"])[2]'
 */
export declare function getFindElementScript(): string;
//# sourceMappingURL=utils.d.ts.map