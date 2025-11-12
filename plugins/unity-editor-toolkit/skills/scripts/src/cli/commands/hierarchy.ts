/**
 * Hierarchy command
 *
 * Query Unity GameObject hierarchy.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import { getUnityPortOrExit, connectToUnity, disconnectUnity } from '@/utils/command-helpers';
import { COMMANDS, UNITY } from '@/constants';
import type { GameObjectInfo } from '@/unity/protocol';

/**
 * Format hierarchy tree
 */
function formatHierarchy(obj: GameObjectInfo, indent = 0): string {
  const prefix = '  '.repeat(indent);
  const activeIcon = obj.active ? '●' : '○';
  let result = `${prefix}${activeIcon} ${obj.name} (ID: ${obj.instanceId})`;

  if (obj.children && obj.children.length > 0) {
    for (const child of obj.children) {
      result += '\n' + formatHierarchy(child, indent + 1);
    }
  }

  return result;
}

/**
 * Register hierarchy command
 */
export function registerHierarchyCommand(program: Command): void {
  const hierarchyCmd = program
    .command('hierarchy')
    .description('Query Unity GameObject hierarchy')
    .option('-r, --root-only', 'Show only root GameObjects')
    .option('-i, --include-inactive', 'Include inactive GameObjects')
    .action(async (options) => {
      let client = null;
      try {
        const port = getUnityPortOrExit(program);
        client = await connectToUnity(port);

        logger.info('Querying hierarchy...');
        const result = await client.sendRequest<GameObjectInfo[]>(
          COMMANDS.HIERARCHY_GET,
          {
            rootOnly: options.rootOnly || false,
            includeInactive: options.includeInactive || false,
          },
          UNITY.HIERARCHY_TIMEOUT
        );

        if (!result || result.length === 0) {
          logger.info('No GameObjects found');
          return;
        }

        logger.info('Unity Hierarchy:');
        logger.info('━'.repeat(60));
        for (const obj of result) {
          logger.info(formatHierarchy(obj));
        }
        logger.info('━'.repeat(60));
        logger.info(`Total: ${result.length} root GameObject(s)`);
      } catch (error) {
        logger.error('Failed to query hierarchy', error);
        process.exit(1);
      } finally {
        disconnectUnity(client);
      }
    });
}
