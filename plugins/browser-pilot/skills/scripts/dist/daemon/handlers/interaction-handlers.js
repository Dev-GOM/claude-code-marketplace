"use strict";
/**
 * Interaction command handlers for Browser Pilot Daemon
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
exports.handleClick = handleClick;
exports.handleFill = handleFill;
exports.handleHover = handleHover;
exports.handlePress = handlePress;
exports.handleType = handleType;
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
 * Helper: Execute action with automatic state tracking
 */
async function executeActionWithTracking(browser, actionFn) {
    // Capture state before action
    const urlBefore = await getCurrentUrl(browser);
    const pageChangeTracker = {
        urlBefore,
        urlAfter: null,
        navigationDetected: false,
        domChangeDetected: false,
        networkActive: false
    };
    try {
        // Execute action
        const result = await actionFn();
        // Capture state after action
        const urlAfter = await getCurrentUrl(browser);
        pageChangeTracker.urlAfter = urlAfter;
        pageChangeTracker.navigationDetected = urlBefore !== urlAfter;
        return { result, tracker: pageChangeTracker };
    }
    finally {
        // Cleanup if needed
    }
}
/**
 * Helper: Find selector with automatic map regeneration fallback
 * Queries interaction map for element, regenerates map if not found
 */
async function findSelectorWithRetry(context, params) {
    const { findSelector } = await Promise.resolve().then(() => __importStar(require('../../cdp/map/query-map')));
    const { SELECTOR_RETRY_CONFIG } = await Promise.resolve().then(() => __importStar(require('../../cdp/actions/helpers')));
    const { getOutputDir } = await Promise.resolve().then(() => __importStar(require('../../cdp/config')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    logger_1.logger.debug(`🔍 Smart Mode: querying map at ${mapPath} for text="${params.text}"`);
    let foundSelector = findSelector(mapPath, {
        text: params.text,
        index: params.index,
        type: params.type,
        viewportOnly: params.viewportOnly
    });
    // Fallback: regenerate map if element not found
    if (!foundSelector) {
        logger_1.logger.warn(`⚠️  Element not found in map, regenerating map and retrying...`);
        if (context.mapManager) {
            await context.mapManager.generateMap(context.browser, true);
            logger_1.logger.debug(`🔄 Map regenerated, retrying selector search...`);
            foundSelector = findSelector(mapPath, {
                text: params.text,
                index: params.index,
                type: params.type,
                viewportOnly: params.viewportOnly
            });
        }
        if (!foundSelector) {
            logger_1.logger.error(`❌ Element still not found after map regeneration: "${params.text}"`);
            throw new Error(`Element not found in map: "${params.text}"`);
        }
        logger_1.logger.debug(`✓ Found selector after map regeneration: ${foundSelector}`);
    }
    else {
        logger_1.logger.debug(`✓ Found selector: ${foundSelector}`);
    }
    return foundSelector;
}
/**
 * Handle click command with smart mode support
 */
async function handleClick(context, params) {
    let selector = params.selector;
    // Smart Mode: if text provided, query map
    if (params.text && !selector) {
        selector = await findSelectorWithRetry(context, {
            text: params.text,
            index: params.index,
            type: params.type,
            viewportOnly: params.viewportOnly
        });
    }
    if (!selector) {
        throw new Error('No selector provided');
    }
    // Execute with tracking
    const { result, tracker } = await executeActionWithTracking(context.browser, () => actions.click(context.browser, selector));
    // Always regenerate map after click (DOM may have changed, URL may or may not change)
    logger_1.logger.debug(`🔄 Regenerating map after click (URL: ${tracker.urlBefore} → ${tracker.urlAfter})`);
    if (context.mapManager) {
        await context.mapManager.generateMapDebounced(context.browser, false);
    }
    return result;
}
/**
 * Handle fill command with smart mode support
 */
async function handleFill(context, params) {
    let selector = params.selector;
    const value = params.value;
    // Smart Mode: if text provided, query map
    if (params.text && !selector) {
        selector = await findSelectorWithRetry(context, {
            text: params.text,
            index: params.index,
            type: params.type,
            viewportOnly: params.viewportOnly
        });
    }
    if (!selector) {
        throw new Error('No selector provided');
    }
    // Execute with tracking
    const { result, tracker } = await executeActionWithTracking(context.browser, () => actions.fill(context.browser, selector, value));
    // Always regenerate map after fill (DOM may have changed, URL may or may not change)
    logger_1.logger.debug(`🔄 Regenerating map after fill (URL: ${tracker.urlBefore} → ${tracker.urlAfter})`);
    if (context.mapManager) {
        await context.mapManager.generateMapDebounced(context.browser, false);
    }
    return result;
}
/**
 * Handle hover command
 */
async function handleHover(context, params) {
    const selector = params.selector;
    return actions.hover(context.browser, selector);
}
/**
 * Handle press (keyboard key) command
 */
async function handlePress(context, params) {
    const key = params.key;
    return actions.pressKey(context.browser, key);
}
/**
 * Handle type (text input) command
 */
async function handleType(context, params) {
    const text = params.text;
    const delay = params.delay;
    return actions.typeText(context.browser, text, delay);
}
//# sourceMappingURL=interaction-handlers.js.map