/**
 * Interaction Map Manager for Browser Pilot Daemon
 * Handles automatic map generation, caching, and lifecycle management
 */

import { EventEmitter } from 'events';
import { ChromeBrowser } from '../cdp/browser';
import { getInteractionMapScript, InteractionElement } from '../cdp/map/generate-interaction-map';
import { InteractionMap } from '../cdp/map/query-map';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger, getLocalTimestamp } from '../utils/logger';
import { FS, TIMING } from '../constants';

/**
 * Map cache metadata for a single URL
 */
interface MapCacheEntry {
  url: string;
  timestamp: string;
  elementCount: number;
  mapFile: string;
}

/**
 * Map cache file structure
 */
interface MapCacheFile {
  version: string;
  maps: MapCacheEntry[];
}

/**
 * Map generation event data
 */
export interface MapGenerationEvent {
  url: string;
  timestamp: string;
  elementCount: number;
}

/**
 * Configuration constants for map management
 */
const MAP_CONFIG = {
  CACHE_MAX_AGE_MS: TIMING.MAP_CACHE_TTL,
  MAP_FILENAME: FS.INTERACTION_MAP_FILE,
  CACHE_FILENAME: FS.MAP_CACHE_FILE,
  MAP_FOLDER: FS.OUTPUT_DIR,
  CACHE_VERSION: '1.0.0',
  DEBOUNCE_MS: TIMING.NETWORK_IDLE_TIMEOUT,
  MAP_GENERATION_DELAY_MS: TIMING.ACTION_DELAY_NAVIGATION
} as const;

export class MapManager extends EventEmitter {
  private outputDir: string;
  private mapPath: string;
  private cachePath: string;
  private currentCache: MapCacheFile | null = null;
  private lastGenerationTime: number = 0;
  private generationDebounceTimer: NodeJS.Timeout | null = null;
  private isGenerating: boolean = false;
  private currentGenerationPromise: Promise<InteractionMap> | null = null;

  constructor(outputDir: string) {
    super();
    this.outputDir = outputDir;
    this.mapPath = join(outputDir, MAP_CONFIG.MAP_FILENAME);
    this.cachePath = join(outputDir, MAP_CONFIG.CACHE_FILENAME);

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Load existing cache
    this.currentCache = this.loadCache();
  }

  /**
   * Generate interaction map for current page
   */
  async generateMap(browser: ChromeBrowser, force: boolean = false): Promise<InteractionMap> {
    this.isGenerating = true;

    // Get current URL
    const urlResult = await browser.sendCommand<{ result: { value: string } }>('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    const url = urlResult.result?.value || 'unknown';

    // Emit generation start event
    this.emit('generation-start', { url });

    // Check if we should generate (unless forced)
    if (!force && !this.shouldGenerateMapForUrl(url)) {
      const cachedMap = this.loadMapFromFile();
      if (cachedMap && cachedMap.url === url && cachedMap.ready === true) {
        this.isGenerating = false;
        this.emit('generation-complete', {
          url: cachedMap.url,
          timestamp: cachedMap.timestamp,
          elementCount: cachedMap.statistics.total
        });
        return cachedMap;
      }
    }

    // Write placeholder map with ready: false immediately
    const placeholderMap: InteractionMap = {
      url,
      timestamp: getLocalTimestamp(),
      ready: false,
      viewport: { width: 0, height: 0 },
      elements: {},
      indexes: { byText: {}, byType: {}, inViewport: [] },
      statistics: { total: 0, byType: {}, duplicates: 0 }
    };
    this.saveMapToFile(placeholderMap);

    // Get viewport size
    const viewportResult = await browser.sendCommand<{
      layoutViewport: { clientWidth: number; clientHeight: number };
    }>('Page.getLayoutMetrics', {});
    const viewport = {
      width: viewportResult.layoutViewport.clientWidth,
      height: viewportResult.layoutViewport.clientHeight
    };

    // Execute script to find all interactive elements
    const script = getInteractionMapScript();

    interface RuntimeEvaluateResult {
      result?: {
        type?: string;
        value?: unknown;
        description?: string;
      };
      exceptionDetails?: {
        exception?: {
          description?: string;
        };
        text?: string;
      };
    }

    const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
      expression: script,
      returnByValue: true
    });

    // Check for script execution errors
    if (result.exceptionDetails) {
      const errorMsg = result.exceptionDetails.exception?.description ||
                      result.exceptionDetails.text ||
                      'Unknown script error';
      logger.error('Map generation script error:', errorMsg);
      throw new Error(`Failed to extract interactive elements: ${errorMsg}`);
    }

    if (!result.result || !result.result.value) {
      logger.error('Unexpected result structure:', JSON.stringify(result, null, 2));
      throw new Error('Failed to extract interactive elements: No value returned');
    }

    const elementsArray = result.result.value as InteractionElement[];

    // Generate statistics
    const byType: Record<string, number> = {};
    const textCounts: Record<string, number> = {};

    elementsArray.forEach(el => {
      byType[el.type] = (byType[el.type] || 0) + 1;
      if (el.text) {
        textCounts[el.text] = (textCounts[el.text] || 0) + 1;
      }
    });

    const duplicates = Object.values(textCounts).filter(count => count > 1).length;

    // Add indexed selectors for duplicates
    elementsArray.forEach(el => {
      if (el.text && textCounts[el.text] > 1 && el.selectors.byText) {
        const sameTextElements = elementsArray.filter(e => e.text === el.text);
        const index = sameTextElements.indexOf(el) + 1;
        el.selectors.byText = `(${el.selectors.byText})[${index}]`;
      }
    });

    // Convert array to key-value structure
    const elements: Record<string, InteractionElement> = {};
    const textIndex: Record<string, string[]> = {};
    const typeIndex: Record<string, string[]> = {};
    const inViewportIds: string[] = [];

    elementsArray.forEach(el => {
      // Add to elements map
      elements[el.id] = el;

      // Build text index
      if (el.text) {
        if (!textIndex[el.text]) {
          textIndex[el.text] = [];
        }
        textIndex[el.text].push(el.id);
      }

      // Build type index
      if (!typeIndex[el.type]) {
        typeIndex[el.type] = [];
      }
      typeIndex[el.type].push(el.id);

      // Build viewport index
      if (el.visibility.inViewport) {
        inViewportIds.push(el.id);
      }
    });

    const timestamp = getLocalTimestamp();

    // Build map object with all data collected
    const map: InteractionMap = {
      url,
      timestamp,
      ready: true, // All data collected, ready to write
      viewport,
      elements,
      indexes: {
        byText: textIndex,
        byType: typeIndex,
        inViewport: inViewportIds
      },
      statistics: {
        total: elementsArray.length,
        byType,
        duplicates
      }
    };

    try {
      // Save complete map to file in one write
      this.saveMapToFile(map);

      // Update cache metadata
      this.updateCacheEntry(url, timestamp, map.statistics.total);

      // Update last generation time
      this.lastGenerationTime = Date.now();

      // Emit generation complete event
      this.emit('generation-complete', {
        url: map.url,
        timestamp: map.timestamp,
        elementCount: map.statistics.total
      });

      return map;
    } catch (error) {
      this.emit('generation-error', error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Generate map with lock to prevent concurrent executions
   * Returns a promise that resolves when map generation is complete
   */
  async generateMapSerially(browser: ChromeBrowser, force: boolean = false): Promise<void> {
    // If already generating and not forced, return existing promise
    if (this.currentGenerationPromise && !force) {
      logger.debug('Map generation already in progress, waiting for completion...');
      await this.currentGenerationPromise;
      return;
    }

    // Clear existing debounce timer (legacy support)
    if (this.generationDebounceTimer) {
      logger.debug(`Canceling previous map generation timer`);
      clearTimeout(this.generationDebounceTimer);
    }

    // Generate with lock to prevent concurrent execution
    try {
      logger.debug('Generating map with lock...');
      this.currentGenerationPromise = this.generateMap(browser, force);
      await this.currentGenerationPromise;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Map generation failed: ${errorMessage}`);
      this.emit('generation-error', error);
      throw error;
    } finally {
      this.currentGenerationPromise = null;
    }
  }

  /**
   * Check if map should be generated for a URL
   */
  private shouldGenerateMapForUrl(url: string): boolean {
    if (!this.currentCache) {
      return true;
    }

    // Find cache entry for this URL
    const entry = this.currentCache.maps.find(m => m.url === url);

    if (!entry) {
      return true;
    }

    // Check if cache is still valid
    const cacheAge = Date.now() - new Date(entry.timestamp).getTime();
    return cacheAge > MAP_CONFIG.CACHE_MAX_AGE_MS;
  }

  /**
   * Check if cached map is valid for a URL
   */
  isCacheValid(url: string): boolean {
    return !this.shouldGenerateMapForUrl(url);
  }

  /**
   * Get map status for a URL
   */
  getMapStatus(url: string): {
    exists: boolean;
    url: string | null;
    timestamp: string | null;
    elementCount: number;
    cacheValid: boolean;
  } {
    const mapExists = existsSync(this.mapPath);

    if (!mapExists || !this.currentCache) {
      return {
        exists: false,
        url: null,
        timestamp: null,
        elementCount: 0,
        cacheValid: false
      };
    }

    const entry = this.currentCache.maps.find(m => m.url === url);

    if (!entry) {
      return {
        exists: mapExists,
        url: null,
        timestamp: null,
        elementCount: 0,
        cacheValid: false
      };
    }

    return {
      exists: true,
      url: entry.url,
      timestamp: entry.timestamp,
      elementCount: entry.elementCount,
      cacheValid: this.isCacheValid(url)
    };
  }

  /**
   * Load map cache from file
   */
  private loadCache(): MapCacheFile {
    if (!existsSync(this.cachePath)) {
      return {
        version: MAP_CONFIG.CACHE_VERSION,
        maps: []
      };
    }

    try {
      const data = readFileSync(this.cachePath, 'utf-8');
      const parsed = JSON.parse(data) as unknown;

      // Type guard to validate cache structure
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'version' in parsed &&
        'maps' in parsed &&
        Array.isArray((parsed as { maps: unknown }).maps)
      ) {
        return parsed as MapCacheFile;
      }

      // Invalid structure, return empty cache
      return {
        version: MAP_CONFIG.CACHE_VERSION,
        maps: []
      };
    } catch (_error: unknown) {
      logger.warn('Failed to load map cache, starting fresh');
      return {
        version: MAP_CONFIG.CACHE_VERSION,
        maps: []
      };
    }
  }

  /**
   * Save map cache to file
   */
  private saveCache(cache: MapCacheFile): void {
    try {
      writeFileSync(this.cachePath, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to save map cache: ${errorMessage}`);
    }
  }

  /**
   * Update cache entry for a URL
   */
  private updateCacheEntry(url: string, timestamp: string, elementCount: number): void {
    if (!this.currentCache) {
      this.currentCache = this.loadCache();
    }

    // Remove old entry for this URL
    this.currentCache.maps = this.currentCache.maps.filter(m => m.url !== url);

    // Add new entry
    this.currentCache.maps.push({
      url,
      timestamp,
      elementCount,
      mapFile: MAP_CONFIG.MAP_FILENAME
    });

    // Save updated cache
    this.saveCache(this.currentCache);
  }

  /**
   * Load map from file
   */
  private loadMapFromFile(): InteractionMap | null {
    if (!existsSync(this.mapPath)) {
      return null;
    }

    try {
      const data = readFileSync(this.mapPath, 'utf-8');
      return JSON.parse(data) as InteractionMap;
    } catch (_error: unknown) {
      return null;
    }
  }

  /**
   * Save map to file
   */
  private saveMapToFile(map: InteractionMap): void {
    try {
      writeFileSync(this.mapPath, JSON.stringify(map, null, 2), 'utf-8');
    } catch (error: unknown) {
      throw new Error(`Failed to save map file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Wait for ongoing map generation to complete
   * @param timeout Maximum wait time in milliseconds (default: 10000)
   * @returns true if generation completed successfully, false if timeout
   */
  async waitForGeneration(timeout: number = TIMING.WAIT_FOR_LOAD_STATE): Promise<boolean> {
    if (!this.isGenerating && !this.currentGenerationPromise) {
      return true; // Already ready
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        logger.warn('Map generation timeout');
        this.removeListener('generation-complete', onComplete);
        this.removeListener('generation-error', onError);
        resolve(false);
      }, timeout);

      const onComplete = () => {
        clearTimeout(timer);
        this.removeListener('generation-error', onError);
        resolve(true);
      };

      const onError = () => {
        clearTimeout(timer);
        this.removeListener('generation-complete', onComplete);
        resolve(false);
      };

      this.once('generation-complete', onComplete);
      this.once('generation-error', onError);
    });
  }

  /**
   * Set ready flag in existing map file
   * Called by action handlers to invalidate map before action execution
   * @param ready Ready state to set (typically false to invalidate)
   */
  setMapReady(ready: boolean): void {
    try {
      const map = this.loadMapFromFile();
      if (!map) {
        return; // No map to update
      }

      map.ready = ready;
      this.saveMapToFile(map);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to update map ready flag: ${errorMessage}`);
    }
  }
}
