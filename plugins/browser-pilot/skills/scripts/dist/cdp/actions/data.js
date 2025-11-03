"use strict";
/**
 * Data extraction and evaluation actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate = evaluate;
exports.extractText = extractText;
exports.extractData = extractData;
exports.getContent = getContent;
exports.getElementProperty = getElementProperty;
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
/**
 * Evaluate JavaScript.
 */
async function evaluate(browser, script, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`⚙️  Evaluating JavaScript...`);
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    if (opts.verbose)
        console.log(`✅ Evaluation complete`);
    (0, helpers_1.checkConsoleErrors)(browser);
    return { success: true, result: result.result?.value };
}
/**
 * Extract text from element or body.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function extractText(browser, selector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose) {
        if (selector) {
            console.log(`📝 Extracting text from: ${selector}`);
        }
        else {
            console.log(`📝 Extracting text from page body`);
        }
    }
    const script = selector
        ? `(function() {
        const selector = ${JSON.stringify(selector)};
        ${(0, utils_1.getFindElementScript)()}
        return findElement(selector)?.textContent || '';
      })()`
        : `document.body.textContent || ''`;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    const text = result.result?.value || '';
    if (opts.verbose)
        console.log(`✅ Extracted ${text.length} characters`);
    (0, helpers_1.checkConsoleErrors)(browser);
    return { success: true, text };
}
/**
 * Extract data using multiple selectors.
 */
async function extractData(browser, selectors, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`📊 Extracting data with ${Object.keys(selectors).length} selectors`);
    const data = {};
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
        }
        catch (error) {
            data[key] = `Error: ${error}`;
        }
    }
    if (opts.verbose)
        console.log(`✅ Extracted data for ${Object.keys(data).length} keys`);
    (0, helpers_1.checkConsoleErrors)(browser);
    return { success: true, data };
}
/**
 * Get page HTML content.
 */
async function getContent(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log('📄 Getting page HTML content');
    const script = `document.documentElement.outerHTML`;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    const content = result.result?.value || '';
    if (opts.verbose)
        console.log(`✅ Retrieved ${content.length} characters of HTML`);
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
async function getElementProperty(browser, selector, propertyName, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`🔍 Getting property '${propertyName}' from: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const propertyName = ${JSON.stringify(propertyName)};
      ${(0, utils_1.getFindElementScript)()}
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
        if (opts.verbose)
            console.log(`✅ Property '${propertyName}': ${result.result?.value}`);
        (0, helpers_1.checkConsoleErrors)(browser);
        return {
            success: true,
            selector,
            property: propertyName,
            value: result.result?.value
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Get property failed: ${selector}`);
            console.error(`   Error: ${error.message}`);
        }
        (0, helpers_1.checkConsoleErrors)(browser);
        throw error;
    }
}
//# sourceMappingURL=data.js.map