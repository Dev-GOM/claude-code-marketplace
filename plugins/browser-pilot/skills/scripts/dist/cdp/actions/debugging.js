"use strict";
/**
 * Debugging actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsoleMessages = getConsoleMessages;
exports.getAccessibilitySnapshot = getAccessibilitySnapshot;
exports.findElement = findElement;
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
/**
 * Get console messages.
 *
 * Returns console messages that have been collected since the browser connected.
 * Messages are automatically collected when Log domain is enabled during connection.
 */
async function getConsoleMessages(browser, errorOnly = false, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info('📋 Getting console messages...');
    // Get all collected messages from browser
    const allMessages = browser.getConsoleMessages();
    // Filter by error level if requested
    const messages = errorOnly
        ? allMessages.filter(msg => msg.level === 'error')
        : allMessages;
    // Format messages for display
    const formattedMessages = messages.map(msg => ({
        level: msg.level,
        text: msg.text,
        timestamp: new Date(msg.timestamp).toISOString(),
        url: msg.url,
        lineNumber: msg.lineNumber
    }));
    const errorCount = allMessages.filter(msg => msg.level === 'error').length;
    const warningCount = allMessages.filter(msg => msg.level === 'warning').length;
    if (opts.verbose) {
        logger_1.logger.info(`✅ Retrieved ${formattedMessages.length} message(s) (${errorCount} errors, ${warningCount} warnings)`);
    }
    return {
        success: true,
        messages: formattedMessages,
        count: formattedMessages.length,
        errorCount,
        warningCount,
        logCount: allMessages.filter(msg => msg.level === 'log' || msg.level === 'info').length
    };
}
/**
 * Get accessibility tree snapshot.
 */
async function getAccessibilitySnapshot(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info('♿ Getting accessibility snapshot...');
    try {
        await browser.sendCommand('Accessibility.enable');
        const result = await browser.sendCommand('Accessibility.getFullAXTree');
        const nodes = result.nodes || [];
        const formattedNodes = nodes.slice(0, 50).map((node) => {
            const n = node;
            return {
                role: n.role?.value,
                name: n.name?.value,
                description: n.description?.value
            };
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ Retrieved ${nodes.length} accessibility nodes (showing first 50)`);
        return {
            success: true,
            nodeCount: nodes.length,
            nodes: formattedNodes
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Get accessibility snapshot failed`, error);
        }
        throw error;
    }
}
/**
 * Find element and return its information.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function findElement(browser, selector, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🔍 Finding element: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) return null;

      const rect = el.getBoundingClientRect();

      return {
        tagName: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        textContent: el.textContent?.substring(0, 100),
        visible: rect.width > 0 && rect.height > 0,
        position: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        },
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      };
    })()
  `;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    const elementInfo = result.result?.value;
    if (!elementInfo) {
        if (opts.verbose)
            logger_1.logger.info(`❌ Element not found: ${selector}`);
        return {
            success: false,
            error: `Element not found: ${selector}`
        };
    }
    if (opts.verbose)
        logger_1.logger.info(`✅ Found <${elementInfo.tagName}> element`);
    (0, helpers_1.checkErrors)(browser, opts.logLevel);
    return {
        success: true,
        selector,
        element: elementInfo
    };
}
//# sourceMappingURL=debugging.js.map