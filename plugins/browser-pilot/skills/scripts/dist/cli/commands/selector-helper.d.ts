/**
 * Selector helper utilities with automatic map regeneration fallback
 */
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
export declare function findSelectorWithRetry(params: SelectorQueryParams, elementType?: string): Promise<string | null>;
//# sourceMappingURL=selector-helper.d.ts.map