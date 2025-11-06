"use strict";
/**
 * Interaction Map command handlers for Browser Pilot Daemon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleQueryMap = handleQueryMap;
exports.handleGenerateMap = handleGenerateMap;
exports.handleGetMapStatus = handleGetMapStatus;
const path_1 = require("path");
const query_map_1 = require("../../cdp/map/query-map");
const helpers_1 = require("../../cdp/actions/helpers");
const logger_1 = require("../../utils/logger");
/**
 * Handle query-map command with 3-stage fallback logic
 */
async function handleQueryMap(context, params) {
    const queryParams = params;
    // Load map
    const mapPath = (0, path_1.join)(context.outputDir, helpers_1.SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    let currentMap = (0, query_map_1.loadMap)(mapPath);
    // Handle listTypes request
    if (queryParams.listTypes) {
        const types = (0, query_map_1.listTypes)(currentMap);
        return {
            count: Object.keys(types).length,
            results: [],
            types,
            total: currentMap.statistics.total
        };
    }
    // Handle listTexts request
    if (queryParams.listTexts) {
        const texts = (0, query_map_1.listTexts)(currentMap, {
            type: queryParams.type,
            limit: queryParams.limit,
            offset: queryParams.offset
        });
        return {
            count: texts.length,
            results: [],
            texts,
            total: Object.keys(currentMap.indexes.byText).length
        };
    }
    // 3-stage fallback logic (max 3 attempts)
    let results = [];
    let attemptCount = 0;
    const maxAttempts = 3;
    const originalType = queryParams.type;
    while (results.length === 0 && attemptCount < maxAttempts) {
        attemptCount++;
        // Stage 1: Try with type (with alias expansion)
        if (queryParams.type && !queryParams.tag) {
            logger_1.logger.debug(`[Attempt ${attemptCount}] Trying type-based search: "${queryParams.type}"`);
            results = (0, query_map_1.queryMap)(currentMap, queryParams);
            if (results.length > 0) {
                logger_1.logger.debug(`✓ Found ${results.length} element(s) with type search`);
                break;
            }
            // Stage 2: Fallback to tag-based search
            // Extract base tag from type (e.g., "input-search" → "input")
            if (originalType) {
                const baseTag = originalType.split('-')[0];
                logger_1.logger.debug(`[Attempt ${attemptCount}] Type search failed, trying tag-based search: "${baseTag}"`);
                const tagParams = { ...queryParams, type: undefined, tag: baseTag };
                results = (0, query_map_1.queryMap)(currentMap, tagParams);
                if (results.length > 0) {
                    logger_1.logger.debug(`✓ Found ${results.length} element(s) with tag search`);
                    break;
                }
            }
        }
        else {
            // No type specified, just query
            results = (0, query_map_1.queryMap)(currentMap, queryParams);
            if (results.length > 0) {
                break;
            }
        }
        // Stage 3: Regenerate map and retry
        if (results.length === 0 && context.mapManager && attemptCount < maxAttempts) {
            logger_1.logger.warn(`[Attempt ${attemptCount}] No elements found, regenerating map and retrying...`);
            await context.mapManager.generateMap(context.browser, true);
            logger_1.logger.debug('🔄 Map regenerated, reloading and retrying...');
            // Wait for map to be ready before continuing
            currentMap = (0, query_map_1.loadMap)(mapPath, true, 10000);
        }
    }
    // Calculate total count only once at the end
    const allResults = (0, query_map_1.queryMap)(currentMap, { ...queryParams, limit: 0 });
    // Final check: no results found after all attempts
    if (results.length === 0 && !queryParams.listTypes && !queryParams.listTexts) {
        // Build detailed error message with edge case handling
        let errorMsg = 'No elements found matching query criteria after ' + attemptCount + ' attempt(s).\n';
        errorMsg += '\n💡 Troubleshooting tips:\n';
        if (queryParams.text) {
            errorMsg += `- Try searching without quotes: --text ${queryParams.text.replace(/"/g, '')}\n`;
            errorMsg += `- Try partial text: --text "${queryParams.text.substring(0, Math.min(10, queryParams.text.length))}"\n`;
            errorMsg += `- List all texts: node .browser-pilot/bp query --list-texts\n`;
        }
        if (queryParams.type) {
            const baseTag = queryParams.type.split('-')[0];
            errorMsg += `- Try tag-based search: --tag ${baseTag}\n`;
            errorMsg += `- List available types: node .browser-pilot/bp query --list-types\n`;
            errorMsg += `- Remove type filter and search by text only\n`;
        }
        if (queryParams.tag) {
            errorMsg += `- Try type-based search: --type ${queryParams.tag}\n`;
            errorMsg += `- List available types: node .browser-pilot/bp query --list-types\n`;
        }
        if (!queryParams.text && !queryParams.type && !queryParams.tag) {
            errorMsg += `- Specify search criteria: --text, --type, or --tag\n`;
            errorMsg += `- List all elements: node .browser-pilot/bp query --list-types\n`;
        }
        errorMsg += `- Force map regeneration: node .browser-pilot/bp regen-map\n`;
        errorMsg += `- Check if element is in viewport: --viewport-only (or remove if used)\n`;
        throw new Error(errorMsg);
    }
    // Return all results in MapQueryResult format
    return {
        count: results.length,
        results: results.map(result => ({
            selector: result.selector,
            alternatives: result.alternatives,
            element: {
                tag: result.element.tag,
                text: result.element.text,
                position: result.element.position
            }
        })),
        total: allResults.length
    };
}
/**
 * Handle generate-map command
 */
async function handleGenerateMap(context, params) {
    if (!context.mapManager) {
        throw new Error('MapManager not initialized');
    }
    const generateParams = params;
    const force = generateParams.force ?? false;
    // Get current URL before generation
    const urlResult = await context.browser.sendCommand('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
    });
    const currentUrl = urlResult.result?.value || 'unknown';
    // Check if we can use cache
    const cached = !force && context.mapManager.isCacheValid(currentUrl);
    // Generate map
    const map = await context.mapManager.generateMap(context.browser, force);
    return {
        success: true,
        url: map.url,
        elementCount: map.statistics.total,
        timestamp: map.timestamp,
        cached
    };
}
/**
 * Handle get-map-status command
 */
async function handleGetMapStatus(context, _params) {
    if (!context.mapManager) {
        throw new Error('MapManager not initialized');
    }
    // Get current URL
    const urlResult = await context.browser.sendCommand('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
    });
    const currentUrl = urlResult.result?.value || 'unknown';
    // Get map status
    return context.mapManager.getMapStatus(currentUrl);
}
//# sourceMappingURL=map-handlers.js.map