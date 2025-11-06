/**
 * Navigation actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Navigate to URL.
 */
export declare function navigate(browser: ChromeBrowser, url: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Wait for page load complete.
 */
export declare function waitForLoad(browser: ChromeBrowser, timeout?: number, options?: ActionOptions): Promise<ActionResult>;
/**
 * Reload page.
 */
export declare function reload(browser: ChromeBrowser, hard?: boolean, options?: ActionOptions): Promise<ActionResult>;
/**
 * Navigate back in history.
 */
export declare function goBack(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
/**
 * Navigate forward in history.
 */
export declare function goForward(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=navigation.d.ts.map