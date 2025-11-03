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
/**
 * Navigate to URL.
 */
async function navigate(browser, url, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`🧭 Navigating to: ${url}`);
    try {
        await browser.sendCommand('Page.navigate', { url });
        await (0, helpers_1.sleep)(1000); // Wait for initial page load
        if (opts.verbose)
            console.log(`✓ Page loaded: ${url}`);
        (0, helpers_1.checkConsoleErrors)(browser);
        return { success: true, url };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Navigation failed: ${url}`);
            console.error(`   Error: ${error.message}`);
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
        console.log(`⏳ Waiting for page load (timeout: ${timeout}ms)...`);
    const script = `
    new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else if (Date.now() - startTime > ${timeout}) {
          reject(new Error('Timeout waiting for page load'));
        } else {
          setTimeout(checkReady, 100);
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
            console.log(`✅ Page load complete`);
        return { success: true, state: 'complete' };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Page load failed`);
            console.error(`   Error: ${error.message}`);
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
        console.log(`🔄 Reloading page (hard: ${hard})...`);
    try {
        await browser.sendCommand('Page.reload', { ignoreCache: hard });
        if (opts.verbose)
            console.log(`✅ Page reloaded`);
        return { success: true, hardReload: hard };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Reload failed`);
            console.error(`   Error: ${error.message}`);
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
        console.log(`◀️  Navigating back...`);
    try {
        const history = await browser.sendCommand('Page.getNavigationHistory');
        const currentIndex = history.currentIndex || 0;
        if (currentIndex > 0) {
            const previousEntry = history.entries[currentIndex - 1];
            await browser.sendCommand('Page.navigateToHistoryEntry', {
                entryId: previousEntry.id
            });
            if (opts.verbose)
                console.log(`✅ Navigated back to: ${previousEntry.url}`);
            return { success: true, url: previousEntry.url };
        }
        if (opts.verbose)
            console.log(`⚠️  No previous page in history`);
        return { success: false, error: 'No previous page in history' };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Go back failed`);
            console.error(`   Error: ${error.message}`);
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
        console.log(`▶️  Navigating forward...`);
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
                console.log(`✅ Navigated forward to: ${nextEntry.url}`);
            return { success: true, url: nextEntry.url };
        }
        if (opts.verbose)
            console.log(`⚠️  No next page in history`);
        return { success: false, error: 'No next page in history' };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Go forward failed`);
            console.error(`   Error: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=navigation.js.map