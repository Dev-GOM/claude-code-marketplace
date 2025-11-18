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
import { output, outputJson } from '@/utils/output-formatter';

/**
 * Format hierarchy tree
 */
function formatHierarchy(obj: GameObjectInfo, indent = 0, maxDepth?: number, withComponents = false): string {
  const prefix = '  '.repeat(indent);
  const activeIcon = obj.active ? '●' : '○';
  let result = `${prefix}${activeIcon} ${obj.name} (ID: ${obj.instanceId})`;

  // Add components if requested
  if (withComponents && obj.components && obj.components.length > 0) {
    result += ` [${obj.components.join(', ')}]`;
  }

  // Recurse into children if within depth limit
  if (obj.children && obj.children.length > 0) {
    if (maxDepth === undefined || indent < maxDepth - 1) {
      for (const child of obj.children) {
        result += '\n' + formatHierarchy(child, indent + 1, maxDepth, withComponents);
      }
    } else if (maxDepth !== undefined && indent >= maxDepth - 1) {
      result += `\n${prefix}  ... (${obj.children.length} children, use --depth to see more)`;
    }
  }

  return result;
}

/**
 * Register hierarchy command
 */
/**
 * Filter hierarchy by name (recursively)
 */
function filterHierarchyByName(objects: GameObjectInfo[], nameFilter: string): GameObjectInfo[] {
  const filterLower = nameFilter.toLowerCase();
  const result: GameObjectInfo[] = [];

  for (const obj of objects) {
    // Check if this object matches
    const matches = obj.name.toLowerCase().includes(filterLower);

    // Filter children recursively
    let filteredChildren: GameObjectInfo[] = [];
    if (obj.children && obj.children.length > 0) {
      filteredChildren = filterHierarchyByName(obj.children, nameFilter);
    }

    // Include this object if it matches or has matching children
    if (matches || filteredChildren.length > 0) {
      result.push({
        ...obj,
        children: filteredChildren,
      });
    }
  }

  return result;
}

export function registerHierarchyCommand(program: Command): void {
  const hierarchyCmd = program
    .command('hierarchy')
    .description('Query Unity GameObject hierarchy')
    .option('-r, --root-only', 'Show only root GameObjects')
    .option('-i, --include-inactive', 'Include inactive GameObjects')
    .option('-a, --active-only', 'Show only active GameObjects (opposite of -i)')
    .option('-d, --depth <n>', 'Limit hierarchy depth (e.g., 2 for 2 levels)')
    .option('-l, --limit <n>', 'Limit number of root GameObjects to show')
    .option('-n, --count <n>', 'Same as --limit (alternative alias)')
    .option('-f, --filter <name>', 'Filter GameObjects by name (case-insensitive)')
    .option('-c, --with-components', 'Include component information')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
    .action(async (options) => {
      let client = null;
      try {
        const port = getUnityPortOrExit(program);
        client = await connectToUnity(port);

        logger.info('Querying hierarchy...');
        const timeout = options.timeout ? parseInt(options.timeout, 10) : UNITY.HIERARCHY_TIMEOUT;

        // Handle active-only vs include-inactive
        let includeInactive = options.includeInactive || false;
        if (options.activeOnly) {
          includeInactive = false; // --active-only overrides
        }

        let result = await client.sendRequest<GameObjectInfo[]>(
          COMMANDS.HIERARCHY_GET,
          {
            rootOnly: options.rootOnly || false,
            includeInactive,
          },
          timeout
        );

        // Apply name filter if provided
        if (options.filter) {
          result = filterHierarchyByName(result, options.filter);
        }

        // Apply limit if provided (--limit or --count)
        const limitValue = options.limit || options.count;
        if (limitValue) {
          const limit = parseInt(limitValue, 10);
          if (!isNaN(limit) && limit > 0) {
            result = result.slice(0, limit);
          }
        }

        if (!result || result.length === 0) {
          if (options.json) {
            outputJson({
              hierarchy: [],
              total: 0,
              filter: options.filter || null,
              depth: options.depth ? parseInt(options.depth, 10) : null,
            });
          } else {
            logger.info(options.filter ? `No GameObjects found matching filter: "${options.filter}"` : 'No GameObjects found');
          }
          return;
        }

        // JSON output
        if (options.json) {
          outputJson({
            hierarchy: result,
            total: result.length,
          });
          return;
        }

        // Text output
        const maxDepth = options.depth ? parseInt(options.depth, 10) : undefined;
        const withComponents = options.withComponents || false;

        logger.info('Unity Hierarchy:');
        for (const obj of result) {
          logger.info(formatHierarchy(obj, 0, maxDepth, withComponents));
        }
        let summary = `Total: ${result.length} root GameObject(s)`;
        if (options.filter) summary += ` (filtered by: "${options.filter}")`;
        if (maxDepth) summary += ` (depth: ${maxDepth})`;
        logger.info(summary);
      } catch (error) {
        logger.error('Failed to query hierarchy', error);
        process.exit(1);
      } finally {
        disconnectUnity(client);
      }
    });
}
