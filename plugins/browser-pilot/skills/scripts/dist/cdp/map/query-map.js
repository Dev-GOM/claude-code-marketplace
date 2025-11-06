"use strict";
/**
 * Query interaction map to find elements by various criteria
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMap = loadMap;
exports.selectBestSelector = selectBestSelector;
exports.getAlternativeSelectors = getAlternativeSelectors;
exports.queryMap = queryMap;
exports.findSelector = findSelector;
exports.findSelectorWithFallback = findSelectorWithFallback;
exports.listTypes = listTypes;
exports.listTexts = listTexts;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const helpers_1 = require("../actions/helpers");
const config_1 = require("../config");
const constants_1 = require("../../constants");
const logger_1 = require("../../utils/logger");
/**
 * Load interaction map from file with ready flag check
 * @param mapPath Optional path to map file
 * @param waitForReady If true, poll until map is ready (default: false)
 * @param timeout Maximum wait time in milliseconds (default: 10000)
 */
function loadMap(mapPath, waitForReady = false, timeout = 10000) {
    const defaultPath = path.join((0, config_1.getOutputDir)(), helpers_1.SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    const filePath = mapPath || defaultPath;
    if (!fs.existsSync(filePath)) {
        throw new Error(`Map file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const map = JSON.parse(content);
    // If not waiting for ready or already ready, return immediately
    if (!waitForReady || map.ready === true) {
        return map;
    }
    // Poll until ready or timeout
    const startTime = Date.now();
    const pollInterval = constants_1.TIMING.POLLING_INTERVAL_FAST;
    while (Date.now() - startTime < timeout) {
        // Sleep using platform-appropriate command
        try {
            if (process.platform === 'win32') {
                (0, child_process_1.execSync)(`ping -n 1 -w ${pollInterval} ${constants_1.CDP.LOCALHOST} >nul`, { stdio: 'ignore' });
            }
            else {
                (0, child_process_1.execSync)(`sleep ${pollInterval / constants_1.TIMING.ACTION_DELAY_NAVIGATION}`, { stdio: 'ignore' });
            }
        }
        catch {
            // Ignore errors, just continue polling
        }
        // Re-read map
        if (!fs.existsSync(filePath)) {
            throw new Error(`Map file disappeared during polling: ${filePath}`);
        }
        const newContent = fs.readFileSync(filePath, 'utf-8');
        const newMap = JSON.parse(newContent);
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
function selectBestSelector(element) {
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
function getAlternativeSelectors(element) {
    const alternatives = [];
    const { selectors } = element;
    if (selectors.byId)
        alternatives.push(selectors.byId);
    if (selectors.byText)
        alternatives.push(selectors.byText);
    if (selectors.byCSS)
        alternatives.push(selectors.byCSS);
    if (selectors.byRole)
        alternatives.push(selectors.byRole);
    if (selectors.byAriaLabel)
        alternatives.push(selectors.byAriaLabel);
    return alternatives;
}
/**
 * Query map for elements matching criteria
 */
function queryMap(map, options) {
    let candidateIds = [];
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
            const matchingTexts = Object.keys(map.indexes.byText).filter(text => options.text && text.toLowerCase().includes(options.text.toLowerCase()));
            matchingTexts.forEach(text => {
                candidateIds.push(...map.indexes.byText[text]);
            });
        }
    }
    else {
        // No text filter: start with all elements
        candidateIds = Object.keys(map.elements);
    }
    // Type filter
    if (options.type) {
        const typeIds = map.indexes.byType[options.type] || [];
        candidateIds = candidateIds.filter(id => typeIds.includes(id));
    }
    // Viewport filter
    if (options.viewportOnly) {
        const viewportIds = map.indexes.inViewport;
        candidateIds = candidateIds.filter(id => viewportIds.includes(id));
    }
    // Remove duplicates
    candidateIds = Array.from(new Set(candidateIds));
    // Convert IDs to QueryResults
    const results = candidateIds.map(id => {
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
function findSelector(mapPath, options, waitForReady = true, timeout = 10000) {
    try {
        const map = loadMap(mapPath, waitForReady, timeout);
        const results = queryMap(map, options);
        if (results.length === 0) {
            return null;
        }
        // Return the best selector of the first result
        return results[0].selector;
    }
    catch (error) {
        logger_1.logger.error('Error querying map', error);
        return null;
    }
}
/**
 * Find element with fallback to alternatives
 */
function findSelectorWithFallback(mapPath, options) {
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
    }
    catch (error) {
        logger_1.logger.error('Error querying map', error);
        return null;
    }
}
/**
 * List all element types with counts from map
 */
function listTypes(map) {
    return map.statistics.byType;
}
/**
 * List all text contents with their types from map
 */
function listTexts(map, options) {
    const limit = options?.limit !== undefined ? options.limit : 20;
    const offset = options?.offset || 0;
    const typeFilter = options?.type;
    const textList = [];
    // Iterate through text index
    for (const [text, elementIds] of Object.entries(map.indexes.byText)) {
        // Get first element to determine type
        const firstElement = map.elements[elementIds[0]];
        if (!firstElement)
            continue;
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
//# sourceMappingURL=query-map.js.map