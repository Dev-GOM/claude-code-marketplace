/**
 * Scroll actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Scroll page or element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Note: x and y are both optional - you can scroll on just one axis if needed.
 */
export declare function scroll(browser: ChromeBrowser, options?: {
    x?: number;
    y?: number;
    selector?: string;
} & ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=scroll.d.ts.map