/**
 * Helper functions for daemon-based CLI commands
 */
import { IPCResponse } from '../daemon/protocol';
/**
 * Execute command via daemon (auto-start if needed)
 */
export declare function executeViaDaemon(command: string, params?: Record<string, unknown>, options?: {
    timeout?: number;
    verbose?: boolean;
    autoStart?: boolean;
}): Promise<IPCResponse>;
/**
 * Format and display command result
 */
export declare function displayResult(response: IPCResponse, verbose?: boolean): void;
//# sourceMappingURL=daemon-helper.d.ts.map