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
/**
 * Set up network request interception.
 */
async function enableRequestInterception(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`🌐 Enabling network request interception...`);
    try {
        await browser.sendCommand('Fetch.enable', {
            patterns: [{ urlPattern: '*' }]
        });
        if (opts.verbose)
            console.log(`✅ Request interception enabled`);
        return {
            success: true,
            note: 'Request interception enabled. Use interceptRequest() to handle requests.'
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Enable request interception failed`);
            console.error(`   Error: ${error.message}`);
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
        console.log(`🌐 Disabling network request interception...`);
    try {
        await browser.sendCommand('Fetch.disable');
        if (opts.verbose)
            console.log(`✅ Request interception disabled`);
        return {
            success: true
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Disable request interception failed`);
            console.error(`   Error: ${error.message}`);
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
        console.log(`🌐 Mocking request: ${urlPattern} -> ${statusCode}`);
    try {
        // This is a simplified version - full implementation requires event handling
        await browser.sendCommand('Fetch.enable', {
            patterns: [{ urlPattern }]
        });
        if (opts.verbose)
            console.log(`✅ Mock configured for: ${urlPattern}`);
        return {
            success: true,
            urlPattern,
            statusCode,
            note: 'Mock configured. Use Fetch.continueRequest or Fetch.fulfillRequest in event handler.'
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Mock request failed`);
            console.error(`   Error: ${error.message}`);
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
        console.log(`🚫 Blocking requests matching: ${urlPattern}`);
    try {
        await browser.sendCommand('Network.enable');
        await browser.sendCommand('Network.setBlockedURLs', {
            urls: [urlPattern]
        });
        if (opts.verbose)
            console.log(`✅ Requests blocked: ${urlPattern}`);
        return {
            success: true,
            urlPattern,
            blocked: true
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Block request failed`);
            console.error(`   Error: ${error.message}`);
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
        console.log(`🌐 Unblocking all requests...`);
    try {
        await browser.sendCommand('Network.setBlockedURLs', {
            urls: []
        });
        if (opts.verbose)
            console.log(`✅ All requests unblocked`);
        return {
            success: true,
            blocked: false
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Unblock requests failed`);
            console.error(`   Error: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=network.js.map