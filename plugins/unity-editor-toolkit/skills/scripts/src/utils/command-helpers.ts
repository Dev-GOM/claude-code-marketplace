/**
 * Command Helper Utilities
 *
 * Common utilities for CLI commands to reduce code duplication.
 */

import { Command } from 'commander';
import * as config from './config';
import * as logger from './logger';
import { createUnityClient, UnityWebSocketClient } from '@/unity/client';

/**
 * Get Unity port from command options or server status
 * Exits process if port is not available
 */
export function getUnityPortOrExit(program: Command): number {
  const projectRoot = config.getProjectRoot();
  const port = program.opts().port || config.getUnityPort(projectRoot);

  if (!port) {
    logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
    process.exit(1);
  }

  return port;
}

/**
 * Create and connect to Unity Editor WebSocket client
 */
export async function connectToUnity(port: number): Promise<UnityWebSocketClient> {
  const client = createUnityClient(port);

  logger.info('Connecting to Unity Editor...');
  await client.connect();

  return client;
}

/**
 * Safely disconnect Unity client
 * Logs error if disconnect fails but doesn't throw
 */
export function disconnectUnity(client: UnityWebSocketClient | null): void {
  if (client) {
    try {
      client.disconnect();
    } catch (disconnectError) {
      logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
    }
  }
}
