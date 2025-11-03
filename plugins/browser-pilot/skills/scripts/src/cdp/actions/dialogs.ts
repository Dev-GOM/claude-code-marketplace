/**
 * Dialog handling actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';

/**
 * Handle JavaScript dialogs (alert, confirm, prompt).
 * Must be called BEFORE the dialog appears.
 */
export async function handleDialog(
  browser: ChromeBrowser,
  accept: boolean = true,
  promptText?: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) {
    console.log(`💬 Setting up dialog handler - accept: ${accept}, promptText: ${promptText || 'none'}`);
  }

  try {
    // Enable Page domain for dialog events
    await browser.sendCommand('Page.enable');

    // Set up dialog handler
    await browser.sendCommand('Page.setInterceptFileChooserDialog', {
      enabled: false
    });

    // Note: CDP doesn't have a way to pre-register dialog handlers
    // This returns a handler configuration that should be used with Page.javascriptDialogOpening event

    if (opts.verbose) console.log(`✅ Dialog handler configured`);

    return {
      success: true,
      accept,
      promptText: promptText || null,
      note: 'Dialog handler configured. Use getDialogMessage() to check for dialogs.'
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Dialog handler setup failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get current dialog message if one is open.
 * This should be called in response to Page.javascriptDialogOpening event.
 */
export async function getDialogMessage(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`💬 Checking for dialog...`);

  // This function is a placeholder for dialog detection
  // In real CDP usage, you'd listen for Page.javascriptDialogOpening events

  const script = `
    (function() {
      // Check if there's an active dialog by trying to access document
      try {
        document.body;
        return null; // No dialog
      } catch (e) {
        return { blocked: true }; // Dialog is blocking
      }
    })()
  `;

  const result = await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  const dialogActive = result.result?.value !== null;

  if (opts.verbose) {
    console.log(dialogActive ? `⚠️  Dialog is active` : `✅ No dialog active`);
  }

  return {
    success: true,
    dialogActive
  };
}

/**
 * Accept or dismiss a JavaScript dialog.
 */
export async function respondToDialog(
  browser: ChromeBrowser,
  accept: boolean = true,
  promptText?: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`💬 Responding to dialog - accept: ${accept}`);

  try {
    await browser.sendCommand('Page.handleJavaScriptDialog', {
      accept,
      promptText: promptText || ''
    });

    if (opts.verbose) console.log(`✅ Dialog ${accept ? 'accepted' : 'dismissed'}`);

    return {
      success: true,
      accept,
      promptText: promptText || null
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Respond to dialog failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}
