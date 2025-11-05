"use strict";
/**
 * Wait actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitMilliseconds = waitMilliseconds;
exports.waitFor = waitFor;
exports.waitForNetworkIdle = waitForNetworkIdle;
exports.waitForDomStable = waitForDomStable;
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
const constants_1 = require("../../constants");
/**
 * Wait for specified milliseconds.
 */
async function waitMilliseconds(browser, ms, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`⏳ Waiting for ${ms}ms...`);
    await (0, helpers_1.sleep)(ms);
    if (opts.verbose)
        logger_1.logger.info(`✅ Wait complete`);
    return { success: true, waitedMs: ms };
}
/**
 * Wait for element to appear.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function waitFor(browser, selector, timeout = constants_1.TIMING.WAIT_FOR_NAVIGATION, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`⏳ Waiting for: ${selector}`);
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
                logger_1.logger.info(`✅ Element appeared: ${selector}`);
            (0, helpers_1.checkErrors)(browser, opts.logLevel);
            return { success: true, selector };
        }
        await (0, helpers_1.sleep)(constants_1.TIMING.POLLING_INTERVAL_FAST);
    }
    if (opts.verbose)
        logger_1.logger.info(`❌ Timeout waiting for: ${selector}`);
    throw new Error(`Timeout waiting for: ${selector}`);
}
/**
 * Wait for network to be idle.
 */
async function waitForNetworkIdle(browser, timeout = constants_1.TIMING.WAIT_FOR_ELEMENT, _maxInflight = 0, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`⏳ Waiting for network idle (timeout: ${timeout}ms)...`);
    await browser.sendCommand('Network.enable');
    const script = `
    new Promise((resolve) => {
      const waitForNavigationComplete = () => {
        if (performance.timing.loadEventEnd > 0) {
          setTimeout(() => resolve(true), ${timeout});
        } else {
          setTimeout(waitForNavigationComplete, ${constants_1.TIMING.POLLING_INTERVAL_FAST});
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
            logger_1.logger.info(`✅ Network idle`);
        return { success: true, state: 'network_idle' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (opts.verbose) {
            logger_1.logger.error(`❌ Network idle wait failed`);
            logger_1.logger.error(`   Error: ${errorMessage}`);
        }
        throw error;
    }
}
/**
 * Wait for DOM to stabilize (no mutations for specified time).
 * Uses MutationObserver to detect when DOM changes stop.
 */
async function waitForDomStable(browser, stableTime = constants_1.TIMING.NETWORK_IDLE_TIMEOUT, timeout = constants_1.CDP.EVALUATION_TIMEOUT, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`⏳ Waiting for DOM to stabilize (stable: ${stableTime}ms, timeout: ${timeout}ms)...`);
    const script = `
    new Promise((resolve, reject) => {
      const stableTime = ${stableTime};
      const timeout = ${timeout};
      let lastMutationTime = Date.now();
      let stabilityTimer = null;
      let timeoutTimer = null;

      // Timeout handler
      timeoutTimer = setTimeout(() => {
        observer.disconnect();
        resolve({ stable: false, reason: 'timeout' });
      }, timeout);

      // Check if stable
      const checkStability = () => {
        const timeSinceLastMutation = Date.now() - lastMutationTime;
        if (timeSinceLastMutation >= stableTime) {
          clearTimeout(timeoutTimer);
          observer.disconnect();
          resolve({ stable: true, waitedMs: Date.now() - startTime });
        }
      };

      const startTime = Date.now();

      // MutationObserver to detect DOM changes
      const observer = new MutationObserver((mutations) => {
        // Filter out trivial mutations (like class changes on same element)
        const significantMutations = mutations.filter(m => {
          // Ignore attribute changes unless they're critical
          if (m.type === 'attributes' && !['style', 'class'].includes(m.attributeName)) {
            return false;
          }
          // Count childList and subtree changes as significant
          return m.type === 'childList' || m.addedNodes.length > 0 || m.removedNodes.length > 0;
        });

        if (significantMutations.length > 0) {
          lastMutationTime = Date.now();

          // Reset stability timer
          if (stabilityTimer) clearTimeout(stabilityTimer);
          stabilityTimer = setTimeout(checkStability, stableTime);
        }
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });

      // Initial stability check (in case DOM is already stable)
      stabilityTimer = setTimeout(checkStability, stableTime);
    })
  `;
    try {
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            awaitPromise: true,
            returnByValue: true
        });
        const data = result.result?.value;
        if (data.stable) {
            if (opts.verbose)
                logger_1.logger.info(`✅ DOM stabilized (waited: ${data.waitedMs}ms)`);
            return { success: true, stable: true, waitedMs: data.waitedMs };
        }
        else {
            if (opts.verbose)
                logger_1.logger.warn(`⚠️  DOM stabilization timeout (reason: ${data.reason})`);
            return { success: true, stable: false, reason: data.reason };
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (opts.verbose) {
            logger_1.logger.error(`❌ DOM stability wait failed`);
            logger_1.logger.error(`   Error: ${errorMessage}`);
        }
        throw error;
    }
}
//# sourceMappingURL=wait.js.map