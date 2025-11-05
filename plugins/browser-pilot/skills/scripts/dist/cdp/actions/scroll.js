"use strict";
/**
 * Scroll actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scroll = scroll;
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
/**
 * Scroll page or element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * Note: x and y are both optional - you can scroll on just one axis if needed.
 */
async function scroll(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    const x = options?.x ?? 0;
    const y = options?.y ?? 0;
    const selector = options?.selector;
    if (opts.verbose)
        logger_1.logger.info(`📜 Scrolling to (${x}, ${y})${selector ? ` on ${selector}` : ''}`);
    const script = selector
        ? `
      (function() {
        const selector = ${JSON.stringify(selector)};
        const x = ${JSON.stringify(x)};
        const y = ${JSON.stringify(y)};
        ${(0, utils_1.getFindElementScript)()}
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
        if (opts.verbose)
            logger_1.logger.info(`✅ Scrolled successfully`);
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        return {
            success: true,
            position: result.result?.value
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (opts.verbose) {
            logger_1.logger.error(`❌ Scroll failed`);
            logger_1.logger.error(`   Error: ${errorMessage}`);
        }
        (0, helpers_1.checkErrors)(browser, opts.logLevel);
        throw error;
    }
}
//# sourceMappingURL=scroll.js.map