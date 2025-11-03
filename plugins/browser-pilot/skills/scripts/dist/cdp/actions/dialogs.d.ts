/**
 * Dialog handling actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Handle JavaScript dialogs (alert, confirm, prompt).
 * Must be called BEFORE the dialog appears.
 */
export declare function handleDialog(browser: ChromeBrowser, accept?: boolean, promptText?: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Get current dialog message if one is open.
 * This should be called in response to Page.javascriptDialogOpening event.
 */
export declare function getDialogMessage(browser: ChromeBrowser, options?: ActionOptions): Promise<ActionResult>;
/**
 * Accept or dismiss a JavaScript dialog.
 */
export declare function respondToDialog(browser: ChromeBrowser, accept?: boolean, promptText?: string, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=dialogs.d.ts.map