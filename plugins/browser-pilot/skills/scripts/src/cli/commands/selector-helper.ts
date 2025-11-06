/**
 * Selector helper utilities with automatic map regeneration fallback
 */

import { findSelector } from '../../cdp/map/query-map';
import { SELECTOR_RETRY_CONFIG } from '../../cdp/actions/helpers';
import { getOutputDir } from '../../cdp/config';
import { executeViaDaemon } from '../daemon-helper';
import * as path from 'path';

export interface SelectorQueryParams {
  text: string;
  index?: number;
  type?: string;
  viewportOnly?: boolean;
}

/**
 * Find selector with automatic map regeneration fallback
 *
 * This function queries the interaction map for an element matching the given criteria.
 * If the element is not found, it automatically regenerates the map and retries once.
 *
 * @param params - Selector query parameters (text, index, type, viewportOnly)
 * @param elementType - Type of element being searched (for logging, e.g., "element", "input field")
 * @returns Selector string or null if not found after retry
 */
export async function findSelectorWithRetry(
  params: SelectorQueryParams,
  elementType: string = 'element'
): Promise<string | null> {
  const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);

  // First attempt
  let selector = findSelector(mapPath, params);

  // Fallback: regenerate map if element not found
  if (!selector) {
    console.log(`⚠️  ${elementType.charAt(0).toUpperCase() + elementType.slice(1)} not found in map, regenerating map and retrying...`);

    try {
      // Execute generate-map via daemon (force: true to regenerate)
      const regenResponse = await executeViaDaemon('generate-map', { force: true }, { verbose: false });

      if (!regenResponse.success) {
        console.error(`✗ Failed to regenerate map: ${regenResponse.error}`);
        return null;
      }

      console.log(`🔄 Map regenerated, retrying selector search...`);

      // Allow file system to flush (especially important on Windows)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Retry finding selector
      selector = findSelector(mapPath, params);

      if (!selector) {
        console.error(`❌ ${elementType.charAt(0).toUpperCase() + elementType.slice(1)} still not found after map regeneration`);
        return null;
      }

      console.log(`✓ Found ${elementType} after map regeneration: ${selector}`);
    } catch (error) {
      console.error(`✗ Error during map regeneration: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  return selector;
}
