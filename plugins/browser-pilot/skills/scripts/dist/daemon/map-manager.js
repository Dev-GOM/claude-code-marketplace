"use strict";
/**
 * Interaction Map Manager for Browser Pilot Daemon
 * Handles automatic map generation, caching, and lifecycle management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapManager = void 0;
const events_1 = require("events");
const generate_interaction_map_1 = require("../cdp/map/generate-interaction-map");
const fs_1 = require("fs");
const path_1 = require("path");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
/**
 * Configuration constants for map management
 */
const MAP_CONFIG = {
    CACHE_MAX_AGE_MS: constants_1.TIMING.MAP_CACHE_TTL,
    MAP_FILENAME: constants_1.FS.INTERACTION_MAP_FILE,
    CACHE_FILENAME: constants_1.FS.MAP_CACHE_FILE,
    MAP_FOLDER: constants_1.FS.OUTPUT_DIR,
    CACHE_VERSION: '1.0.0',
    DEBOUNCE_MS: constants_1.TIMING.NETWORK_IDLE_TIMEOUT,
    MAP_GENERATION_DELAY_MS: constants_1.TIMING.ACTION_DELAY_NAVIGATION
};
class MapManager extends events_1.EventEmitter {
    outputDir;
    mapPath;
    cachePath;
    currentCache = null;
    lastGenerationTime = 0;
    generationDebounceTimer = null;
    isGenerating = false;
    currentGenerationPromise = null;
    constructor(outputDir) {
        super();
        this.outputDir = outputDir;
        this.mapPath = (0, path_1.join)(outputDir, MAP_CONFIG.MAP_FILENAME);
        this.cachePath = (0, path_1.join)(outputDir, MAP_CONFIG.CACHE_FILENAME);
        // Ensure output directory exists
        if (!(0, fs_1.existsSync)(outputDir)) {
            (0, fs_1.mkdirSync)(outputDir, { recursive: true });
        }
        // Load existing cache
        this.currentCache = this.loadCache();
    }
    /**
     * Generate interaction map for current page
     */
    async generateMap(browser, force = false) {
        this.isGenerating = true;
        // Get current URL
        const urlResult = await browser.sendCommand('Runtime.evaluate', {
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
        const placeholderMap = {
            url,
            timestamp: (0, logger_1.getLocalTimestamp)(),
            ready: false,
            viewport: { width: 0, height: 0 },
            elements: {},
            indexes: { byText: {}, byType: {}, inViewport: [] },
            statistics: { total: 0, byType: {}, duplicates: 0 }
        };
        this.saveMapToFile(placeholderMap);
        // Get viewport size
        const viewportResult = await browser.sendCommand('Page.getLayoutMetrics', {});
        const viewport = {
            width: viewportResult.layoutViewport.clientWidth,
            height: viewportResult.layoutViewport.clientHeight
        };
        // Execute script to find all interactive elements
        const script = (0, generate_interaction_map_1.getInteractionMapScript)();
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });
        if (!result.result || !result.result.value) {
            throw new Error('Failed to extract interactive elements');
        }
        const elementsArray = result.result.value;
        // Generate statistics
        const byType = {};
        const textCounts = {};
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
        const elements = {};
        const textIndex = {};
        const typeIndex = {};
        const inViewportIds = [];
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
        const timestamp = (0, logger_1.getLocalTimestamp)();
        // Build map object with all data collected
        const map = {
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
        }
        catch (error) {
            this.emit('generation-error', error);
            throw error;
        }
        finally {
            this.isGenerating = false;
        }
    }
    /**
     * Generate map with lock to prevent concurrent executions
     * Returns a promise that resolves when map generation is complete
     */
    async generateMapSerially(browser, force = false) {
        // If already generating and not forced, return existing promise
        if (this.currentGenerationPromise && !force) {
            logger_1.logger.debug('Map generation already in progress, waiting for completion...');
            await this.currentGenerationPromise;
            return;
        }
        // Clear existing debounce timer (legacy support)
        if (this.generationDebounceTimer) {
            logger_1.logger.debug(`Canceling previous map generation timer`);
            clearTimeout(this.generationDebounceTimer);
        }
        // Generate with lock to prevent concurrent execution
        try {
            logger_1.logger.debug('Generating map with lock...');
            this.currentGenerationPromise = this.generateMap(browser, force);
            await this.currentGenerationPromise;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.warn(`Map generation failed: ${errorMessage}`);
            this.emit('generation-error', error);
            throw error;
        }
        finally {
            this.currentGenerationPromise = null;
        }
    }
    /**
     * Check if map should be generated for a URL
     */
    shouldGenerateMapForUrl(url) {
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
    isCacheValid(url) {
        return !this.shouldGenerateMapForUrl(url);
    }
    /**
     * Get map status for a URL
     */
    getMapStatus(url) {
        const mapExists = (0, fs_1.existsSync)(this.mapPath);
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
    loadCache() {
        if (!(0, fs_1.existsSync)(this.cachePath)) {
            return {
                version: MAP_CONFIG.CACHE_VERSION,
                maps: []
            };
        }
        try {
            const data = (0, fs_1.readFileSync)(this.cachePath, 'utf-8');
            const parsed = JSON.parse(data);
            // Type guard to validate cache structure
            if (typeof parsed === 'object' &&
                parsed !== null &&
                'version' in parsed &&
                'maps' in parsed &&
                Array.isArray(parsed.maps)) {
                return parsed;
            }
            // Invalid structure, return empty cache
            return {
                version: MAP_CONFIG.CACHE_VERSION,
                maps: []
            };
        }
        catch (_error) {
            logger_1.logger.warn('Failed to load map cache, starting fresh');
            return {
                version: MAP_CONFIG.CACHE_VERSION,
                maps: []
            };
        }
    }
    /**
     * Save map cache to file
     */
    saveCache(cache) {
        try {
            (0, fs_1.writeFileSync)(this.cachePath, JSON.stringify(cache, null, 2), 'utf-8');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.warn(`Failed to save map cache: ${errorMessage}`);
        }
    }
    /**
     * Update cache entry for a URL
     */
    updateCacheEntry(url, timestamp, elementCount) {
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
    loadMapFromFile() {
        if (!(0, fs_1.existsSync)(this.mapPath)) {
            return null;
        }
        try {
            const data = (0, fs_1.readFileSync)(this.mapPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (_error) {
            return null;
        }
    }
    /**
     * Save map to file
     */
    saveMapToFile(map) {
        try {
            (0, fs_1.writeFileSync)(this.mapPath, JSON.stringify(map, null, 2), 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to save map file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Wait for ongoing map generation to complete
     * @param timeout Maximum wait time in milliseconds (default: 10000)
     * @returns true if generation completed successfully, false if timeout
     */
    async waitForGeneration(timeout = constants_1.TIMING.WAIT_FOR_LOAD_STATE) {
        if (!this.isGenerating && !this.currentGenerationPromise) {
            return true; // Already ready
        }
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                logger_1.logger.warn('Map generation timeout');
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
    setMapReady(ready) {
        try {
            const map = this.loadMapFromFile();
            if (!map) {
                return; // No map to update
            }
            map.ready = ready;
            this.saveMapToFile(map);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.logger.warn(`Failed to update map ready flag: ${errorMessage}`);
        }
    }
}
exports.MapManager = MapManager;
//# sourceMappingURL=map-manager.js.map