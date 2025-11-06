/**
 * Query interaction map to find elements by various criteria
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { InteractionElement } from './generate-interaction-map';
import { SELECTOR_RETRY_CONFIG } from '../actions/helpers';
import { getOutputDir } from '../config';
import { CDP, TIMING } from '../../constants';
import { logger } from '../../utils/logger';

// Re-export for protocol usage
export type { InteractionElement };

export interface InteractionMap {
  url: string;
  timestamp: string;
  ready?: boolean; // Map is fully generated and ready for use
  viewport: { width: number; height: number };
  elements: Record<string, InteractionElement>;
  indexes: {
    byText: Record<string, string[]>;
    byType: Record<string, string[]>;
    inViewport: string[];
  };
  statistics: {
    total: number;
    byType: Record<string, number>;
    duplicates: number;
  };
}

export interface QueryOptions {
  text?: string;          // Search by text content
  type?: string;          // Filter by element type (supports aliases: "input" → "input-*")
  tag?: string;           // Filter by HTML tag (e.g., "input", "button")
  index?: number;         // Select nth match (1-based)
  viewportOnly?: boolean; // Only visible elements
  id?: string;            // Direct ID lookup
  listTypes?: boolean;    // List all element types with counts
  listTexts?: boolean;    // List all text contents
  limit?: number;         // Maximum results to return (default: 20)
  offset?: number;        // Number of results to skip (default: 0)
  verbose?: boolean;      // Include detailed information
}

export interface QueryResult {
  element: InteractionElement;
  selector: string;       // Best selector to use
  alternatives: string[]; // Alternative selectors
}

/**
 * Load interaction map from file with ready flag check
 * @param mapPath Optional path to map file
 * @param waitForReady If true, poll until map is ready (default: false)
 * @param timeout Maximum wait time in milliseconds (default: 10000)
 */
export function loadMap(
  mapPath?: string,
  waitForReady: boolean = false,
  timeout: number = 10000
): InteractionMap {
  const defaultPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
  const filePath = mapPath || defaultPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Map file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const map = JSON.parse(content) as InteractionMap;

  // If not waiting for ready or already ready, return immediately
  if (!waitForReady || map.ready === true) {
    return map;
  }

  // Poll until ready or timeout
  const startTime = Date.now();
  const pollInterval = TIMING.POLLING_INTERVAL_FAST;

  while (Date.now() - startTime < timeout) {
    // Sleep using platform-appropriate command
    try {
      if (process.platform === 'win32') {
        execSync(`ping -n 1 -w ${pollInterval} ${CDP.LOCALHOST} >nul`, { stdio: 'ignore' });
      } else {
        execSync(`sleep ${pollInterval / TIMING.ACTION_DELAY_NAVIGATION}`, { stdio: 'ignore' });
      }
    } catch {
      // Ignore errors, just continue polling
    }

    // Re-read map
    if (!fs.existsSync(filePath)) {
      throw new Error(`Map file disappeared during polling: ${filePath}`);
    }

    const newContent = fs.readFileSync(filePath, 'utf-8');
    const newMap = JSON.parse(newContent) as InteractionMap;

    if (newMap.ready === true) {
      return newMap;
    }
  }

  throw new Error(`Map did not become ready within ${timeout}ms`);
}

/**
 * Select best selector for an element
 * Priority: byId > byText(indexed) > byCSS > byRole > byAriaLabel
 */
export function selectBestSelector(element: InteractionElement): string {
  const { selectors } = element;

  if (selectors.byId) {
    return selectors.byId;
  }

  if (selectors.byText) {
    return selectors.byText;
  }

  if (selectors.byCSS && selectors.byCSS !== element.tag) {
    // Skip generic tag-only selectors
    return selectors.byCSS;
  }

  if (selectors.byRole) {
    return selectors.byRole;
  }

  if (selectors.byAriaLabel) {
    return selectors.byAriaLabel;
  }

  // Fallback to CSS
  return selectors.byCSS || element.tag;
}

/**
 * Get all alternative selectors for an element
 */
export function getAlternativeSelectors(element: InteractionElement): string[] {
  const alternatives: string[] = [];
  const { selectors } = element;

  if (selectors.byId) alternatives.push(selectors.byId);
  if (selectors.byText) alternatives.push(selectors.byText);
  if (selectors.byCSS) alternatives.push(selectors.byCSS);
  if (selectors.byRole) alternatives.push(selectors.byRole);
  if (selectors.byAriaLabel) alternatives.push(selectors.byAriaLabel);

  return alternatives;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Expand type alias to include all matching types
 * Examples:
 * - "input" → ["input", "input-text", "input-search", "input-password", ...]
 * - "button" → ["button", "button-submit", "button-reset", ...]
 * - "input-search" → ["input-search"] (exact match, no expansion)
 */
export function expandTypeAlias(type: string, availableTypes: string[]): string[] {
  // If type contains a hyphen, it's a specific type (no expansion)
  if (type.includes('-')) {
    return [type];
  }

  // Escape regex special characters to prevent regex injection
  const escapedType = escapeRegex(type);

  // Expand to include all types starting with the alias
  const pattern = new RegExp(`^${escapedType}(-.*)?$`);
  const matches = availableTypes.filter(t => pattern.test(t));

  // If no matches found, return original type
  return matches.length > 0 ? matches : [type];
}

/**
 * Query map for elements matching criteria
 */
export function queryMap(map: InteractionMap, options: QueryOptions): QueryResult[] {
  let candidateIds: string[] = [];

  // Direct ID lookup
  if (options.id) {
    const element = map.elements[options.id];
    if (!element) {
      return [];
    }
    return [{
      element,
      selector: selectBestSelector(element),
      alternatives: getAlternativeSelectors(element)
    }];
  }

  // Text-based search
  if (options.text) {
    candidateIds = map.indexes.byText[options.text] || [];
    if (candidateIds.length === 0) {
      // Fuzzy search: find texts containing the query
      const matchingTexts = Object.keys(map.indexes.byText).filter(text =>
        options.text && text.toLowerCase().includes(options.text.toLowerCase())
      );
      matchingTexts.forEach(text => {
        candidateIds.push(...map.indexes.byText[text]);
      });
    }
  } else {
    // No text filter: start with all elements
    candidateIds = Object.keys(map.elements);
  }

  // Type filter (with alias expansion)
  if (options.type) {
    const availableTypes = Object.keys(map.indexes.byType);
    const expandedTypes = expandTypeAlias(options.type, availableTypes);

    const typeIds = expandedTypes.flatMap(type => map.indexes.byType[type] || []);

    candidateIds = candidateIds.filter(id => typeIds.includes(id));

    // Log type expansion if expansion occurred
    if (expandedTypes.length > 1) {
      logger.debug(`Type alias "${options.type}" expanded to: ${expandedTypes.join(', ')}`);
    }
  }

  // Tag filter (HTML tag name)
  if (options.tag) {
    const tagLower = options.tag.toLowerCase();
    candidateIds = candidateIds.filter(id => {
      const element = map.elements[id];
      return element && element.tag.toLowerCase() === tagLower;
    });
  }

  // Viewport filter
  if (options.viewportOnly) {
    const viewportIds = map.indexes.inViewport;
    candidateIds = candidateIds.filter(id => viewportIds.includes(id));
  }

  // Remove duplicates
  candidateIds = Array.from(new Set(candidateIds));

  // Convert IDs to QueryResults
  const results: QueryResult[] = candidateIds.map(id => {
    const element = map.elements[id];
    return {
      element,
      selector: selectBestSelector(element),
      alternatives: getAlternativeSelectors(element)
    };
  });

  // Apply pagination (limit/offset)
  const limit = options.limit !== undefined ? options.limit : 20;
  const offset = options.offset || 0;

  // Index selection (takes priority over pagination)
  if (options.index !== undefined && options.index > 0) {
    const selected = results[options.index - 1];
    return selected ? [selected] : [];
  }

  // Apply offset and limit
  if (limit === 0) {
    // 0 means unlimited
    return results.slice(offset);
  }
  return results.slice(offset, offset + limit);
}

/**
 * Find element and return best selector
 * @param mapPath Path to map file
 * @param options Query options
 * @param waitForReady If true, wait for map to be ready before querying (default: true)
 * @param timeout Maximum wait time in milliseconds (default: 10000)
 */
export function findSelector(
  mapPath: string | undefined,
  options: QueryOptions,
  waitForReady: boolean = true,
  timeout: number = 10000
): string | null {
  try {
    const map = loadMap(mapPath, waitForReady, timeout);
    const results = queryMap(map, options);

    if (results.length === 0) {
      return null;
    }

    // Return the best selector of the first result
    return results[0].selector;
  } catch (error: unknown) {
    logger.error('Error querying map', error);
    return null;
  }
}

/**
 * Find element with fallback to alternatives
 */
export function findSelectorWithFallback(
  mapPath: string | undefined,
  options: QueryOptions
): { selector: string; alternatives: string[] } | null {
  try {
    const map = loadMap(mapPath);
    const results = queryMap(map, options);

    if (results.length === 0) {
      return null;
    }

    return {
      selector: results[0].selector,
      alternatives: results[0].alternatives
    };
  } catch (error: unknown) {
    logger.error('Error querying map', error);
    return null;
  }
}

/**
 * List all element types with counts from map
 */
export function listTypes(map: InteractionMap): Record<string, number> {
  return map.statistics.byType;
}

/**
 * List all text contents with their types from map
 */
export function listTexts(
  map: InteractionMap,
  options?: { type?: string; limit?: number; offset?: number }
): Array<{ text: string; type: string; count: number }> {
  const limit = options?.limit !== undefined ? options.limit : 20;
  const offset = options?.offset || 0;
  const typeFilter = options?.type;

  const textList: Array<{ text: string; type: string; count: number }> = [];

  // Iterate through text index
  for (const [text, elementIds] of Object.entries(map.indexes.byText)) {
    // Get first element to determine type
    const firstElement = map.elements[elementIds[0]];
    if (!firstElement) continue;

    // Apply type filter if specified
    if (typeFilter && firstElement.type !== typeFilter) {
      continue;
    }

    textList.push({
      text,
      type: firstElement.type,
      count: elementIds.length
    });
  }

  // Apply pagination
  if (limit === 0) {
    return textList.slice(offset);
  }
  return textList.slice(offset, offset + limit);
}
