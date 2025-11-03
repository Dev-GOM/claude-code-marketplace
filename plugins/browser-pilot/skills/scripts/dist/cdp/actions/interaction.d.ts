/**
 * Interaction actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Click element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//button[text()='Click'])[2] selects the 2nd button.
 */
export declare function click(browser: ChromeBrowser, selector: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Fill input field.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//input[@type='text'])[2] selects the 2nd input.
 * Uses CDP click + insertText for proper React compatibility.
 */
export declare function fill(browser: ChromeBrowser, selector: string, value: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Hover over element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP mouseMoved event for proper React compatibility.
 */
export declare function hover(browser: ChromeBrowser, selector: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Focus element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function focus(browser: ChromeBrowser, selector: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Blur element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export declare function blur(browser: ChromeBrowser, selector: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Drag and drop from one element to another.
 * Uses CDP mouse events for proper React/framework compatibility.
 */
export declare function dragAndDrop(browser: ChromeBrowser, sourceSelector: string, targetSelector: string, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=interaction.d.ts.map