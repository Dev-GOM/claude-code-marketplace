/**
 * Utility command handlers for Browser Pilot Daemon
 */
import { HandlerContext } from './navigation-handlers';
import { DaemonState } from '../protocol';
/**
 * Handle scroll command
 */
export declare function handleScroll(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle wait command
 */
export declare function handleWait(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle console command
 */
export declare function handleConsole(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle status command
 */
export declare function handleStatus(context: HandlerContext, _params: Record<string, unknown>, startTime: number, lastActivity: number): Promise<DaemonState>;
//# sourceMappingURL=utility-handlers.d.ts.map