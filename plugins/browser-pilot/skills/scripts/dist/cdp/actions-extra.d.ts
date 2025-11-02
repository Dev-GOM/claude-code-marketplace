/**
 * Additional CDP actions - extraction, selection, input, files, page control, navigation, debugging
 */
import { ChromeBrowser } from './browser';
export interface ActionResult {
    success: boolean;
    [key: string]: any;
}
/**
 * Extract data using multiple selectors.
 */
export declare function extractData(browser: ChromeBrowser, selectors: Record<string, string>): Promise<ActionResult>;
/**
 * Select option from dropdown.
 */
export declare function selectOption(browser: ChromeBrowser, selector: string, value: string): Promise<ActionResult>;
/**
 * Check checkbox.
 */
export declare function check(browser: ChromeBrowser, selector: string): Promise<ActionResult>;
/**
 * Uncheck checkbox.
 */
export declare function uncheck(browser: ChromeBrowser, selector: string): Promise<ActionResult>;
/**
 * Press keyboard key.
 */
export declare function pressKey(browser: ChromeBrowser, key: string): Promise<ActionResult>;
/**
 * Type text character by character.
 */
export declare function typeText(browser: ChromeBrowser, text: string, delay?: number): Promise<ActionResult>;
/**
 * Upload file to input element.
 */
export declare function uploadFile(browser: ChromeBrowser, selector: string, filePath: string): Promise<ActionResult>;
/**
 * Reload page.
 */
export declare function reload(browser: ChromeBrowser, hard?: boolean): Promise<ActionResult>;
/**
 * Navigate back in history.
 */
export declare function goBack(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Navigate forward in history.
 */
export declare function goForward(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Wait for specified milliseconds.
 */
export declare function waitMilliseconds(browser: ChromeBrowser, ms: number): Promise<ActionResult>;
/**
 * Wait for element to appear.
 */
export declare function waitFor(browser: ChromeBrowser, selector: string, timeout?: number): Promise<ActionResult>;
/**
 * Wait for network to be idle.
 */
export declare function waitForNetworkIdle(browser: ChromeBrowser, timeout?: number, maxInflight?: number): Promise<ActionResult>;
/**
 * Get console messages.
 *
 * Returns console messages that have been collected since the browser connected.
 * Messages are automatically collected when Log domain is enabled during connection.
 */
export declare function getConsoleMessages(browser: ChromeBrowser, errorOnly?: boolean): Promise<ActionResult>;
/**
 * Get element property value.
 */
export declare function getElementProperty(browser: ChromeBrowser, selector: string, propertyName: string): Promise<ActionResult>;
/**
 * Find element and return its information.
 */
export declare function findElement(browser: ChromeBrowser, selector: string): Promise<ActionResult>;
/**
 * Get accessibility tree snapshot.
 */
export declare function getAccessibilitySnapshot(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Get page HTML content.
 */
export declare function getContent(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Scroll page or element.
 */
export declare function scroll(browser: ChromeBrowser, x?: number, y?: number, selector?: string): Promise<ActionResult>;
/**
 * Drag and drop from one element to another.
 */
export declare function dragAndDrop(browser: ChromeBrowser, sourceSelector: string, targetSelector: string): Promise<ActionResult>;
/**
 * Emulate media type or color scheme.
 */
export declare function emulateMedia(browser: ChromeBrowser, mediaType?: 'screen' | 'print', colorScheme?: 'light' | 'dark' | 'no-preference'): Promise<ActionResult>;
/**
 * Handle JavaScript dialogs (alert, confirm, prompt).
 * Must be called BEFORE the dialog appears.
 */
export declare function handleDialog(browser: ChromeBrowser, accept?: boolean, promptText?: string): Promise<ActionResult>;
/**
 * Get current dialog message if one is open.
 * This should be called in response to Page.javascriptDialogOpening event.
 */
export declare function getDialogMessage(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Accept or dismiss a JavaScript dialog.
 */
export declare function respondToDialog(browser: ChromeBrowser, accept?: boolean, promptText?: string): Promise<ActionResult>;
/**
 * Set up network request interception.
 */
export declare function enableRequestInterception(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Disable network request interception.
 */
export declare function disableRequestInterception(browser: ChromeBrowser): Promise<ActionResult>;
/**
 * Mock a network request response.
 */
export declare function mockRequest(browser: ChromeBrowser, urlPattern: string, responseBody: string, statusCode?: number, headers?: Record<string, string>): Promise<ActionResult>;
/**
 * Block network requests matching pattern.
 */
export declare function blockRequest(browser: ChromeBrowser, urlPattern: string): Promise<ActionResult>;
/**
 * Unblock all network requests.
 */
export declare function unblockRequests(browser: ChromeBrowser): Promise<ActionResult>;
//# sourceMappingURL=actions-extra.d.ts.map