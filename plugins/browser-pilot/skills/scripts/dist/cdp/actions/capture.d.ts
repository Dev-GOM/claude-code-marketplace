/**
 * Capture actions (screenshot, PDF) for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Take screenshot.
 * @param browser - ChromeBrowser instance
 * @param filename - Screenshot filename (automatically saved to .browser-pilot/screenshots/)
 * @param fullPage - Capture full page or viewport only
 * @param options - Action options
 */
export declare function screenshot(browser: ChromeBrowser, filename: string, fullPage?: boolean, options?: ActionOptions): Promise<ActionResult>;
/**
 * Generate PDF from current page.
 * @param browser - ChromeBrowser instance
 * @param filename - PDF filename (automatically saved to .browser-pilot/pdfs/)
 * @param landscape - Use landscape orientation
 * @param printBackground - Print background graphics
 * @param options - Action options
 */
export declare function generatePdf(browser: ChromeBrowser, filename: string, landscape?: boolean, printBackground?: boolean, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=capture.d.ts.map