/**
 * Menu command
 *
 * Unity Editor menu execution and listing commands
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Register Menu command
 */
export function registerMenuCommand(program: Command): void {
  const menuCmd = program
    .command('menu')
    .description('Unity Editor menu commands');

  // Run menu item
  menuCmd
    .command('run')
    .description('Execute a Unity Editor menu item')
    .argument('<menuPath>', 'Menu path (e.g., "Edit/Project Settings...")')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (menuPath, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        interface RunResponse {
          success: boolean;
          menuPath: string;
          message: string;
        }

        logger.info(`Executing menu item: ${menuPath}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<RunResponse>(COMMANDS.MENU_RUN, { menuPath }, timeout);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
        }
      } catch (error) {
        logger.error(`Failed to execute menu item '${menuPath}'`, error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // List menu items
  menuCmd
    .command('list')
    .description('List available Unity Editor menu items')
    .option('--filter <pattern>', 'Filter menu items by pattern (supports * wildcard)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        interface MenuItem {
          path: string;
          category: string;
        }

        interface ListResponse {
          success: boolean;
          menus: MenuItem[];
          count: number;
        }

        const params: { filter?: string } = {};
        if (options.filter) {
          params.filter = options.filter;
        }

        logger.info('Fetching menu items...');
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<ListResponse>(COMMANDS.MENU_LIST, params, timeout);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Found ${result.count} menu item(s):`);
          logger.info('');

          // Group by category
          const categories = new Map<string, string[]>();
          for (const menu of result.menus) {
            const list = categories.get(menu.category) || [];
            list.push(menu.path);
            categories.set(menu.category, list);
          }

          for (const [category, paths] of categories.entries()) {
            logger.info(`[${category}]`);
            for (const path of paths) {
              logger.info(`  ${path}`);
            }
            logger.info('');
          }
        }
      } catch (error) {
        logger.error('Failed to list menu items', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });
}
