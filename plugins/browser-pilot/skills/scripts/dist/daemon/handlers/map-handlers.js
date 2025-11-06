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
 * Handle query-map command
 */
async function handleQueryMap(context, params) {
    const queryParams = params;
    // Load map
    const mapPath = (0, path_1.join)(context.outputDir, helpers_1.SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    const map = (0, query_map_1.loadMap)(mapPath);
    // Handle listTypes request
    if (queryParams.listTypes) {
        const types = (0, query_map_1.listTypes)(map);
        return {
            count: Object.keys(types).length,
            results: [],
            types,
            total: map.statistics.total
        };
    }
    // Handle listTexts request
    if (queryParams.listTexts) {
        const texts = (0, query_map_1.listTexts)(map, {
            type: queryParams.type,
            limit: queryParams.limit,
            offset: queryParams.offset
        });
        return {
            count: texts.length,
            results: [],
            texts,
            total: Object.keys(map.indexes.byText).length
        };
    }
    // Regular query
    let currentMap = map;
    let allResults = (0, query_map_1.queryMap)(currentMap, { ...queryParams, limit: 0 }); // Get all for total count
    let results = (0, query_map_1.queryMap)(currentMap, queryParams); // Get paginated results
    // Retry with map regeneration if no results found
    if (results.length === 0 && context.mapManager) {
        logger_1.logger.warn('⚠️  No elements found in map, regenerating and retrying...');
        // Regenerate map
        await context.mapManager.generateMap(context.browser, true);
        logger_1.logger.debug('🔄 Map regenerated, retrying query...');
        // Reload map and retry query
        currentMap = (0, query_map_1.loadMap)(mapPath);
        allResults = (0, query_map_1.queryMap)(currentMap, { ...queryParams, limit: 0 });
        results = (0, query_map_1.queryMap)(currentMap, queryParams);
        if (results.length > 0) {
            logger_1.logger.debug(`✓ Found ${results.length} element(s) after map regeneration`);
        }
    }
    if (results.length === 0 && !queryParams.listTypes && !queryParams.listTexts) {
        throw new Error('No elements found matching query criteria');
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