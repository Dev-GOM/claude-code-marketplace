/**
 * Wait actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, sleep, checkConsoleErrors } from './helpers';

/**
 * Wait for specified milliseconds.
 */
export async function waitMilliseconds(
  browser: ChromeBrowser,
  ms: number,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`⏳ Waiting for ${ms}ms...`);

  await sleep(ms);

  if (opts.verbose) console.log(`✅ Wait complete`);

  return { success: true, waitedMs: ms };
}

/**
 * Wait for element to appear.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function waitFor(
  browser: ChromeBrowser,
  selector: string,
  timeout = 30000,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`⏳ Waiting for: ${selector}`);

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const script = `(function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      return findElement(selector) !== null;
    })()`;
    const result = await browser.sendCommand('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (result.result?.value) {
      if (opts.verbose) console.log(`✅ Element appeared: ${selector}`);
      checkConsoleErrors(browser);
      return { success: true, selector };
    }

    await sleep(100);
  }

  if (opts.verbose) console.log(`❌ Timeout waiting for: ${selector}`);
  throw new Error(`Timeout waiting for: ${selector}`);
}

/**
 * Wait for network to be idle.
 */
export async function waitForNetworkIdle(
  browser: ChromeBrowser,
  timeout = 5000,
  maxInflight = 0,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`⏳ Waiting for network idle (timeout: ${timeout}ms)...`);

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

    if (opts.verbose) console.log(`✅ Network idle`);

    return { success: true, state: 'network_idle' };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Network idle wait failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}
