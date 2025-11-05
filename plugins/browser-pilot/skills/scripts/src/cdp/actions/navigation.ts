/**
 * Navigation actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions, sleep, checkErrors } from './helpers';
import { logger } from '../../utils/logger';
import { TIMING } from '../../constants';

/**
 * Navigate to URL.
 */
export async function navigate(
  browser: ChromeBrowser,
  url: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`🧭 Navigating to: ${url}`);

  try {
    await browser.sendCommand('Page.navigate', { url });
    await sleep(TIMING.ACTION_DELAY_NAVIGATION); // Wait for initial page load

    if (opts.verbose) logger.info(`✓ Page loaded: ${url}`);
    checkErrors(browser, opts.logLevel);

    return { success: true, url };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Navigation failed: ${url}`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    throw error;
  }
}

/**
 * Wait for page load complete.
 */
export async function waitForLoad(
  browser: ChromeBrowser,
  timeout = 30000,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`⏳ Waiting for page load (timeout: ${timeout}ms)...`);

  const script = `
    new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else if (Date.now() - startTime > ${timeout}) {
          reject(new Error('Timeout waiting for page load'));
        } else {
          setTimeout(checkReady, ${TIMING.POLLING_INTERVAL_FAST});
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

    if (opts.verbose) logger.info(`✅ Page load complete`);

    return { success: true, state: 'complete' };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Page load failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    throw error;
  }
}

/**
 * Reload page.
 */
export async function reload(
  browser: ChromeBrowser,
  hard = false,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`🔄 Reloading page (hard: ${hard})...`);

  try {
    await browser.sendCommand('Page.reload', { ignoreCache: hard });

    if (opts.verbose) logger.info(`✅ Page reloaded`);

    return { success: true, hardReload: hard };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Reload failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    throw error;
  }
}

/**
 * Navigate back in history.
 */
export async function goBack(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`◀️  Navigating back...`);

  try {
    const history = await browser.sendCommand<{
      currentIndex: number;
      entries: Array<{ id: number; url: string; title: string }>;
    }>('Page.getNavigationHistory');
    const currentIndex = history.currentIndex || 0;

    if (currentIndex > 0) {
      const previousEntry = history.entries[currentIndex - 1];
      await browser.sendCommand('Page.navigateToHistoryEntry', {
        entryId: previousEntry.id
      });

      if (opts.verbose) logger.info(`✅ Navigated back to: ${previousEntry.url}`);

      return { success: true, url: previousEntry.url };
    }

    if (opts.verbose) logger.info(`⚠️  No previous page in history`);
    return { success: false, error: 'No previous page in history' };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Go back failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    throw error;
  }
}

/**
 * Navigate forward in history.
 */
export async function goForward(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`▶️  Navigating forward...`);

  try {
    const history = await browser.sendCommand<{
      currentIndex: number;
      entries: Array<{ id: number; url: string; title: string }>;
    }>('Page.getNavigationHistory');
    const currentIndex = history.currentIndex || 0;
    const totalEntries = history.entries?.length || 0;

    if (currentIndex < totalEntries - 1) {
      const nextEntry = history.entries[currentIndex + 1];
      await browser.sendCommand('Page.navigateToHistoryEntry', {
        entryId: nextEntry.id
      });

      if (opts.verbose) logger.info(`✅ Navigated forward to: ${nextEntry.url}`);

      return { success: true, url: nextEntry.url };
    }

    if (opts.verbose) logger.info(`⚠️  No next page in history`);
    return { success: false, error: 'No next page in history' };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Go forward failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    throw error;
  }
}
