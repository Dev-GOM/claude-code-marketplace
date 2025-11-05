/**
 * Scroll actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, checkErrors, RuntimeEvaluateResult } from './helpers';
import { logger } from '../../utils/logger';

/**
 * Scroll page or element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Note: x and y are both optional - you can scroll on just one axis if needed.
 */
export async function scroll(
  browser: ChromeBrowser,
  options?: { x?: number; y?: number; selector?: string } & ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);
  const x = options?.x ?? 0;
  const y = options?.y ?? 0;
  const selector = options?.selector;

  if (opts.verbose) logger.info(`📜 Scrolling to (${x}, ${y})${selector ? ` on ${selector}` : ''}`);

  const script = selector
    ? `
      (function() {
        const selector = ${JSON.stringify(selector)};
        const x = ${JSON.stringify(x)};
        const y = ${JSON.stringify(y)};
        ${getFindElementScript()}
        const el = findElement(selector);
        if (!el) throw new Error('Element not found: ' + selector);
        el.scrollTo(x, y);
        return { x: el.scrollLeft, y: el.scrollTop };
      })()
    `
    : `
      (function() {
        const x = ${JSON.stringify(x)};
        const y = ${JSON.stringify(y)};
        window.scrollTo(x, y);
        return { x: window.scrollX, y: window.scrollY };
      })()
    `;

  try {
    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (opts.verbose) logger.info(`✅ Scrolled successfully`);
    checkErrors(browser, opts.logLevel);

    return {
      success: true,
      position: result.result?.value
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (opts.verbose) {
      logger.error(`❌ Scroll failed`);
      logger.error(`   Error: ${errorMessage}`);
    }
    checkErrors(browser, opts.logLevel);
    throw error;
  }
}
