/**
 * Navigation command handlers for Browser Pilot Daemon
 */
import { ChromeBrowser } from '../../cdp/browser';
import { MapManager } from '../map-manager';
/**
 * Handler context containing dependencies
 */
export interface HandlerContext {
    browser: ChromeBrowser;
    mapManager?: MapManager;
    outputDir: string;
}
/**
 * Handle navigate command
 */
export declare function handleNavigate(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle back command
 */
export declare function handleBack(context: HandlerContext, _params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle forward command
 */
export declare function handleForward(context: HandlerContext, _params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle reload command
 */
export declare function handleReload(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=navigation-handlers.d.ts.map