/**
 * Wait actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Wait for specified milliseconds.
 */
export declare function waitMilliseconds(browser: ChromeBrowser, ms: number, options?: ActionOptions): Promise<ActionResult>;
/**
 * Wait for element to appear.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function waitFor(browser: ChromeBrowser, selector: string, timeout?: 30000, options?: ActionOptions): Promise<ActionResult>;
/**
 * Wait for network to be idle.
 */
export declare function waitForNetworkIdle(browser: ChromeBrowser, timeout?: number, _maxInflight?: number, options?: ActionOptions): Promise<ActionResult>;
/**
 * Wait for DOM to stabilize (no mutations for specified time).
 * Uses MutationObserver to detect when DOM changes stop.
 */
export declare function waitForDomStable(browser: ChromeBrowser, stableTime?: number, timeout?: number, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=wait.d.ts.map