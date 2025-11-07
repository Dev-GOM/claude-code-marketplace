/**
 * Helper functions for Browser Pilot actions.
 */
import { ChromeBrowser } from '../browser';
interface ActionResult {
    success: boolean;
    [key: string]: unknown;
}
export type { ActionResult };
/**
 * CDP Runtime.evaluate response type
 */
export interface RuntimeEvaluateResult {
    result?: {
        type?: string;
        value?: unknown;
        description?: string;
    };
    exceptionDetails?: {
        exception?: {
            description?: string;
        };
        text?: string;
        timestamp?: number;
        url?: string;
        lineNumber?: number;
    };
}
/**
 * Log level for error and warning reporting
 */
export type LogLevel = 'all' | 'errors-only' | 'none';
/**
 * Constants for selector retry logic
 */
export declare const SELECTOR_RETRY_CONFIG: {
    readonly MAX_ATTEMPTS: 3;
    readonly MAP_FILENAME: "interaction-map.json";
    readonly MAP_FOLDER: ".browser-pilot";
};
/**
 * Action options interface
 */
export interface ActionOptions {
    verbose?: boolean;
    logLevel?: LogLevel;
    waitForNavigation?: boolean;
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
 * Helper: Check browser console and network for errors and warnings after an action.
 * @param browser - ChromeBrowser instance
 * @param logLevel - Log level ('all', 'errors-only', 'none')
 */
export declare function checkErrors(browser: ChromeBrowser, logLevel?: LogLevel): void;
/**
 * @deprecated Use checkErrors instead
 */
export declare function checkConsoleErrors(browser: ChromeBrowser): void;
/**
 * Helper: Wait for action completion (navigation + errors check).
 * Reduces code duplication across click, fill, and other interactive actions.
 */
export declare function waitForActionComplete(browser: ChromeBrowser, opts: Required<ActionOptions>): Promise<void>;
/**
 * Helper: Log action error with consistent formatting
 * @param context - Error context (e.g., 'Get viewport failed')
 * @param error - Error object
 * @param verbose - Whether to log the error
 */
export declare function logActionError(context: string, error: unknown, verbose: boolean): void;
/**
 * Helper: Ensure output path (convert relative to .browser-pilot/).
 * Security: Prevents path traversal attacks and rejects absolute paths.
 * Uses getOutputDir() from config to get project-specific output directory.
 */
export declare function ensureOutputPath(path: string): string;
//# sourceMappingURL=helpers.d.ts.map