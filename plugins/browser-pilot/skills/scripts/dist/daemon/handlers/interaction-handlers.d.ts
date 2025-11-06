/**
 * Interaction command handlers for Browser Pilot Daemon
 */
import { HandlerContext } from './navigation-handlers';
/**
 * Handle click command with smart mode support
 */
export declare function handleClick(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle fill command with smart mode support
 */
export declare function handleFill(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle hover command
 */
export declare function handleHover(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle press (keyboard key) command
 */
export declare function handlePress(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
/**
 * Handle type (text input) command
 */
export declare function handleType(context: HandlerContext, params: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=interaction-handlers.d.ts.map