/**
 * Form actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Select option from dropdown.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function selectOption(browser: ChromeBrowser, selector: string, value: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Check checkbox.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP click for proper React compatibility.
 */
export declare function check(browser: ChromeBrowser, selector: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Uncheck checkbox.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP click for proper React compatibility.
 */
export declare function uncheck(browser: ChromeBrowser, selector: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Upload file to input element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function uploadFile(browser: ChromeBrowser, selector: string, filePath: string, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=forms.d.ts.map