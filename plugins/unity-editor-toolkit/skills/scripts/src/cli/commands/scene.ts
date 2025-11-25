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
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
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
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
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
        for (const scene of result) {
          const loadedIcon = scene.isLoaded ? '●' : '○';
          const dirtyIcon = scene.isDirty ? '*' : ' ';
          logger.info(`${loadedIcon}${dirtyIcon} ${scene.name}`);
          logger.info(`   Path: ${scene.path}`);
          logger.info(`   Build Index: ${scene.buildIndex}`);
          logger.info(`   Root GameObjects: ${scene.rootCount}`);
        }
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

  // Create new scene
  sceneCmd
    .command('new')
    .description('Create a new scene')
    .option('-e, --empty', 'Create empty scene (no default objects)')
    .option('-a, --additive', 'Add new scene without replacing current')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
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

        logger.info(`Creating new scene${options.empty ? ' (empty)' : ''}${options.additive ? ' (additive)' : ''}...`);
        const result = await client.sendRequest<{ success: boolean; scene: SceneInfo }>(
          COMMANDS.SCENE_NEW,
          {
            empty: options.empty || false,
            additive: options.additive || false,
          }
        );

        // JSON output
        if (options.json) {
          outputJson(result);
          return;
        }

        // Text output
        logger.info('✓ New scene created');
        if (result.scene) {
          logger.info(`  Name: ${result.scene.name || '(Untitled)'}`);
        }
      } catch (error) {
        logger.error('Failed to create new scene', error);
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

  // Save scene
  sceneCmd
    .command('save')
    .description('Save scene')
    .argument('[path]', 'Path to save scene (optional, for Save As)')
    .option('-s, --scene <name>', 'Specific scene name to save (default: active scene)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
    .action(async (path, options) => {
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

        logger.info(`Saving scene${path ? ` to ${path}` : ''}...`);
        const result = await client.sendRequest<{ success: boolean; scene: SceneInfo }>(
          COMMANDS.SCENE_SAVE,
          {
            sceneName: options.scene || '',
            path: path || '',
          }
        );

        // JSON output
        if (options.json) {
          outputJson(result);
          return;
        }

        // Text output
        if (result.success) {
          logger.info('✓ Scene saved');
          if (result.scene) {
            logger.info(`  Path: ${result.scene.path}`);
          }
        } else {
          logger.error('Failed to save scene');
        }
      } catch (error) {
        logger.error('Failed to save scene', error);
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

  // Unload scene
  sceneCmd
    .command('unload')
    .description('Unload a scene')
    .argument('<name>', 'Scene name or path to unload')
    .option('-r, --remove', 'Remove scene completely (default: just unload)')
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

        logger.info(`Unloading scene: ${name}...`);
        const result = await client.sendRequest<{ success: boolean }>(
          COMMANDS.SCENE_UNLOAD,
          {
            name,
            removeScene: options.remove || false,
          }
        );

        // JSON output
        if (options.json) {
          outputJson({ success: result.success, scene: name });
          return;
        }

        // Text output
        if (result.success) {
          logger.info('✓ Scene unloaded');
        } else {
          logger.error('Failed to unload scene');
        }
      } catch (error) {
        logger.error('Failed to unload scene', error);
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

  // Set active scene
  sceneCmd
    .command('set-active')
    .description('Set the active scene')
    .argument('<name>', 'Scene name or path to set as active')
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

        logger.info(`Setting active scene: ${name}...`);
        const result = await client.sendRequest<{ success: boolean; scene: SceneInfo }>(
          COMMANDS.SCENE_SET_ACTIVE,
          { name }
        );

        // JSON output
        if (options.json) {
          outputJson(result);
          return;
        }

        // Text output
        if (result.success) {
          logger.info('✓ Active scene changed');
          if (result.scene) {
            logger.info(`  Name: ${result.scene.name}`);
            logger.info(`  Path: ${result.scene.path}`);
          }
        } else {
          logger.error('Failed to set active scene');
        }
      } catch (error) {
        logger.error('Failed to set active scene', error);
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
