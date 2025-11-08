/**
 * Helper functions for daemon-based CLI commands
 */

import { IPCClient } from '../daemon/client';
import { DaemonManager } from '../daemon/manager';
import { IPCResponse } from '../daemon/protocol';
import { TIMING } from '../constants';

/**
 * Execute command via daemon (auto-start if needed)
 */
export async function executeViaDaemon(
  command: string,
  params: Record<string, unknown> = {},
  options: {
    timeout?: number;
    verbose?: boolean;
    autoStart?: boolean;
  } = {}
): Promise<IPCResponse> {
  const { timeout = TIMING.WAIT_FOR_NAVIGATION, verbose = true, autoStart = true } = options;

  // Ensure daemon is running
  if (autoStart) {
    const manager = new DaemonManager();

    // If navigate command and daemon not running, pass initial URL
    const isRunning = await manager.isRunning();
    const initialUrl = (command === 'navigate' && !isRunning && params.url)
      ? params.url as string
      : undefined;

    await manager.ensureRunning({ verbose, initialUrl });
  }

  // Send command to daemon
  const client = new IPCClient();

  try {
    const response = await client.sendRequest(command, params, timeout);
    return response;
  } finally {
    client.close();
  }
}

/**
 * Format and display command result
 */
export function displayResult(response: IPCResponse, verbose: boolean = true): void {
  if (!verbose) return;

  if (response.success) {
    // Display success result based on data type
    const data = response.data;

    if (data && typeof data === 'object') {
      // Pretty print objects
      console.log(JSON.stringify(data, null, 2));
    } else if (data !== undefined) {
      // Print primitive values
      console.log(data);
    }
  } else {
    console.error('Error:', response.error);
  }
}
