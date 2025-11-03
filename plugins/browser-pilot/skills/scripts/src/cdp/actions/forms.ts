/**
 * Form actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { readFileSync, statSync } from 'fs';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, checkConsoleErrors } from './helpers';

/**
 * Select option from dropdown.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function selectOption(
  browser: ChromeBrowser,
  selector: string,
  value: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🔽 Selecting option ${value} in: ${selector}`);

  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const value = ${JSON.stringify(value)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `;

  try {
    await browser.sendCommand('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (opts.verbose) console.log(`✅ Selected option: ${value}`);
    checkConsoleErrors(browser);

    return { success: true, selector, value };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Select failed: ${selector}`);
      console.error(`   Error: ${error.message}`);
    }
    checkConsoleErrors(browser);
    throw error;
  }
}

/**
 * Check checkbox.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP click for proper React compatibility.
 */
export async function check(
  browser: ChromeBrowser,
  selector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`☑️  Checking: ${selector}`);

  // Step 1: Find element and get coordinates
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      if (el.type !== 'checkbox') throw new Error('Element is not a checkbox: ' + selector);

      // Scroll element into view
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

      // Get bounding box and calculate center point
      const box = el.getBoundingClientRect();

      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        checked: el.checked
      };
    })()
  `;

  try {
    const result = await browser.sendCommand('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (!result.result || !result.result.value) {
      console.error('❌ Element not found or error occurred');
      if (result.exceptionDetails) {
        console.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      throw new Error(`Element not found: ${selector}`);
    }

    const { x, y, checked } = result.result.value;

    // Step 2: Click only if not already checked
    if (checked) {
      if (opts.verbose) console.log(`✓ Checkbox already checked`);
    } else {
      if (opts.verbose) console.log(`🖱️  Clicking checkbox at (${Math.round(x)}, ${Math.round(y)})`);

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
    }

    if (opts.verbose) console.log(`✅ Checkbox checked`);
    checkConsoleErrors(browser);

    return { success: true, selector };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Check failed: ${selector}`);
      console.error(`   Error: ${error.message}`);
    }
    checkConsoleErrors(browser);
    throw error;
  }
}

/**
 * Uncheck checkbox.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP click for proper React compatibility.
 */
export async function uncheck(
  browser: ChromeBrowser,
  selector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`☐ Unchecking: ${selector}`);

  // Step 1: Find element and get coordinates
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      if (el.type !== 'checkbox') throw new Error('Element is not a checkbox: ' + selector);

      // Scroll element into view
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });

      // Get bounding box and calculate center point
      const box = el.getBoundingClientRect();

      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
        checked: el.checked
      };
    })()
  `;

  try {
    const result = await browser.sendCommand('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (!result.result || !result.result.value) {
      console.error('❌ Element not found or error occurred');
      if (result.exceptionDetails) {
        console.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      throw new Error(`Element not found: ${selector}`);
    }

    const { x, y, checked } = result.result.value;

    // Step 2: Click only if currently checked
    if (!checked) {
      if (opts.verbose) console.log(`✓ Checkbox already unchecked`);
    } else {
      if (opts.verbose) console.log(`🖱️  Clicking checkbox at (${Math.round(x)}, ${Math.round(y)})`);

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
    }

    if (opts.verbose) console.log(`✅ Checkbox unchecked`);
    checkConsoleErrors(browser);

    return { success: true, selector };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Uncheck failed: ${selector}`);
      console.error(`   Error: ${error.message}`);
    }
    checkConsoleErrors(browser);
    throw error;
  }
}

/**
 * Upload file to input element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function uploadFile(
  browser: ChromeBrowser,
  selector: string,
  filePath: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`📁 Uploading file ${filePath} to: ${selector}`);

  // File size validation (10MB limit)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const stats = statSync(filePath);

  if (stats.size > MAX_FILE_SIZE) {
    const error = `File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE} bytes = 10MB)`;
    if (opts.verbose) console.error(`❌ ${error}`);
    throw new Error(error);
  }

  const fileData = readFileSync(filePath, 'base64');
  const fileName = filePath.split(/[/\\]/).pop() || 'file';

  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const fileData = ${JSON.stringify(fileData)};
      const fileName = ${JSON.stringify(fileName)};

      ${getFindElementScript()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      if (el.tagName !== 'INPUT' || el.type !== 'file') {
        throw new Error('Element is not a file input');
      }

      const dataTransfer = new DataTransfer();
      const file = new File(
        [Uint8Array.from(atob(fileData), c => c.charCodeAt(0))],
        fileName
      );
      dataTransfer.items.add(file);
      el.files = dataTransfer.files;

      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `;

  try {
    await browser.sendCommand('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (opts.verbose) console.log(`✅ File uploaded: ${fileName}`);
    checkConsoleErrors(browser);

    return { success: true, selector, file: filePath };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Upload failed: ${selector}`);
      console.error(`   Error: ${error.message}`);
    }
    checkConsoleErrors(browser);
    throw error;
  }
}
