/**
 * Capture actions (screenshot, PDF) for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Take screenshot.
 */
export declare function screenshot(browser: ChromeBrowser, outputPath: string, fullPage?: boolean, options?: ActionOptions): Promise<ActionResult>;
/**
 * Generate PDF from current page.
 */
export declare function generatePdf(browser: ChromeBrowser, outputPath: string, landscape?: boolean, printBackground?: boolean, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=capture.d.ts.map