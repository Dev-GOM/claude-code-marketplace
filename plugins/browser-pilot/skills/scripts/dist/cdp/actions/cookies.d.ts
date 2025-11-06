/**
 * Cookie management actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Get all cookies.
 */
export declare function getCookies(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
/**
 * Set a cookie.
 */
export declare function setCookie(browser: ChromeBrowser, name: string, value: string, domain?: string, path?: string, secure?: boolean, httpOnly?: boolean, options?: ActionOptions): Promise<ActionResult>;
/**
 * Delete cookies.
 */
export declare function deleteCookies(browser: ChromeBrowser, name?: string, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=cookies.d.ts.map