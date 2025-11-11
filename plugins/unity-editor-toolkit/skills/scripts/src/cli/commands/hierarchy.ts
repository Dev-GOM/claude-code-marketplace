/**
 * Hierarchy command
 *
 * Query Unity GameObject hierarchy.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
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
      try {
        const projectRoot = config.getProjectRoot();
        const projectName = config.getProjectName(projectRoot);
        const projectConfig = config.getProjectConfig(projectName);

        if (!projectConfig) {
          logger.error('Project not registered. Open this project with Claude Code first.');
          process.exit(1);
        }

        const port = program.opts().port || projectConfig.port;
        const client = createUnityClient(port);

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        logger.info('Querying hierarchy...');
        const result = await client.sendRequest<GameObjectInfo[]>(
          COMMANDS.HIERARCHY_GET,
          {
            rootOnly: options.rootOnly || false,
            includeInactive: options.includeInactive || false,
          },
          UNITY.HIERARCHY_TIMEOUT
        );

        client.disconnect();

        if (!result || result.length === 0) {
          logger.info('No GameObjects found');
          return;
        }

        logger.info('Unity Hierarchy:');
        logger.info('━'.repeat(60));
        for (const obj of result) {
          console.log(formatHierarchy(obj));
        }
        logger.info('━'.repeat(60));
        logger.info(`Total: ${result.length} root GameObject(s)`);
      } catch (error) {
        logger.error('Failed to query hierarchy', error);
        process.exit(1);
      }
    });
}
