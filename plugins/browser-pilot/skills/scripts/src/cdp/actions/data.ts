/**
 * Data extraction and evaluation actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, checkErrors, RuntimeEvaluateResult } from './helpers';
import { logger } from '../../utils/logger';

/**
 * Evaluate JavaScript.
 */
export async function evaluate(
  browser: ChromeBrowser,
  script: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`⚙️  Evaluating JavaScript...`);

  const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  if (opts.verbose) logger.info(`✅ Evaluation complete`);
  checkErrors(browser, opts.logLevel);

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
      logger.info(`📝 Extracting text from: ${selector}`);
    } else {
      logger.info(`📝 Extracting text from page body`);
    }
  }
  const script = selector
    ? `(function() {
        const selector = ${JSON.stringify(selector)};
        ${getFindElementScript()}
        return findElement(selector)?.textContent || '';
      })()`
    : `document.body.textContent || ''`;

  const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  const text = (result.result?.value as string) || '';
  if (opts.verbose) logger.info(`✅ Extracted ${text.length} characters`);
  checkErrors(browser, opts.logLevel);

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

  if (opts.verbose) logger.info(`📊 Extracting data with ${Object.keys(selectors).length} selectors`);

  const data: Record<string, unknown> = {};

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
      const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
        expression: script,
        returnByValue: true
      });
      data[key] = result.result?.value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      data[key] = `Error: ${errorMessage}`;
    }
  }

  if (opts.verbose) logger.info(`✅ Extracted data for ${Object.keys(data).length} keys`);
  checkErrors(browser, opts.logLevel);

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

  if (opts.verbose) logger.info('📄 Getting page HTML content');

  const script = `document.documentElement.outerHTML`;

  const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  const content = (result.result?.value as string) || '';
  if (opts.verbose) logger.info(`✅ Retrieved ${content.length} characters of HTML`);

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

  if (opts.verbose) logger.info(`🔍 Getting property '${propertyName}' from: ${selector}`);

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
    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    if (result.exceptionDetails) {
      const errorMsg = result.exceptionDetails.exception?.description ||
                       result.exceptionDetails.text ||
                       'Unknown error';
      if (opts.verbose) {
        logger.error(`❌ Get property failed: ${selector}`);
        logger.error(`   Error: ${errorMsg}`);
      }
      return {
        success: false,
        error: errorMsg
      };
    }

    if (opts.verbose) logger.info(`✅ Property '${propertyName}': ${result.result?.value}`);
    checkErrors(browser, opts.logLevel);

    return {
      success: true,
      selector,
      property: propertyName,
      value: result.result?.value
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (opts.verbose) {
      logger.error(`❌ Get property failed: ${selector}`);
      logger.error(`   Error: ${errorMessage}`);
    }
    return {
      success: false,
      error: errorMessage
    };
  }
}
