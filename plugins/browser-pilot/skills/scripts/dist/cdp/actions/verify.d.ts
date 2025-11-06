/**
 * Verification utilities for browser actions
 */
import { ChromeBrowser } from '../browser';
export interface VerifyOptions {
    checkDOMChange?: boolean;
    checkNavigation?: boolean;
    timeout?: number;
}
export interface VerificationResult {
    success: boolean;
    reason?: string;
    domChanged?: boolean;
    navigated?: boolean;
}
/**
 * Check if an element exists in the DOM
 */
export declare function elementExists(browser: ChromeBrowser, selector: string): Promise<boolean>;
/**
 * Wait for DOM changes (using MutationObserver simulation)
 */
export declare function waitForDOMChange(browser: ChromeBrowser, timeout?: number): Promise<boolean>;
/**
 * Check for page navigation
 */
export declare function checkNavigation(browser: ChromeBrowser, initialURL: string, timeout?: number): Promise<boolean>;
/**
 * Verify that an action was successful
 */
export declare function verifyAction(browser: ChromeBrowser, options?: VerifyOptions): Promise<VerificationResult>;
/**
 * Verify element interactivity before action
 */
export declare function verifyElementInteractive(browser: ChromeBrowser, selector: string): Promise<{
    interactive: boolean;
    reason?: string;
}>;
//# sourceMappingURL=verify.d.ts.map