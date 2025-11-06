/**
 * Interaction Map command handlers for Browser Pilot Daemon
 */

import { join } from 'path';
import { HandlerContext } from './navigation-handlers';
import { loadMap, queryMap, listTypes, listTexts } from '../../cdp/map/query-map';
import { SELECTOR_RETRY_CONFIG } from '../../cdp/actions/helpers';
import { logger } from '../../utils/logger';
import {
  MapQueryParams,
  MapQueryResult,
  MapGenerateParams,
  MapGenerateResult,
  MapStatusResult
} from '../protocol';

/**
 * Handle query-map command
 */
export async function handleQueryMap(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<MapQueryResult> {
  const queryParams = params as MapQueryParams;

  // Load map
  const mapPath = join(context.outputDir, SELECTOR_RETRY_CONFIG.MAP_FILENAME);
  const map = loadMap(mapPath);

  // Handle listTypes request
  if (queryParams.listTypes) {
    const types = listTypes(map);
    return {
      count: Object.keys(types).length,
      results: [],
      types,
      total: map.statistics.total
    };
  }

  // Handle listTexts request
  if (queryParams.listTexts) {
    const texts = listTexts(map, {
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
  let allResults = queryMap(currentMap, { ...queryParams, limit: 0 }); // Get all for total count
  let results = queryMap(currentMap, queryParams); // Get paginated results

  // Retry with map regeneration if no results found
  if (results.length === 0 && context.mapManager) {
    logger.warn('⚠️  No elements found in map, regenerating and retrying...');

    // Regenerate map
    await context.mapManager.generateMap(context.browser, true);
    logger.debug('🔄 Map regenerated, retrying query...');

    // Reload map and retry query
    currentMap = loadMap(mapPath);
    allResults = queryMap(currentMap, { ...queryParams, limit: 0 });
    results = queryMap(currentMap, queryParams);

    if (results.length > 0) {
      logger.debug(`✓ Found ${results.length} element(s) after map regeneration`);
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
export async function handleGenerateMap(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<MapGenerateResult> {
  if (!context.mapManager) {
    throw new Error('MapManager not initialized');
  }

  const generateParams = params as MapGenerateParams;
  const force = generateParams.force ?? false;

  // Get current URL before generation
  const urlResult = await context.browser.sendCommand<{ result: { value: string } }>('Runtime.evaluate', {
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
export async function handleGetMapStatus(
  context: HandlerContext,
  _params: Record<string, unknown>
): Promise<MapStatusResult> {
  if (!context.mapManager) {
    throw new Error('MapManager not initialized');
  }

  // Get current URL
  const urlResult = await context.browser.sendCommand<{ result: { value: string } }>('Runtime.evaluate', {
    expression: 'window.location.href',
    returnByValue: true
  });
  const currentUrl = urlResult.result?.value || 'unknown';

  // Get map status
  return context.mapManager.getMapStatus(currentUrl);
}
