"use strict";
/**
 * Navigation actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigate = navigate;
exports.waitForLoad = waitForLoad;
exports.reload = reload;
exports.goBack = goBack;
exports.goForward = goForward;
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
const constants_1 = require("../../constants");
/**
 * Navigate to URL.
 */
async function navigate(browser, url, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🧭 Navigating to: ${url}`);
    try {
        await browser.sendCommand('Page.navigate', { url });
        await (0, helpers_1.sleep)(constants_1.TIMING.ACTION_DELAY_NAVIGATION); // Wait for initial page load
        if (opts.verbose)
            logger_1.logger.info(`✓ Page loaded: ${url}`);
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        return { success: true, url };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Navigation failed: ${url}`);
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
 * Wait for page load complete.
 */
async function waitForLoad(browser, timeout = 30000, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`⏳ Waiting for page load (timeout: ${timeout}ms)...`);
    const script = `
    new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else if (Date.now() - startTime > ${timeout}) {
          reject(new Error('Timeout waiting for page load'));
        } else {
          setTimeout(checkReady, ${constants_1.TIMING.POLLING_INTERVAL_FAST});
        }
      };
      checkReady();
    })
  `;
    try {
        await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            awaitPromise: true,
            returnByValue: true
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ Page load complete`);
        return { success: true, state: 'complete' };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Page load failed`);
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
 * Reload page.
 */
async function reload(browser, hard = false, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🔄 Reloading page (hard: ${hard})...`);
    try {
        await browser.sendCommand('Page.reload', { ignoreCache: hard });
        if (opts.verbose)
            logger_1.logger.info(`✅ Page reloaded`);
        return { success: true, hardReload: hard };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Reload failed`);
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
 * Navigate back in history.
 */
async function goBack(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`◀️  Navigating back...`);
    try {
        const history = await browser.sendCommand('Page.getNavigationHistory');
        const currentIndex = history.currentIndex || 0;
        if (currentIndex > 0) {
            const previousEntry = history.entries[currentIndex - 1];
            await browser.sendCommand('Page.navigateToHistoryEntry', {
                entryId: previousEntry.id
            });
            if (opts.verbose)
                logger_1.logger.info(`✅ Navigated back to: ${previousEntry.url}`);
            return { success: true, url: previousEntry.url };
        }
        if (opts.verbose)
            logger_1.logger.info(`⚠️  No previous page in history`);
        return { success: false, error: 'No previous page in history' };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Go back failed`);
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
 * Navigate forward in history.
 */
async function goForward(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`▶️  Navigating forward...`);
    try {
        const history = await browser.sendCommand('Page.getNavigationHistory');
        const currentIndex = history.currentIndex || 0;
        const totalEntries = history.entries?.length || 0;
        if (currentIndex < totalEntries - 1) {
            const nextEntry = history.entries[currentIndex + 1];
            await browser.sendCommand('Page.navigateToHistoryEntry', {
                entryId: nextEntry.id
            });
            if (opts.verbose)
                logger_1.logger.info(`✅ Navigated forward to: ${nextEntry.url}`);
            return { success: true, url: nextEntry.url };
        }
        if (opts.verbose)
            logger_1.logger.info(`⚠️  No next page in history`);
        return { success: false, error: 'No next page in history' };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Go forward failed`);
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
//# sourceMappingURL=navigation.js.map