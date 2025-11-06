/**
 * Data extraction command handlers for Browser Pilot Daemon
 */
import { HandlerContext } from './navigation-handlers';
/**
 * Handle extract command (text extraction)
 */
export declare function handleExtract(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle content command (get page HTML)
 */
export declare function handleContent(context: HandlerContext, _params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle find command (find element)
 */
export declare function handleFind(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle JavaScript evaluation command
 */
export declare function handleEval(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=data-handlers.d.ts.map