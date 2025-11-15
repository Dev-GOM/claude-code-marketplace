/**
 * GameObject command
 *
 * Manipulate Unity GameObjects.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import type { GameObjectInfo } from '@/unity/protocol';
import { output, outputJson } from '@/utils/output-formatter';

/**
 * Register GameObject command
 */
export function registerGameObjectCommand(program: Command): void {
  const goCmd = program
    .command('gameobject')
    .alias('go')
    .description('Manipulate Unity GameObjects');

  // Find GameObject
  goCmd
    .command('find')
    .description('Find GameObject by name or path')
    .argument('<name>', 'GameObject name or path')
    .option('-c, --with-components', 'Include component list')
    .option('--with-children', 'Include children hierarchy')
    .option('--full', 'Include all details (components + children)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
    .action(async (name, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);

        logger.info(`Connecting to Unity Editor...`);
        await client.connect();

        logger.info(`Finding GameObject: ${name}`);
        const result = await client.sendRequest<GameObjectInfo>(
          COMMANDS.GAMEOBJECT_FIND,
          { name }
        );

        if (!result) {
          if (options.json) {
            outputJson({ found: false, gameObject: null });
          } else {
            logger.info('GameObject not found');
          }
          return;
        }

        // JSON output
        if (options.json) {
          outputJson({
            found: true,
            gameObject: result,
          });
          return;
        }

        // Text output
        const showComponents = options.withComponents || options.full;
        const showChildren = options.withChildren || options.full;

        logger.info('✓ GameObject found:');
        logger.info(`  Name: ${result.name}`);
        logger.info(`  Instance ID: ${result.instanceId}`);
        logger.info(`  Path: ${result.path}`);
        logger.info(`  Active: ${result.active}`);
        logger.info(`  Tag: ${result.tag}`);
        logger.info(`  Layer: ${result.layer}`);

        // Show components if requested
        if (showComponents && result.components && result.components.length > 0) {
          logger.info(`  Components (${result.components.length}):`);
          for (const component of result.components) {
            logger.info(`    - ${component}`);
          }
        }

        // Show children if requested
        if (showChildren && result.children && result.children.length > 0) {
          logger.info(`  Children (${result.children.length}):`);
          const formatChild = (child: any, indent = 2): void => {
            const prefix = '  '.repeat(indent);
            const activeIcon = child.active ? '●' : '○';
            logger.info(`${prefix}${activeIcon} ${child.name} (ID: ${child.instanceId})`);
            if (child.children && child.children.length > 0) {
              for (const grandChild of child.children) {
                formatChild(grandChild, indent + 1);
              }
            }
          };
          for (const child of result.children) {
            formatChild(child);
          }
        }
      } catch (error) {
        logger.error('Failed to find GameObject', error);
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

  // Create GameObject
  goCmd
    .command('create')
    .description('Create new GameObject')
    .argument('<name>', 'GameObject name')
    .option('-p, --parent <name>', 'Parent GameObject name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
    .action(async (name, options) => {
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

        logger.info(`Creating GameObject: ${name}`);
        const result = await client.sendRequest<GameObjectInfo>(
          COMMANDS.GAMEOBJECT_CREATE,
          {
            name,
            parent: options.parent,
          }
        );

        // JSON output
        if (options.json) {
          outputJson({
            success: true,
            gameObject: result,
          });
          return;
        }

        // Text output
        logger.info('✓ GameObject created:');
        logger.info(`  Name: ${result.name}`);
        logger.info(`  Instance ID: ${result.instanceId}`);
        logger.info(`  Path: ${result.path}`);
      } catch (error) {
        logger.error('Failed to create GameObject', error);
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

  // Destroy GameObject
  goCmd
    .command('destroy')
    .description('Destroy GameObject')
    .argument('<name>', 'GameObject name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
    .action(async (name, options) => {
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

        logger.info(`Destroying GameObject: ${name}`);
        await client.sendRequest(COMMANDS.GAMEOBJECT_DESTROY, { name });

        // JSON output
        if (options.json) {
          outputJson({ success: true, message: `GameObject '${name}' destroyed` });
        } else {
          logger.info('✓ GameObject destroyed');
        }
      } catch (error) {
        logger.error('Failed to destroy GameObject', error);
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

  // Set active state
  goCmd
    .command('set-active')
    .description('Set GameObject active state')
    .argument('<name>', 'GameObject name or path')
    .argument('<active>', 'Active state (true/false)', (value) => value === 'true')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
    .action(async (name, active, options) => {
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

        logger.info(`Setting GameObject active state: ${name} → ${active}`);
        await client.sendRequest(COMMANDS.GAMEOBJECT_SET_ACTIVE, {
          name,
          active,
        });

        // JSON output
        if (options.json) {
          outputJson({
            success: true,
            gameObject: name,
            active: active,
          });
        } else {
          logger.info(`✓ GameObject active state set to ${active}`);
        }
      } catch (error) {
        logger.error('Failed to set active state', error);
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
