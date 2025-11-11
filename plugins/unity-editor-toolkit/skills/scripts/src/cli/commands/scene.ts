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
    .action(async () => {
      try {
        const projectRoot = config.getProjectRoot();
        const projectName = config.getProjectName(projectRoot);
        const projectConfig = config.getProjectConfig(projectName);

        if (!projectConfig) {
          logger.error('Project not registered');
          process.exit(1);
        }

        const port = program.opts().port || projectConfig.port;
        const client = createUnityClient(port);

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        logger.info('Getting current scene...');
        const result = await client.sendRequest<SceneInfo>(
          COMMANDS.SCENE_GET_CURRENT
        );

        client.disconnect();

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
      }
    });

  // List all scenes
  sceneCmd
    .command('list')
    .description('List all loaded scenes')
    .action(async () => {
      try {
        const projectRoot = config.getProjectRoot();
        const projectName = config.getProjectName(projectRoot);
        const projectConfig = config.getProjectConfig(projectName);

        if (!projectConfig) {
          logger.error('Project not registered');
          process.exit(1);
        }

        const port = program.opts().port || projectConfig.port;
        const client = createUnityClient(port);

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        logger.info('Getting all scenes...');
        const result = await client.sendRequest<SceneInfo[]>(
          COMMANDS.SCENE_GET_ALL
        );

        client.disconnect();

        if (!result || result.length === 0) {
          logger.info('No scenes loaded');
          return;
        }

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
      }
    });

  // Load scene
  sceneCmd
    .command('load')
    .description('Load scene by name or path')
    .argument('<name>', 'Scene name or path')
    .option('-a, --additive', 'Load scene additively')
    .action(async (name, options) => {
      try {
        const projectRoot = config.getProjectRoot();
        const projectName = config.getProjectName(projectRoot);
        const projectConfig = config.getProjectConfig(projectName);

        if (!projectConfig) {
          logger.error('Project not registered');
          process.exit(1);
        }

        const port = program.opts().port || projectConfig.port;
        const client = createUnityClient(port);

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        logger.info(`Loading scene: ${name}${options.additive ? ' (additive)' : ''}`);
        await client.sendRequest(
          COMMANDS.SCENE_LOAD,
          {
            name,
            additive: options.additive || false,
          },
          UNITY.SCENE_LOAD_TIMEOUT
        );

        client.disconnect();

        logger.info('✓ Scene loaded');
      } catch (error) {
        logger.error('Failed to load scene', error);
        process.exit(1);
      }
    });
}
