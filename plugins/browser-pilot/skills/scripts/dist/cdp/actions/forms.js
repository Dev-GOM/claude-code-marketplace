"use strict";
/**
 * Form actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectOption = selectOption;
exports.check = check;
exports.uncheck = uncheck;
exports.uploadFile = uploadFile;
const fs_1 = require("fs");
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
/**
 * Select option from dropdown.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function selectOption(browser, selector, value, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🔽 Selecting option ${value} in: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const value = ${JSON.stringify(value)};
      ${(0, utils_1.getFindElementScript)()}
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
        if (opts.verbose)
            logger_1.logger.info(`✅ Selected option: ${value}`);
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        return { success: true, selector, value };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (opts.verbose) {
            logger_1.logger.error(`❌ Select failed: ${selector}`);
            logger_1.logger.error(`   Error: ${errorMessage}`);
        }
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        throw error;
    }
}
/**
 * Check checkbox.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP click for proper React compatibility.
 */
async function check(browser, selector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`☑️  Checking: ${selector}`);
    // Step 1: Find element and get coordinates
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
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
            logger_1.logger.error('❌ Element not found or error occurred');
            if (result.exceptionDetails) {
                logger_1.logger.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
            }
            throw new Error(`Element not found: ${selector}`);
        }
        const { x, y, checked: isChecked } = result.result.value;
        // Step 2: Click only if not already checked
        if (isChecked) {
            if (opts.verbose)
                logger_1.logger.info(`✓ Checkbox already checked`);
        }
        else {
            if (opts.verbose)
                logger_1.logger.info(`🖱️  Clicking checkbox at (${Math.round(x)}, ${Math.round(y)})`);
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
        if (opts.verbose)
            logger_1.logger.info(`✅ Checkbox checked`);
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        return { success: true, selector };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (opts.verbose) {
            logger_1.logger.error(`❌ Check failed: ${selector}`);
            logger_1.logger.error(`   Error: ${errorMessage}`);
        }
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        throw error;
    }
}
/**
 * Uncheck checkbox.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Uses CDP click for proper React compatibility.
 */
async function uncheck(browser, selector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`☐ Unchecking: ${selector}`);
    // Step 1: Find element and get coordinates
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
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
            logger_1.logger.error('❌ Element not found or error occurred');
            if (result.exceptionDetails) {
                logger_1.logger.error('Error:', result.exceptionDetails.exception?.description || result.exceptionDetails.text);
            }
            throw new Error(`Element not found: ${selector}`);
        }
        const { x, y, checked: isChecked } = result.result.value;
        // Step 2: Click only if currently checked
        if (!isChecked) {
            if (opts.verbose)
                logger_1.logger.info(`✓ Checkbox already unchecked`);
        }
        else {
            if (opts.verbose)
                logger_1.logger.info(`🖱️  Clicking checkbox at (${Math.round(x)}, ${Math.round(y)})`);
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
        if (opts.verbose)
            logger_1.logger.info(`✅ Checkbox unchecked`);
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        return { success: true, selector };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (opts.verbose) {
            logger_1.logger.error(`❌ Uncheck failed: ${selector}`);
            logger_1.logger.error(`   Error: ${errorMessage}`);
        }
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        throw error;
    }
}
/**
 * Upload file to input element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function uploadFile(browser, selector, filePath, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`📁 Uploading file ${filePath} to: ${selector}`);
    // File size validation (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const stats = (0, fs_1.statSync)(filePath);
    if (stats.size > MAX_FILE_SIZE) {
        const error = `File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE} bytes = 10MB)`;
        if (opts.verbose)
            logger_1.logger.error(`❌ ${error}`);
        throw new Error(error);
    }
    const fileData = (0, fs_1.readFileSync)(filePath, 'base64');
    const fileName = filePath.split(/[/\\]/).pop() || 'file';
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const fileData = ${JSON.stringify(fileData)};
      const fileName = ${JSON.stringify(fileName)};

      ${(0, utils_1.getFindElementScript)()}

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
        if (opts.verbose)
            logger_1.logger.info(`✅ File uploaded: ${fileName}`);
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        return { success: true, selector, file: filePath };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (opts.verbose) {
            logger_1.logger.error(`❌ Upload failed: ${selector}`);
            logger_1.logger.error(`   Error: ${errorMessage}`);
        }
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        throw error;
    }
}
//# sourceMappingURL=forms.js.map