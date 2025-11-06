/**
 * Interaction Map command handlers for Browser Pilot Daemon
 */
import { HandlerContext } from './navigation-handlers';
import { MapQueryResult, MapGenerateResult, MapStatusResult } from '../protocol';
/**
 * Handle query-map command
 */
export declare function handleQueryMap(context: HandlerContext, params: Record<string, unknown>): Promise<MapQueryResult>;
/**
 * Handle generate-map command
 */
export declare function handleGenerateMap(context: HandlerContext, params: Record<string, unknown>): Promise<MapGenerateResult>;
/**
 * Handle get-map-status command
 */
export declare function handleGetMapStatus(context: HandlerContext, _params: Record<string, unknown>): Promise<MapStatusResult>;
//# sourceMappingURL=map-handlers.d.ts.map