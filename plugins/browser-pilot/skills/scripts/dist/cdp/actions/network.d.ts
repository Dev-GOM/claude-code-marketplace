/**
 * Network interception and mocking actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Set up network request interception.
 */
export declare function enableRequestInterception(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
/**
 * Disable network request interception.
 */
export declare function disableRequestInterception(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
/**
 * Mock a network request response.
 */
export declare function mockRequest(browser: ChromeBrowser, urlPattern: string, responseBody: string, statusCode?: number, headers?: Record<string, string>, options?: ActionOptions): Promise<ActionResult>;
/**
 * Block network requests matching pattern.
 */
export declare function blockRequest(browser: ChromeBrowser, urlPattern: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Unblock all network requests.
 */
export declare function unblockRequests(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=network.d.ts.map