"use strict";
/**
 * Wait actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitMilliseconds = waitMilliseconds;
exports.waitFor = waitFor;
exports.waitForNetworkIdle = waitForNetworkIdle;
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
/**
 * Wait for specified milliseconds.
 */
async function waitMilliseconds(browser, ms, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`⏳ Waiting for ${ms}ms...`);
    await (0, helpers_1.sleep)(ms);
    if (opts.verbose)
        console.log(`✅ Wait complete`);
    return { success: true, waitedMs: ms };
}
/**
 * Wait for element to appear.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function waitFor(browser, selector, timeout = 30000, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`⏳ Waiting for: ${selector}`);
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const script = `(function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      return findElement(selector) !== null;
    })()`;
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });
        if (result.result?.value) {
            if (opts.verbose)
                console.log(`✅ Element appeared: ${selector}`);
            (0, helpers_1.checkConsoleErrors)(browser);
            return { success: true, selector };
        }
        await (0, helpers_1.sleep)(100);
    }
    if (opts.verbose)
        console.log(`❌ Timeout waiting for: ${selector}`);
    throw new Error(`Timeout waiting for: ${selector}`);
}
/**
 * Wait for network to be idle.
 */
async function waitForNetworkIdle(browser, timeout = 5000, maxInflight = 0, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`⏳ Waiting for network idle (timeout: ${timeout}ms)...`);
    await browser.sendCommand('Network.enable');
    const script = `
    new Promise((resolve) => {
      const waitForNavigationComplete = () => {
        if (performance.timing.loadEventEnd > 0) {
          setTimeout(() => resolve(true), ${timeout});
        } else {
          setTimeout(waitForNavigationComplete, 100);
        }
      };
      waitForNavigationComplete();
    })
  `;
    try {
        await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            awaitPromise: true,
            returnByValue: true
        });
        if (opts.verbose)
            console.log(`✅ Network idle`);
        return { success: true, state: 'network_idle' };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Network idle wait failed`);
            console.error(`   Error: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=wait.js.map