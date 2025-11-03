/**
 * Scroll actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, checkConsoleErrors } from './helpers';

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

  if (opts.verbose) console.log(`📜 Scrolling to (${x}, ${y})${selector ? ` on ${selector}` : ''}`);

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
    const result = await browser.sendCommand('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (opts.verbose) console.log(`✅ Scrolled successfully`);
    checkConsoleErrors(browser);

    return {
      success: true,
      position: result.result?.value
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Scroll failed`);
      console.error(`   Error: ${error.message}`);
    }
    checkConsoleErrors(browser);
    throw error;
  }
}
