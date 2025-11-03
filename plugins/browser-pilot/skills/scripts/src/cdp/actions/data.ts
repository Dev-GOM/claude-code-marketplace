/**
 * Data extraction and evaluation actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, checkConsoleErrors } from './helpers';

/**
 * Evaluate JavaScript.
 */
export async function evaluate(
  browser: ChromeBrowser,
  script: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`⚙️  Evaluating JavaScript...`);

  const result = await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  if (opts.verbose) console.log(`✅ Evaluation complete`);
  checkConsoleErrors(browser);

  return { success: true, result: result.result?.value };
}

/**
 * Extract text from element or body.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function extractText(
  browser: ChromeBrowser,
  selector?: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) {
    if (selector) {
      console.log(`📝 Extracting text from: ${selector}`);
    } else {
      console.log(`📝 Extracting text from page body`);
    }
  }
  const script = selector
    ? `(function() {
        const selector = ${JSON.stringify(selector)};
        ${getFindElementScript()}
        return findElement(selector)?.textContent || '';
      })()`
    : `document.body.textContent || ''`;

  const result = await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  const text = result.result?.value || '';
  if (opts.verbose) console.log(`✅ Extracted ${text.length} characters`);
  checkConsoleErrors(browser);

  return { success: true, text };
}

/**
 * Extract data using multiple selectors.
 */
export async function extractData(
  browser: ChromeBrowser,
  selectors: Record<string, string>,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`📊 Extracting data with ${Object.keys(selectors).length} selectors`);

  const data: Record<string, any> = {};

  for (const [key, selector] of Object.entries(selectors)) {
    try {
      const script = `
        (function() {
          const selector = ${JSON.stringify(selector)};
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) return null;
          if (elements.length === 1) return elements[0].innerText;
          return Array.from(elements).map(el => el.innerText);
        })()
      `;
      const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
      });
      data[key] = result.result?.value;
    } catch (error) {
      data[key] = `Error: ${error}`;
    }
  }

  if (opts.verbose) console.log(`✅ Extracted data for ${Object.keys(data).length} keys`);
  checkConsoleErrors(browser);

  return { success: true, data };
}

/**
 * Get page HTML content.
 */
export async function getContent(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log('📄 Getting page HTML content');

  const script = `document.documentElement.outerHTML`;

  const result = await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  const content = result.result?.value || '';
  if (opts.verbose) console.log(`✅ Retrieved ${content.length} characters of HTML`);

  return {
    success: true,
    content,
    length: content.length
  };
}

/**
 * Get element property value.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function getElementProperty(
  browser: ChromeBrowser,
  selector: string,
  propertyName: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🔍 Getting property '${propertyName}' from: ${selector}`);

  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const propertyName = ${JSON.stringify(propertyName)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      return el[propertyName];
    })()
  `;

  try {
    const result = await browser.sendCommand('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (result.exceptionDetails) {
      if (opts.verbose) {
        console.error(`❌ Get property failed: ${selector}`);
        console.error(`   Error: ${result.exceptionDetails.exception.description}`);
      }
      return {
        success: false,
        error: result.exceptionDetails.exception.description
      };
    }

    if (opts.verbose) console.log(`✅ Property '${propertyName}': ${result.result?.value}`);
    checkConsoleErrors(browser);

    return {
      success: true,
      selector,
      property: propertyName,
      value: result.result?.value
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Get property failed: ${selector}`);
      console.error(`   Error: ${error.message}`);
    }
    checkConsoleErrors(browser);
    throw error;
  }
}
