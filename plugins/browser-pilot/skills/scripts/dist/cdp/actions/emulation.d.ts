/**
 * Emulation actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Emulate media type or color scheme.
 */
export declare function emulateMedia(browser: ChromeBrowser, mediaType?: 'screen' | 'print', colorScheme?: 'light' | 'dark' | 'no-preference', options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=emulation.d.ts.map