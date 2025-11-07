/**
 * Capture command handlers for Browser Pilot Daemon
 */
import { HandlerContext } from './navigation-handlers';
/**
 * Handle screenshot command
 */
export declare function handleScreenshot(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle set viewport size command
 */
export declare function handleSetViewport(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle get viewport command
 */
export declare function handleGetViewport(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle get screen info command
 */
export declare function handleGetScreenInfo(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle PDF generation command
 */
export declare function handlePdf(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=capture-handlers.d.ts.map