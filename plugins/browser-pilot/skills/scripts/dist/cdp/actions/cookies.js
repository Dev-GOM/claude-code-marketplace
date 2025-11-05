"use strict";
/**
 * Cookie management actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCookies = getCookies;
exports.setCookie = setCookie;
exports.deleteCookies = deleteCookies;
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
/**
 * Get all cookies.
 */
async function getCookies(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info('🍪 Getting cookies...');
    const result = await browser.sendCommand('Network.getCookies');
    const cookies = result.cookies || [];
    if (opts.verbose)
        logger_1.logger.info(`✅ Retrieved ${cookies.length} cookie(s)`);
    return { success: true, cookies, count: cookies.length };
}
/**
 * Set a cookie.
 */
async function setCookie(browser, name, value, domain, path = '/', secure = false, httpOnly = false, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`🍪 Setting cookie: ${name}`);
    const cookieParams = {
        name,
        value,
        path,
        secure,
        httpOnly,
        ...(domain && { domain })
    };
    await browser.sendCommand('Network.setCookie', cookieParams);
    if (opts.verbose)
        logger_1.logger.info(`✅ Cookie set successfully`);
    return { success: true, name };
}
/**
 * Delete cookies.
 */
async function deleteCookies(browser, name, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (name) {
        if (opts.verbose)
            logger_1.logger.info(`🍪 Deleting cookie: ${name}`);
        // Get all cookies to find the domain
        const result = await browser.sendCommand('Network.getCookies');
        const cookies = result.cookies || [];
        // Find matching cookies
        const matchingCookies = cookies.filter((c) => c.name === name);
        if (matchingCookies.length > 0) {
            for (const cookie of matchingCookies) {
                await browser.sendCommand('Network.deleteCookies', {
                    name,
                    domain: cookie.domain || ''
                });
            }
            if (opts.verbose)
                logger_1.logger.info(`✅ Deleted ${matchingCookies.length} cookie(s) with name '${name}'`);
        }
        else {
            if (opts.verbose)
                logger_1.logger.warn(`⚠️  Warning: Cookie '${name}' not found`);
        }
    }
    else {
        if (opts.verbose)
            logger_1.logger.info('🍪 Deleting all cookies...');
        await browser.sendCommand('Network.clearBrowserCookies');
        if (opts.verbose)
            logger_1.logger.info(`✅ All cookies deleted`);
    }
    return { success: true };
}
//# sourceMappingURL=cookies.js.map