"use strict";
/**
 * Tab management actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.newTab = newTab;
exports.listTabs = listTabs;
exports.switchTab = switchTab;
exports.closeTab = closeTab;
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
const constants_1 = require("../../constants");
/**
 * Create new tab.
 */
async function newTab(browser, url = 'about:blank', options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`📑 Opening new tab: ${url}`);
    const result = await browser.sendCommand('Target.createTarget', { url });
    if (opts.verbose)
        logger_1.logger.info(`✅ New tab created`);
    return {
        success: true,
        targetId: result.targetId,
        url
    };
}
/**
 * List all tabs.
 */
async function listTabs(browser, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`📑 Listing all tabs...`);
    const debugPort = browser.debugPort;
    const response = await fetch(`http://${constants_1.CDP.LOCALHOST}:${debugPort}/json`);
    const targets = await response.json();
    const pageTabs = targets
        .filter((t) => t.type === 'page')
        .map((t, index) => ({
        index,
        targetId: t.id,
        url: t.url,
        title: t.title
    }));
    if (opts.verbose)
        logger_1.logger.info(`✅ Found ${pageTabs.length} tab(s)`);
    return {
        success: true,
        tabs: pageTabs,
        count: pageTabs.length
    };
}
/**
 * Switch to tab.
 */
async function switchTab(browser, targetId, index, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose) {
        if (targetId) {
            logger_1.logger.info(`📑 Switching to tab: ${targetId}`);
        }
        else if (index !== undefined) {
            logger_1.logger.info(`📑 Switching to tab index: ${index}`);
        }
    }
    const debugPort = browser.debugPort;
    const response = await fetch(`http://${constants_1.CDP.LOCALHOST}:${debugPort}/json`);
    const targets = await response.json();
    const pageTabs = targets.filter((t) => t.type === 'page');
    let target = undefined;
    if (targetId) {
        target = pageTabs.find((t) => t.id === targetId);
    }
    else if (index !== undefined) {
        target = pageTabs[index];
    }
    if (!target) {
        if (opts.verbose)
            logger_1.logger.info(`❌ Target not found`);
        return { success: false, error: 'Target not found' };
    }
    await browser.sendCommand('Target.activateTarget', { targetId: target.id });
    if (opts.verbose)
        logger_1.logger.info(`✅ Switched to tab: ${target.title}`);
    return {
        success: true,
        targetId: target.id,
        url: target.url,
        title: target.title
    };
}
/**
 * Close tab.
 */
async function closeTab(browser, targetId, index, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose) {
        if (targetId) {
            logger_1.logger.info(`📑 Closing tab: ${targetId}`);
        }
        else if (index !== undefined) {
            logger_1.logger.info(`📑 Closing tab index: ${index}`);
        }
    }
    const debugPort = browser.debugPort;
    const response = await fetch(`http://${constants_1.CDP.LOCALHOST}:${debugPort}/json`);
    const targets = await response.json();
    const pageTabs = targets.filter((t) => t.type === 'page');
    let target = undefined;
    if (targetId) {
        target = pageTabs.find((t) => t.id === targetId);
    }
    else if (index !== undefined) {
        target = pageTabs[index];
    }
    if (!target) {
        if (opts.verbose)
            logger_1.logger.info(`❌ Target not found`);
        return { success: false, error: 'Target not found' };
    }
    await browser.sendCommand('Target.closeTarget', { targetId: target.id });
    if (opts.verbose)
        logger_1.logger.info(`✅ Closed tab: ${target.title}`);
    return {
        success: true,
        targetId: target.id,
        message: `Closed tab: ${target.title}`
    };
}
//# sourceMappingURL=tabs.js.map