/**
 * Emulation actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
export interface ViewportOptions {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    mobile?: boolean;
}
/**
 * Emulate media type or color scheme.
 */
export declare function emulateMedia(browser: ChromeBrowser, mediaType?: 'screen' | 'print', colorScheme?: 'light' | 'dark' | 'no-preference', options?: ActionOptions): Promise<ActionResult>;
/**
 * Set viewport size.
 * @param browser - ChromeBrowser instance
 * @param width - Viewport width in pixels
 * @param height - Viewport height in pixels
 * @param deviceScaleFactor - Device scale factor (default: 1)
 * @param mobile - Whether to emulate mobile device (default: false)
 * @param options - Action options
 */
export declare function setViewportSize(browser: ChromeBrowser, width: number, height: number, deviceScaleFactor?: number, mobile?: boolean, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=emulation.d.ts.map