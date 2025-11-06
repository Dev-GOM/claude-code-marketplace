"use strict";
/**
 * Selector helper utilities with automatic map regeneration fallback
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
exports.findSelectorWithRetry = findSelectorWithRetry;
const query_map_1 = require("../../cdp/map/query-map");
const helpers_1 = require("../../cdp/actions/helpers");
const config_1 = require("../../cdp/config");
const daemon_helper_1 = require("../daemon-helper");
const path = __importStar(require("path"));
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
async function findSelectorWithRetry(params, elementType = 'element') {
    const mapPath = path.join((0, config_1.getOutputDir)(), helpers_1.SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    // First attempt
    let selector = (0, query_map_1.findSelector)(mapPath, params);
    // Fallback: regenerate map if element not found
    if (!selector) {
        console.log(`⚠️  ${elementType.charAt(0).toUpperCase() + elementType.slice(1)} not found in map, regenerating map and retrying...`);
        try {
            // Execute generate-map via daemon (force: true to regenerate)
            const regenResponse = await (0, daemon_helper_1.executeViaDaemon)('generate-map', { force: true }, { verbose: false });
            if (!regenResponse.success) {
                console.error(`✗ Failed to regenerate map: ${regenResponse.error}`);
                return null;
            }
            console.log(`🔄 Map regenerated, retrying selector search...`);
            // Allow file system to flush (especially important on Windows)
            await new Promise(resolve => setTimeout(resolve, 300));
            // Retry finding selector
            selector = (0, query_map_1.findSelector)(mapPath, params);
            if (!selector) {
                console.error(`❌ ${elementType.charAt(0).toUpperCase() + elementType.slice(1)} still not found after map regeneration`);
                return null;
            }
            console.log(`✓ Found ${elementType} after map regeneration: ${selector}`);
        }
        catch (error) {
            console.error(`✗ Error during map regeneration: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    return selector;
}
//# sourceMappingURL=selector-helper.js.map