/**
 * Interaction Map Manager for Browser Pilot Daemon
 * Handles automatic map generation, caching, and lifecycle management
 */
import { EventEmitter } from 'events';
import { ChromeBrowser } from '../cdp/browser';
import { InteractionMap } from '../cdp/map/query-map';
/**
 * Map generation event data
 */
export interface MapGenerationEvent {
    url: string;
    timestamp: string;
    elementCount: number;
}
export declare class MapManager extends EventEmitter {
    private outputDir;
    private mapPath;
    private cachePath;
    private currentCache;
    private lastGenerationTime;
    private generationDebounceTimer;
    private isGenerating;
    private currentGenerationPromise;
    constructor(outputDir: string);
    /**
     * Generate interaction map for current page
     */
    generateMap(browser: ChromeBrowser, force?: boolean): Promise<InteractionMap>;
    /**
     * Generate map with debounce to prevent rapid successive generations
     * Returns a promise that resolves when map generation is complete
     */
    generateMapDebounced(browser: ChromeBrowser, force?: boolean): Promise<void>;
    /**
     * Check if map should be generated for a URL
     */
    private shouldGenerateMapForUrl;
    /**
     * Check if cached map is valid for a URL
     */
    isCacheValid(url: string): boolean;
    /**
     * Get map status for a URL
     */
    getMapStatus(url: string): {
        exists: boolean;
        url: string | null;
        timestamp: string | null;
        elementCount: number;
        cacheValid: boolean;
    };
    /**
     * Load map cache from file
     */
    private loadCache;
    /**
     * Save map cache to file
     */
    private saveCache;
    /**
     * Update cache entry for a URL
     */
    private updateCacheEntry;
    /**
     * Load map from file
     */
    private loadMapFromFile;
    /**
     * Save map to file
     */
    private saveMapToFile;
    /**
     * Wait for ongoing map generation to complete
     * @param timeout Maximum wait time in milliseconds (default: 10000)
     * @returns true if generation completed successfully, false if timeout
     */
    waitForGeneration(timeout?: number): Promise<boolean>;
    /**
     * Set ready flag in existing map file
     * Called by action handlers to invalidate map before action execution
     * @param ready Ready state to set (typically false to invalidate)
     */
    setMapReady(ready: boolean): void;
}
//# sourceMappingURL=map-manager.d.ts.map