"use strict";
/**
 * Navigation command handlers for Browser Pilot Daemon
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveLastUrl = saveLastUrl;
exports.loadLastUrl = loadLastUrl;
exports.handleNavigate = handleNavigate;
exports.handleBack = handleBack;
exports.handleForward = handleForward;
exports.handleReload = handleReload;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const actions = __importStar(require("../../cdp/actions"));
const logger_1 = require("../../utils/logger");
/**
 * Helper: Get current URL from browser
 */
async function getCurrentUrl(browser) {
    try {
        const result = await browser.sendCommand('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
        return result.result?.value || 'unknown';
    }
    catch {
        return 'unknown';
    }
}
/**
 * Helper: Save last visited URL to file
 */
function saveLastUrl(outputDir, url) {
    try {
        const lastUrlPath = path.join(outputDir, 'last-url.txt');
        fs.writeFileSync(lastUrlPath, url, 'utf-8');
        logger_1.logger.debug(`💾 Saved last URL: ${url}`);
    }
    catch (error) {
        logger_1.logger.warn(`Failed to save last URL: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Helper: Load last visited URL from file
 */
function loadLastUrl(outputDir) {
    try {
        const lastUrlPath = path.join(outputDir, 'last-url.txt');
        if (fs.existsSync(lastUrlPath)) {
            const url = fs.readFileSync(lastUrlPath, 'utf-8').trim();
            logger_1.logger.debug(`📂 Loaded last URL: ${url}`);
            return url || null;
        }
    }
    catch (error) {
        logger_1.logger.warn(`Failed to load last URL: ${error instanceof Error ? error.message : String(error)}`);
    }
    return null;
}
/**
 * Helper: Wait for map to be ready for a specific URL
 */
async function waitForMapReady(context, expectedUrl, _timeout) {
    logger_1.logger.debug(`⏳ Waiting for map generation (URL: ${expectedUrl})...`);
    if (!context.mapManager) {
        logger_1.logger.warn('MapManager not available, skipping map generation');
        return;
    }
    // Check if map exists and has correct URL
    const mapStatus = await context.mapManager.getMapStatus(expectedUrl);
    if (!mapStatus.exists || mapStatus.url !== expectedUrl) {
        // Map doesn't exist or has wrong URL - generate new map
        logger_1.logger.debug(`🔨 Generating new map for: ${expectedUrl}`);
        await context.mapManager.generateMapSerially(context.browser, false);
        // Above await completes only when map generation is fully done
    }
    logger_1.logger.debug(`✅ Map ready for: ${expectedUrl}`);
}
/**
 * Handle navigate command
 */
async function handleNavigate(context, params) {
    const url = params.url;
    const result = await actions.navigate(context.browser, url);
    // Navigation always changes URL, wait for map
    logger_1.logger.info(`🔄 Navigating to: ${url}`);
    await waitForMapReady(context, url, 10000);
    // Save last visited URL
    saveLastUrl(context.outputDir, url);
    return result;
}
/**
 * Handle back command
 */
async function handleBack(context, _params) {
    const result = await actions.goBack(context.browser);
    // Get new URL after navigation
    const newUrl = await getCurrentUrl(context.browser);
    logger_1.logger.info(`🔄 Navigated back to: ${newUrl}`);
    await waitForMapReady(context, newUrl, 10000);
    // Save last visited URL
    if (newUrl !== 'unknown') {
        saveLastUrl(context.outputDir, newUrl);
    }
    return result;
}
/**
 * Handle forward command
 */
async function handleForward(context, _params) {
    const result = await actions.goForward(context.browser);
    // Get new URL after navigation
    const newUrl = await getCurrentUrl(context.browser);
    logger_1.logger.info(`🔄 Navigated forward to: ${newUrl}`);
    await waitForMapReady(context, newUrl, 10000);
    // Save last visited URL
    if (newUrl !== 'unknown') {
        saveLastUrl(context.outputDir, newUrl);
    }
    return result;
}
/**
 * Handle reload command
 */
async function handleReload(context, params) {
    const hard = params.hard;
    // Get current URL before reload
    const currentUrl = await getCurrentUrl(context.browser);
    const result = await actions.reload(context.browser, hard || false);
    // Reload stays on same URL, wait for map
    logger_1.logger.info(`🔄 Reloading page: ${currentUrl}`);
    await waitForMapReady(context, currentUrl, 10000);
    // Save last visited URL
    if (currentUrl !== 'unknown') {
        saveLastUrl(context.outputDir, currentUrl);
    }
    return result;
}
//# sourceMappingURL=navigation-handlers.js.map