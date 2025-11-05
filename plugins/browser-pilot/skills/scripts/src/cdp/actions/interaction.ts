/**
 * Interaction actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, waitForActionComplete, sleep, RuntimeEvaluateResult, SELECTOR_RETRY_CONFIG } from './helpers';
import { findSelectorWithFallback } from '../map/query-map';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../../utils/logger';
import { TIMING } from '../../constants';

/**
 * Click element core logic (without retry).
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//button[text()='Click'])[2] selects the 2nd button.
 */
async function clickCore(
  browser: ChromeBrowser,
  selector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`🔍 Finding element: ${selector}`);

  // Step 1: Find element and scroll into view
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);

      // Scroll element into view
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

      // Get bounding box and calculate center point
      const box = el.getBoundingClientRect();
      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        tag: el.tagName,
        text: el.textContent?.substring(0, 50) || '',
        visible: box.width > 0 && box.height > 0
      };
    })()
  `;

  try {
    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (!result.result || !result.result.value) {
      logger.error('❌ Element not found or error occurred');
      if (result.exceptionDetails) {
        logger.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      throw new Error(`Element not found: ${selector}`);
    }

    const { x, y, tag, text, visible } = result.result.value as { x: number; y: number; tag: string; text: string; visible: boolean };
    if (opts.verbose) {
      logger.info(`✓ Element found: <${tag.toLowerCase()}> "${text}"`);
      logger.info(`  Position: (${Math.round(x)}, ${Math.round(y)}), Visible: ${visible}`);
    }

    // Step 2: Dispatch CDP mouse events (Puppeteer way)
    if (opts.verbose) logger.info(`🖱️  Mouse down at (${Math.round(x)}, ${Math.round(y)})`);
    await browser.sendCommand('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button: 'left',
      clickCount: 1,
      x,
      y
    });

    if (opts.verbose) logger.info(`🖱️  Mouse up at (${Math.round(x)}, ${Math.round(y)})`);
    await browser.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button: 'left',
      clickCount: 1,
      x,
      y
    });

    if (opts.verbose) logger.info(`✅ Clicked: ${selector}`);

    // Wait for navigation and check errors
    await waitForActionComplete(browser, opts);

    return {
      success: true,
      selector,
      coordinates: { x: Math.round(x), y: Math.round(y) },
      element: { tag, text }
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Click failed: ${selector}`);
      logger.error(`   Error: ${errorMessage}`);
    }
    await waitForActionComplete(browser, opts);
    throw error;
  }
}

/**
 * Click element with automatic retry using interaction map fallback.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//button[text()='Click'])[2] selects the 2nd button.
 *
 * On failure, attempts to find alternative selectors from interaction map and retries.
 */
export async function click(
  browser: ChromeBrowser,
  selector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  try {
    // First attempt with provided selector
    return await clickCore(browser, selector, options);
  } catch (error: unknown) {
    // Check if map file exists
    const mapPath = join(process.cwd(), SELECTOR_RETRY_CONFIG.MAP_FOLDER, SELECTOR_RETRY_CONFIG.MAP_FILENAME);

    if (!existsSync(mapPath)) {
      if (opts.verbose) {
        logger.info('⚠️  No interaction map found for fallback. Rethrowing error.');
      }
      throw error;
    }

    if (opts.verbose) {
      logger.info('🔄 Attempting to find alternative selectors from map...');
    }

    // Try to find alternative selectors
    let fallbackResult: { selector: string; alternatives: string[] } | null = null;

    try {
      // If original selector looks like an ID, try querying by ID
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        fallbackResult = findSelectorWithFallback(mapPath, { id });
      }
      // If selector contains text in XPath format, extract and search
      else if (selector.includes('contains(text()')) {
        const textMatch = selector.match(/contains\(text\(\),\s*['"](.+?)['"]\)/);
        if (textMatch && textMatch[1]) {
          fallbackResult = findSelectorWithFallback(mapPath, { text: textMatch[1] });
        }
      }
    } catch (mapError: unknown) {
      if (opts.verbose) {
        const mapErrorMessage = mapError instanceof Error ? mapError.message : String(mapError);
        logger.info(`⚠️  Map query failed: ${mapErrorMessage}`);
      }
      throw error; // Rethrow original error
    }

    if (!fallbackResult || fallbackResult.alternatives.length === 0) {
      if (opts.verbose) {
        logger.info('⚠️  No alternative selectors found in map.');
      }
      throw error; // Rethrow original error
    }

    // Try alternative selectors (limit to MAX_ATTEMPTS - 1, since we already tried once)
    const maxRetries = Math.min(
      fallbackResult.alternatives.length,
      SELECTOR_RETRY_CONFIG.MAX_ATTEMPTS - 1
    );

    for (let i = 0; i < maxRetries; i++) {
      const altSelector = fallbackResult.alternatives[i];

      if (opts.verbose) {
        logger.info(`🔄 Retry ${i + 1}/${maxRetries} with selector: ${altSelector}`);
      }

      try {
        return await clickCore(browser, altSelector, options);
      } catch (_retryError: unknown) {
        if (i === maxRetries - 1) {
          // Last retry failed, throw original error
          if (opts.verbose) {
            logger.info('❌ All retry attempts exhausted.');
          }
          throw error;
        }
        // Continue to next alternative
      }
    }

    // Should not reach here, but throw original error as fallback
    throw error;
  }
}

/**
 * Fill input field core logic (without retry).
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//input[@type='text'])[2] selects the 2nd input.
 * Uses CDP click + insertText for proper React compatibility.
 */
async function fillCore(
  browser: ChromeBrowser,
  selector: string,
  value: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) {
    logger.info(`✍️  Filling input: ${selector}`);
    logger.info(`   Value: "${value}"`);
  }

  // Step 1: Find element, get coordinates, and clear existing value
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);

      // Scroll element into view
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

      // Get bounding box and calculate center point
      const box = el.getBoundingClientRect();

      // Clear existing value
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));

      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        tag: el.tagName,
        type: el.type || 'text'
      };
    })()
  `;

  try {
    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (!result.result || !result.result.value) {
      logger.error('❌ Element not found or error occurred');
      if (result.exceptionDetails) {
        logger.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      throw new Error(`Element not found: ${selector}`);
    }

    const { x, y, tag, type } = result.result.value as { x: number; y: number; tag: string; type: string };

    if (opts.verbose) {
      logger.info(`✓ Element found: <${tag.toLowerCase()} type="${type}">`);
      logger.info(`  Position: (${Math.round(x)}, ${Math.round(y)})`);
    }

    // Step 2: Click to focus
    if (opts.verbose) logger.info(`🖱️  Clicking to focus...`);

    await browser.sendCommand('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button: 'left',
      clickCount: 1,
      x,
      y
    });

    await browser.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button: 'left',
      clickCount: 1,
      x,
      y
    });

    // Small delay to ensure focus
    await sleep(TIMING.ACTION_DELAY_SHORT);

    // Step 3: Insert text using CDP
    if (opts.verbose) logger.info(`⌨️  Inserting text: "${value}"`);

    await browser.sendCommand('Input.insertText', {
      text: value
    });

    if (opts.verbose) logger.info(`✅ Fill successful`);

    // Wait for navigation and check errors
    await waitForActionComplete(browser, opts);

    return { success: true, selector, value };

  } catch (error: unknown) {
    if (opts.verbose) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Fill failed: ${selector}`);
      logger.error(`   Error: ${errorMessage}`);
    }
    await waitForActionComplete(browser, opts);
    throw error;
  }
}

/**
 * Fill input field with automatic retry using interaction map fallback.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//input[@type='text'])[2] selects the 2nd input.
 * Uses CDP click + insertText for proper React compatibility.
 *
 * On failure, attempts to find alternative selectors from interaction map and retries.
 */
export async function fill(
  browser: ChromeBrowser,
  selector: string,
  value: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  try {
    // First attempt with provided selector
    return await fillCore(browser, selector, value, options);
  } catch (error: unknown) {
    // Check if map file exists
    const mapPath = join(process.cwd(), SELECTOR_RETRY_CONFIG.MAP_FOLDER, SELECTOR_RETRY_CONFIG.MAP_FILENAME);

    if (!existsSync(mapPath)) {
      if (opts.verbose) {
        logger.info('⚠️  No interaction map found for fallback. Rethrowing error.');
      }
      throw error;
    }

    if (opts.verbose) {
      logger.info('🔄 Attempting to find alternative selectors from map...');
    }

    // Try to find alternative selectors
    let fallbackResult: { selector: string; alternatives: string[] } | null = null;

    try {
      // If original selector looks like an ID, try querying by ID
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        fallbackResult = findSelectorWithFallback(mapPath, { id });
      }
      // If selector contains text in XPath format, extract and search
      else if (selector.includes('contains(text()')) {
        const textMatch = selector.match(/contains\(text\(\),\s*['"](.+?)['"]\)/);
        if (textMatch && textMatch[1]) {
          fallbackResult = findSelectorWithFallback(mapPath, { text: textMatch[1] });
        }
      }
      // For input fields, try to find by type
      else if (selector.includes('input')) {
        fallbackResult = findSelectorWithFallback(mapPath, { type: 'input' });
      }
    } catch (mapError: unknown) {
      if (opts.verbose) {
        const mapErrorMessage = mapError instanceof Error ? mapError.message : String(mapError);
        logger.info(`⚠️  Map query failed: ${mapErrorMessage}`);
      }
      throw error; // Rethrow original error
    }

    if (!fallbackResult || fallbackResult.alternatives.length === 0) {
      if (opts.verbose) {
        logger.info('⚠️  No alternative selectors found in map.');
      }
      throw error; // Rethrow original error
    }

    // Try alternative selectors (limit to MAX_ATTEMPTS - 1, since we already tried once)
    const maxRetries = Math.min(
      fallbackResult.alternatives.length,
      SELECTOR_RETRY_CONFIG.MAX_ATTEMPTS - 1
    );

    for (let i = 0; i < maxRetries; i++) {
      const altSelector = fallbackResult.alternatives[i];

      if (opts.verbose) {
        logger.info(`🔄 Retry ${i + 1}/${maxRetries} with selector: ${altSelector}`);
      }

      try {
        return await fillCore(browser, altSelector, value, options);
      } catch (_retryError: unknown) {
        if (i === maxRetries - 1) {
          // Last retry failed, throw original error
          if (opts.verbose) {
            logger.info('❌ All retry attempts exhausted.');
          }
          throw error;
        }
        // Continue to next alternative
      }
    }

    // Should not reach here, but throw original error as fallback
    throw error;
  }
}

/**
 * Hover over element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP mouseMoved event for proper React compatibility.
 */
export async function hover(
  browser: ChromeBrowser,
  selector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`🔍 Hovering: ${selector}`);

  // Step 1: Find element and scroll into view
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);

      // Scroll element into view
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

      // Get bounding box and calculate center point
      const box = el.getBoundingClientRect();
      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        tag: el.tagName,
        text: el.textContent?.substring(0, 50) || '',
        visible: box.width > 0 && box.height > 0
      };
    })()
  `;

  try {
    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (!result.result || !result.result.value) {
      logger.error('❌ Element not found or error occurred');
      if (result.exceptionDetails) {
        logger.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      throw new Error(`Element not found: ${selector}`);
    }

    const { x, y, tag, text, visible } = result.result.value as { x: number; y: number; tag: string; text: string; visible: boolean };
    if (opts.verbose) {
      logger.info(`✓ Element found: <${tag.toLowerCase()}> "${text}"`);
      logger.info(`  Position: (${Math.round(x)}, ${Math.round(y)}), Visible: ${visible}`);
      logger.info(`🖱️  Moving mouse to (${Math.round(x)}, ${Math.round(y)})`);
    }

    // Step 2: Dispatch CDP mouse move event
    await browser.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y
    });

    if (opts.verbose) logger.info(`✅ Hover successful`);
    await waitForActionComplete(browser, opts);

    return {
      success: true,
      selector,
      coordinates: { x: Math.round(x), y: Math.round(y) },
      element: { tag, text }
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Hover failed: ${selector}`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    await waitForActionComplete(browser, opts);
    throw error;
  }
}

/**
 * Focus element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function focus(
  browser: ChromeBrowser,
  selector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`🔍 Focusing: ${selector}`);
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.focus();
      return true;
    })()
  `;
  await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  if (opts.verbose) logger.info(`✅ Focus successful`);
  await waitForActionComplete(browser, opts);

  return { success: true, selector };
}

/**
 * Blur element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function blur(
  browser: ChromeBrowser,
  selector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`🔍 Blurring: ${selector}`);
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.blur();
      return true;
    })()
  `;
  await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  if (opts.verbose) logger.info(`✅ Blur successful`);
  await waitForActionComplete(browser, opts);

  return { success: true, selector };
}

/**
 * Drag and drop from one element to another.
 * Uses CDP mouse events for proper React/framework compatibility.
 */
export async function dragAndDrop(
  browser: ChromeBrowser,
  sourceSelector: string,
  targetSelector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`🔍 Dragging ${sourceSelector} to ${targetSelector}`);

  // Step 1: Get coordinates for both elements
  const script = `
    (function() {
      const sourceSelector = ${JSON.stringify(sourceSelector)};
      const targetSelector = ${JSON.stringify(targetSelector)};
      ${getFindElementScript()}

      const source = findElement(sourceSelector);
      const target = findElement(targetSelector);

      if (!source) throw new Error('Source element not found: ' + sourceSelector);
      if (!target) throw new Error('Target element not found: ' + targetSelector);

      // Scroll both into view
      source.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      const sourceRect = source.getBoundingClientRect();

      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      const targetRect = target.getBoundingClientRect();

      return {
        source: {
          x: sourceRect.left + sourceRect.width / 2,
          y: sourceRect.top + sourceRect.height / 2,
          tag: source.tagName,
          text: source.textContent?.substring(0, 30) || ''
        },
        target: {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
          tag: target.tagName,
          text: target.textContent?.substring(0, 30) || ''
        }
      };
    })()
  `;

  try {
    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (!result.result || !result.result.value) {
      logger.error('❌ Element(s) not found');
      throw new Error('Could not find source or target element');
    }

    const { source, target } = result.result.value as {
      source: { x: number; y: number; tag: string; text: string };
      target: { x: number; y: number; tag: string; text: string };
    };

    if (opts.verbose) {
      logger.info(`✓ Source: <${source.tag.toLowerCase()}> "${source.text}" at (${Math.round(source.x)}, ${Math.round(source.y)})`);
      logger.info(`✓ Target: <${target.tag.toLowerCase()}> "${target.text}" at (${Math.round(target.x)}, ${Math.round(target.y)})`);
    }

    // Step 2: Perform CDP drag operation
    if (opts.verbose) logger.info(`🖱️  Mouse down at source (${Math.round(source.x)}, ${Math.round(source.y)})`);

    await browser.sendCommand('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      button: 'left',
      clickCount: 1,
      x: source.x,
      y: source.y
    });

    // Small delay to simulate drag start
    await sleep(TIMING.ACTION_DELAY_MEDIUM);

    if (opts.verbose) logger.info(`🖱️  Dragging to target (${Math.round(target.x)}, ${Math.round(target.y)})`);

    await browser.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      button: 'left',
      x: target.x,
      y: target.y
    });

    // Small delay before release
    await sleep(TIMING.ACTION_DELAY_MEDIUM);

    if (opts.verbose) logger.info(`🖱️  Mouse up at target (${Math.round(target.x)}, ${Math.round(target.y)})`);

    await browser.sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      button: 'left',
      clickCount: 1,
      x: target.x,
      y: target.y
    });

    if (opts.verbose) logger.info(`✅ Drag and drop successful`);
    await waitForActionComplete(browser, opts);

    return {
      success: true,
      sourceSelector,
      targetSelector,
      source: { x: Math.round(source.x), y: Math.round(source.y) },
      target: { x: Math.round(target.x), y: Math.round(target.y) }
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Drag and drop failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    await waitForActionComplete(browser, opts);
    throw error;
  }
}
