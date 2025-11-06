/**
 * Query interaction map to find elements by various criteria
 */
import { InteractionElement } from './generate-interaction-map';
export type { InteractionElement };
export interface InteractionMap {
    url: string;
    timestamp: string;
    ready?: boolean;
    viewport: {
        width: number;
        height: number;
    };
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
    text?: string;
    type?: string;
    index?: number;
    viewportOnly?: boolean;
    id?: string;
    listTypes?: boolean;
    listTexts?: boolean;
    limit?: number;
    offset?: number;
    verbose?: boolean;
}
export interface QueryResult {
    element: InteractionElement;
    selector: string;
    alternatives: string[];
}
/**
 * Load interaction map from file with ready flag check
 * @param mapPath Optional path to map file
 * @param waitForReady If true, poll until map is ready (default: false)
 * @param timeout Maximum wait time in milliseconds (default: 10000)
 */
export declare function loadMap(mapPath?: string, waitForReady?: boolean, timeout?: number): InteractionMap;
/**
 * Select best selector for an element
 * Priority: byId > byText(indexed) > byCSS > byRole > byAriaLabel
 */
export declare function selectBestSelector(element: InteractionElement): string;
/**
 * Get all alternative selectors for an element
 */
export declare function getAlternativeSelectors(element: InteractionElement): string[];
/**
 * Query map for elements matching criteria
 */
export declare function queryMap(map: InteractionMap, options: QueryOptions): QueryResult[];
/**
 * Find element and return best selector
 * @param mapPath Path to map file
 * @param options Query options
 * @param waitForReady If true, wait for map to be ready before querying (default: true)
 * @param timeout Maximum wait time in milliseconds (default: 10000)
 */
export declare function findSelector(mapPath: string | undefined, options: QueryOptions, waitForReady?: boolean, timeout?: number): string | null;
/**
 * Find element with fallback to alternatives
 */
export declare function findSelectorWithFallback(mapPath: string | undefined, options: QueryOptions): {
    selector: string;
    alternatives: string[];
} | null;
/**
 * List all element types with counts from map
 */
export declare function listTypes(map: InteractionMap): Record<string, number>;
/**
 * List all text contents with their types from map
 */
export declare function listTexts(map: InteractionMap, options?: {
    type?: string;
    limit?: number;
    offset?: number;
}): Array<{
    text: string;
    type: string;
    count: number;
}>;
//# sourceMappingURL=query-map.d.ts.map