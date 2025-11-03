/**
 * Tab management actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Create new tab.
 */
export declare function newTab(browser: ChromeBrowser, url?: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * List all tabs.
 */
export declare function listTabs(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
/**
 * Switch to tab.
 */
export declare function switchTab(browser: ChromeBrowser, targetId?: string, index?: number, options?: ActionOptions): Promise<ActionResult>;
/**
 * Close tab.
 */
export declare function closeTab(browser: ChromeBrowser, targetId?: string, index?: number, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=tabs.d.ts.map