/**
 * Scene command
 *
 * Manipulate Unity scenes.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS, UNITY } from '@/constants';
import type { SceneInfo } from '@/unity/protocol';
import { output, outputJson } from '@/utils/output-formatter';

/**
 * Register Scene command
 */
export function registerSceneCommand(program: Command): void {
  const sceneCmd = program
    .command('scene')
    .description('Manipulate Unity scenes');

  // Get current scene
  sceneCmd
    .command('current')
    .description('Get current active scene')
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

        logger.info('Getting current scene...');
        const result = await client.sendRequest<SceneInfo>(
          COMMANDS.SCENE_GET_CURRENT
        );

        // JSON output
        if (options.json) {
          outputJson({ scene: result });
          return;
        }

        // Text output
        logger.info('✓ Current Scene:');
        logger.info(`  Name: ${result.name}`);
        logger.info(`  Path: ${result.path}`);
        logger.info(`  Build Index: ${result.buildIndex}`);
        logger.info(`  Is Loaded: ${result.isLoaded}`);
        logger.info(`  Is Dirty: ${result.isDirty}`);
        logger.info(`  Root GameObjects: ${result.rootCount}`);
      } catch (error) {
        logger.error('Failed to get current scene', error);
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

  // List all scenes
  sceneCmd
    .command('list')
    .description('List all loaded scenes')
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

        logger.info('Getting all scenes...');
        const result = await client.sendRequest<SceneInfo[]>(
          COMMANDS.SCENE_GET_ALL
        );

        if (!result || result.length === 0) {
          if (options.json) {
            outputJson({ scenes: [], total: 0 });
          } else {
            logger.info('No scenes loaded');
          }
          return;
        }

        // JSON output
        if (options.json) {
          outputJson({
            scenes: result,
            total: result.length,
          });
          return;
        }

        // Text output
        logger.info('✓ Loaded Scenes:');
        logger.info('━'.repeat(60));
        for (const scene of result) {
          const loadedIcon = scene.isLoaded ? '●' : '○';
          const dirtyIcon = scene.isDirty ? '*' : ' ';
          logger.info(`${loadedIcon}${dirtyIcon} ${scene.name}`);
          logger.info(`   Path: ${scene.path}`);
          logger.info(`   Build Index: ${scene.buildIndex}`);
          logger.info(`   Root GameObjects: ${scene.rootCount}`);
          logger.info('');
        }
        logger.info('━'.repeat(60));
        logger.info(`Total: ${result.length} scene(s)`);
      } catch (error) {
        logger.error('Failed to list scenes', error);
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

  // Load scene
  sceneCmd
    .command('load')
    .description('Load scene by name or path')
    .argument('<name>', 'Scene name or path')
    .option('-a, --additive', 'Load scene additively')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds')
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

        logger.info(`Loading scene: ${name}${options.additive ? ' (additive)' : ''}`);
        const timeout = options.timeout ? parseInt(options.timeout, 10) : UNITY.SCENE_LOAD_TIMEOUT;
        await client.sendRequest(
          COMMANDS.SCENE_LOAD,
          {
            name,
            additive: options.additive || false,
          },
          timeout
        );

        // JSON output
        if (options.json) {
          outputJson({
            success: true,
            scene: name,
            additive: options.additive || false,
          });
        } else {
          logger.info('✓ Scene loaded');
        }
      } catch (error) {
        logger.error('Failed to load scene', error);
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
