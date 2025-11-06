"use strict";
/**
 * Dialog handling actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDialog = handleDialog;
exports.getDialogMessage = getDialogMessage;
exports.respondToDialog = respondToDialog;
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
/**
 * Handle JavaScript dialogs (alert, confirm, prompt).
 * Must be called BEFORE the dialog appears.
 */
async function handleDialog(browser, accept = true, promptText, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose) {
        logger_1.logger.info(`💬 Setting up dialog handler - accept: ${accept}, promptText: ${promptText || 'none'}`);
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
        if (opts.verbose)
            logger_1.logger.info(`✅ Dialog handler configured`);
        return {
            success: true,
            accept,
            promptText: promptText || null,
            note: 'Dialog handler configured. Use getDialogMessage() to check for dialogs.'
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Dialog handler setup failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
            }
        }
        throw error;
    }
}
/**
 * Get current dialog message if one is open.
 * This should be called in response to Page.javascriptDialogOpening event.
 */
async function getDialogMessage(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`💬 Checking for dialog...`);
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
        logger_1.logger.info(dialogActive ? `⚠️  Dialog is active` : `✅ No dialog active`);
    }
    return {
        success: true,
        dialogActive
    };
}
/**
 * Accept or dismiss a JavaScript dialog.
 */
async function respondToDialog(browser, accept = true, promptText, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`💬 Responding to dialog - accept: ${accept}`);
    try {
        await browser.sendCommand('Page.handleJavaScriptDialog', {
            accept,
            promptText: promptText || ''
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ Dialog ${accept ? 'accepted' : 'dismissed'}`);
        return {
            success: true,
            accept,
            promptText: promptText || null
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Respond to dialog failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
            }
        }
        throw error;
    }
}
//# sourceMappingURL=dialogs.js.map