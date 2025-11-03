/**
 * Data extraction and evaluation actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Evaluate JavaScript.
 */
export declare function evaluate(browser: ChromeBrowser, script: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Extract text from element or body.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function extractText(browser: ChromeBrowser, selector?: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Extract data using multiple selectors.
 */
export declare function extractData(browser: ChromeBrowser, selectors: Record<string, string>, options?: ActionOptions): Promise<ActionResult>;
/**
 * Get page HTML content.
 */
export declare function getContent(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
/**
 * Get element property value.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function getElementProperty(browser: ChromeBrowser, selector: string, propertyName: string, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=data.d.ts.map