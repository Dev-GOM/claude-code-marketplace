"use strict";
/**
 * Network interception and mocking actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableRequestInterception = enableRequestInterception;
exports.disableRequestInterception = disableRequestInterception;
exports.mockRequest = mockRequest;
exports.blockRequest = blockRequest;
exports.unblockRequests = unblockRequests;
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
/**
 * Set up network request interception.
 */
async function enableRequestInterception(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🌐 Enabling network request interception...`);
    try {
        await browser.sendCommand('Fetch.enable', {
            patterns: [{ urlPattern: '*' }]
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ Request interception enabled`);
        return {
            success: true,
            note: 'Request interception enabled. Use interceptRequest() to handle requests.'
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Enable request interception failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
            }
        }
        throw error;
    }
}
/**
 * Disable network request interception.
 */
async function disableRequestInterception(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🌐 Disabling network request interception...`);
    try {
        await browser.sendCommand('Fetch.disable');
        if (opts.verbose)
            logger_1.logger.info(`✅ Request interception disabled`);
        return {
            success: true
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Disable request interception failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
            }
        }
        throw error;
    }
}
/**
 * Mock a network request response.
 */
async function mockRequest(browser, urlPattern, responseBody, statusCode = 200, headers, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🌐 Mocking request: ${urlPattern} -> ${statusCode}`);
    try {
        // This is a simplified version - full implementation requires event handling
        await browser.sendCommand('Fetch.enable', {
            patterns: [{ urlPattern }]
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ Mock configured for: ${urlPattern}`);
        return {
            success: true,
            urlPattern,
            statusCode,
            note: 'Mock configured. Use Fetch.continueRequest or Fetch.fulfillRequest in event handler.'
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Mock request failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
            }
        }
        throw error;
    }
}
/**
 * Block network requests matching pattern.
 */
async function blockRequest(browser, urlPattern, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🚫 Blocking requests matching: ${urlPattern}`);
    try {
        await browser.sendCommand('Network.enable');
        await browser.sendCommand('Network.setBlockedURLs', {
            urls: [urlPattern]
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ Requests blocked: ${urlPattern}`);
        return {
            success: true,
            urlPattern,
            blocked: true
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Block request failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
            }
        }
        throw error;
    }
}
/**
 * Unblock all network requests.
 */
async function unblockRequests(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🌐 Unblocking all requests...`);
    try {
        await browser.sendCommand('Network.setBlockedURLs', {
            urls: []
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ All requests unblocked`);
        return {
            success: true,
            blocked: false
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Unblock requests failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
            }
        }
        throw error;
    }
}
//# sourceMappingURL=network.js.map