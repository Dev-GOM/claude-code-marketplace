/**
 * Wait actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, sleep, checkErrors, RuntimeEvaluateResult } from './helpers';
import { logger } from '../../utils/logger';
import { TIMING, CDP } from '../../constants';

/**
 * Wait for specified milliseconds.
 */
export async function waitMilliseconds(
  browser: ChromeBrowser,
  ms: number,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`⏳ Waiting for ${ms}ms...`);

  await sleep(ms);

  if (opts.verbose) logger.info(`✅ Wait complete`);

  return { success: true, waitedMs: ms };
}

/**
 * Wait for element to appear.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function waitFor(
  browser: ChromeBrowser,
  selector: string,
  timeout = TIMING.WAIT_FOR_NAVIGATION,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`⏳ Waiting for: ${selector}`);

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const script = `(function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      return findElement(selector) !== null;
    })()`;
    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (result.result?.value) {
      if (opts.verbose) logger.info(`✅ Element appeared: ${selector}`);
      checkErrors(browser, opts.logLevel);
      return { success: true, selector };
    }

    await sleep(TIMING.POLLING_INTERVAL_FAST);
  }

  if (opts.verbose) logger.info(`❌ Timeout waiting for: ${selector}`);
  throw new Error(`Timeout waiting for: ${selector}`);
}

/**
 * Wait for network to be idle.
 */
export async function waitForNetworkIdle(
  browser: ChromeBrowser,
  timeout: number = TIMING.WAIT_FOR_ELEMENT,
  _maxInflight = 0,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`⏳ Waiting for network idle (timeout: ${timeout}ms)...`);

  await browser.sendCommand('Network.enable');

  const script = `
    new Promise((resolve) => {
      const waitForNavigationComplete = () => {
        if (performance.timing.loadEventEnd > 0) {
          setTimeout(() => resolve(true), ${timeout});
        } else {
          setTimeout(waitForNavigationComplete, ${TIMING.POLLING_INTERVAL_FAST});
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

    if (opts.verbose) logger.info(`✅ Network idle`);

    return { success: true, state: 'network_idle' };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (opts.verbose) {
      logger.error(`❌ Network idle wait failed`);
      logger.error(`   Error: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Wait for DOM to stabilize (no mutations for specified time).
 * Uses MutationObserver to detect when DOM changes stop.
 */
export async function waitForDomStable(
  browser: ChromeBrowser,
  stableTime: number = TIMING.NETWORK_IDLE_TIMEOUT,
  timeout: number = CDP.EVALUATION_TIMEOUT,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`⏳ Waiting for DOM to stabilize (stable: ${stableTime}ms, timeout: ${timeout}ms)...`);

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
    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      awaitPromise: true,
      returnByValue: true
    });

    const data = result.result?.value as { stable: boolean; waitedMs?: number; reason?: string };

    if (data.stable) {
      if (opts.verbose) logger.info(`✅ DOM stabilized (waited: ${data.waitedMs}ms)`);
      return { success: true, stable: true, waitedMs: data.waitedMs };
    } else {
      if (opts.verbose) logger.warn(`⚠️  DOM stabilization timeout (reason: ${data.reason})`);
      return { success: true, stable: false, reason: data.reason };
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (opts.verbose) {
      logger.error(`❌ DOM stability wait failed`);
      logger.error(`   Error: ${errorMessage}`);
    }
    throw error;
  }
}
