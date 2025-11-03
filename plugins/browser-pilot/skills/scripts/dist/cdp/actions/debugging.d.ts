/**
 * Debugging actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Get console messages.
 *
 * Returns console messages that have been collected since the browser connected.
 * Messages are automatically collected when Log domain is enabled during connection.
 */
export declare function getConsoleMessages(browser: ChromeBrowser, errorOnly?: boolean, options?: ActionOptions): Promise<ActionResult>;
/**
 * Get accessibility tree snapshot.
 */
export declare function getAccessibilitySnapshot(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
/**
 * Find element and return its information.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function findElement(browser: ChromeBrowser, selector: string, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=debugging.d.ts.map