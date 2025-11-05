/**
 * Utility functions for Browser Pilot
 */
/**
 * Get project root directory.
 *
 * Strategy (in order of priority):
 * 1. CLAUDE_PROJECT_DIR environment variable
 * 2. Shared config file (if running from scripts folder)
 * 3. process.cwd() (when running from project root via wrapper)
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
/**
 * Human-like random delay to avoid bot detection
 * @param minMs Minimum delay in milliseconds (default: ACTION_DELAY_MEDIUM * 3)
 * @param maxMs Maximum delay in milliseconds (default: ACTION_DELAY_LONG + ACTION_DELAY_MEDIUM * 3)
 * @returns Promise that resolves after the delay
 */
export declare function humanDelay(minMs?: number, maxMs?: number): Promise<void>;
//# sourceMappingURL=utils.d.ts.map