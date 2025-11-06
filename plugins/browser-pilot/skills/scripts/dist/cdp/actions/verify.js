"use strict";
/**
 * Verification utilities for browser actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementExists = elementExists;
exports.waitForDOMChange = waitForDOMChange;
exports.checkNavigation = checkNavigation;
exports.verifyAction = verifyAction;
exports.verifyElementInteractive = verifyElementInteractive;
const constants_1 = require("../../constants");
// Timing constants for verification operations
const TIMING = {
    DEFAULT_VERIFY_TIMEOUT: constants_1.TIMING.ACTION_DELAY_NAVIGATION,
    DOM_CHANGE_CHECK_DELAY: constants_1.TIMING.NETWORK_IDLE_TIMEOUT,
    NAVIGATION_CHECK_DELAY: constants_1.TIMING.NETWORK_IDLE_TIMEOUT,
    MIN_DOM_CHANGE_THRESHOLD: 10, // Minimum change in DOM size to consider significant
};
/**
 * Check if an element exists in the DOM
 */
async function elementExists(browser, selector) {
    try {
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: `
        (function() {
          const selector = ${JSON.stringify(selector)};
          let element = null;

          // Try XPath first
          if (selector.startsWith('//')) {
            const xpathResult = document.evaluate(
              selector,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            );
            element = xpathResult.singleNodeValue;
          }
          // Try CSS selector
          else {
            element = document.querySelector(selector);
          }

          return element !== null;
        })()
      `,
            returnByValue: true
        });
        return result?.result?.value === true;
    }
    catch (_error) {
        return false;
    }
}
/**
 * Wait for DOM changes (using MutationObserver simulation)
 */
async function waitForDOMChange(browser, timeout = TIMING.DEFAULT_VERIFY_TIMEOUT) {
    try {
        // Get initial DOM snapshot
        const initialSnapshot = await browser.sendCommand('Runtime.evaluate', {
            expression: 'document.body.innerHTML.length',
            returnByValue: true
        });
        const initialLength = initialSnapshot?.result?.value || 0;
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, Math.min(timeout, TIMING.DOM_CHANGE_CHECK_DELAY)));
        // Get new DOM snapshot
        const finalSnapshot = await browser.sendCommand('Runtime.evaluate', {
            expression: 'document.body.innerHTML.length',
            returnByValue: true
        });
        const finalLength = finalSnapshot?.result?.value || 0;
        // Check if DOM changed significantly
        return Math.abs(finalLength - initialLength) > TIMING.MIN_DOM_CHANGE_THRESHOLD;
    }
    catch (_error) {
        return false;
    }
}
/**
 * Check for page navigation
 */
async function checkNavigation(browser, initialURL, timeout = TIMING.DEFAULT_VERIFY_TIMEOUT) {
    try {
        // Wait a bit for navigation to complete
        await new Promise(resolve => setTimeout(resolve, Math.min(timeout, TIMING.NAVIGATION_CHECK_DELAY)));
        // Get current URL
        const urlResult = await browser.sendCommand('Target.getTargetInfo', {
            targetId: browser.targetId
        });
        const currentURL = urlResult.targetInfo.url;
        return currentURL !== initialURL;
    }
    catch (_error) {
        return false;
    }
}
/**
 * Verify that an action was successful
 */
async function verifyAction(browser, options = {}) {
    const { checkDOMChange = true, checkNavigation: shouldCheckNavigation = true, timeout = TIMING.DEFAULT_VERIFY_TIMEOUT } = options;
    const result = {
        success: false
    };
    try {
        // Get initial URL
        let initialURL = '';
        if (shouldCheckNavigation) {
            const urlResult = await browser.sendCommand('Target.getTargetInfo', {
                targetId: browser.targetId
            });
            initialURL = urlResult.targetInfo.url;
        }
        // Check for DOM changes
        if (checkDOMChange) {
            result.domChanged = await waitForDOMChange(browser, timeout);
        }
        // Check for navigation
        if (shouldCheckNavigation) {
            result.navigated = await checkNavigation(browser, initialURL, timeout);
        }
        // Success if either DOM changed or navigation occurred
        result.success = !!(result.domChanged || result.navigated);
        if (!result.success) {
            result.reason = 'No DOM changes or navigation detected';
        }
        return result;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            reason: `Verification failed: ${errorMessage}`
        };
    }
}
/**
 * Verify element interactivity before action
 */
async function verifyElementInteractive(browser, selector) {
    try {
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: `
        (function() {
          const selector = ${JSON.stringify(selector)};
          let element = null;

          // Try XPath first
          if (selector.startsWith('//')) {
            const xpathResult = document.evaluate(
              selector,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            );
            element = xpathResult.singleNodeValue;
          }
          // Try CSS selector
          else {
            element = document.querySelector(selector);
          }

          if (!element) {
            return { interactive: false, reason: 'Element not found' };
          }

          // Check visibility
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return { interactive: false, reason: 'Element not visible' };
          }

          // Check if disabled
          if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
            return { interactive: false, reason: 'Element is disabled' };
          }

          // Check if element is in viewport
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            return { interactive: false, reason: 'Element has no size' };
          }

          return { interactive: true };
        })()
      `,
            returnByValue: true
        });
        const value = result?.result?.value;
        if (value && typeof value === 'object') {
            return value;
        }
        return { interactive: false, reason: 'Verification failed' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { interactive: false, reason: errorMessage };
    }
}
//# sourceMappingURL=verify.js.map