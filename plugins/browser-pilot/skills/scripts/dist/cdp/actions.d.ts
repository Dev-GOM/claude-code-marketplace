/**
 * Core CDP actions for browser automation.
 */
import { ChromeBrowser } from './browser';
export * from './actions-extra';
export interface ActionResult {
    success: boolean;
    [key: string]: any;
}
/**
 * Navigate to URL.
 */
export declare function navigate(browser: ChromeBrowser, url: string): Promise<ActionResult>;
/**
 * Wait for page load complete.
 */
export declare function waitForLoad(browser: ChromeBrowser, timeout?: number): Promise<ActionResult>;
/**
 * Click element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//button[text()='Click'])[2] selects the 2nd button.
 */
export declare function click(browser: ChromeBrowser, selector: string): Promise<ActionResult>;
/**
 * Fill input field.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//input[@type='text'])[2] selects the 2nd input.
 */
export declare function fill(browser: ChromeBrowser, selector: string, value: string): Promise<ActionResult>;
/**
 * Take screenshot.
 */
export declare function screenshot(browser: ChromeBrowser, outputPath: string, fullPage?: boolean): Promise<ActionResult>;
/**
 * Evaluate JavaScript.
 */
export declare function evaluate(browser: ChromeBrowser, script: string): Promise<ActionResult>;
/**
 * Extract text from element or body.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function extractText(browser: ChromeBrowser, selector?: string): Promise<ActionResult>;
/**
 * Generate PDF from current page.
 */
export declare function generatePdf(browser: ChromeBrowser, outputPath: string, landscape?: boolean, printBackground?: boolean): Promise<ActionResult>;
/**
 * Get all cookies.
 */
export declare function getCookies(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Set a cookie.
 */
export declare function setCookie(browser: ChromeBrowser, name: string, value: string, domain?: string, path?: string, secure?: boolean, httpOnly?: boolean): Promise<ActionResult>;
/**
 * Delete cookies.
 */
export declare function deleteCookies(browser: ChromeBrowser, name?: string): Promise<ActionResult>;
/**
 * Create new tab.
 */
export declare function newTab(browser: ChromeBrowser, url?: string): Promise<ActionResult>;
/**
 * List all tabs.
 */
export declare function listTabs(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Switch to tab.
 */
export declare function switchTab(browser: ChromeBrowser, targetId?: string, index?: number): Promise<ActionResult>;
/**
 * Close tab.
 */
export declare function closeTab(browser: ChromeBrowser, targetId?: string, index?: number): Promise<ActionResult>;
/**
 * Hover over element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function hover(browser: ChromeBrowser, selector: string): Promise<ActionResult>;
/**
 * Focus element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function focus(browser: ChromeBrowser, selector: string): Promise<ActionResult>;
/**
 * Blur element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function blur(browser: ChromeBrowser, selector: string): Promise<ActionResult>;
//# sourceMappingURL=actions.d.ts.map