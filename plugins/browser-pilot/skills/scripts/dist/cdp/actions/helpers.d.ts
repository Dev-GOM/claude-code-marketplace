/**
 * Helper functions for Browser Pilot actions.
 */
import { ChromeBrowser } from '../browser';
interface ActionResult {
    success: boolean;
    [key: string]: any;
}
export type { ActionResult };
/**
 * Action options interface
 */
export interface ActionOptions {
    verbose?: boolean;
}
/**
 * Default action options
 */
export declare const DEFAULT_OPTIONS: ActionOptions;
/**
 * Helper: Merge user options with defaults
 */
export declare function mergeOptions(options?: ActionOptions): Required<ActionOptions>;
/**
 * Helper: Sleep for specified milliseconds.
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Helper: Check browser console for errors and warnings after an action.
 */
export declare function checkConsoleErrors(browser: ChromeBrowser): void;
/**
 * Helper: Ensure output path (convert relative to .browser-pilot/).
 * Security: Prevents path traversal attacks and rejects absolute paths.
 */
export declare function ensureOutputPath(path: string): string;
//# sourceMappingURL=helpers.d.ts.map