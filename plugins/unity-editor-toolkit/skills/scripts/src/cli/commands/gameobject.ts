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
    .action(async (name) => {
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

        logger.info(`Connecting to Unity Editor...`);
        await client.connect();

        logger.info(`Finding GameObject: ${name}`);
        const result = await client.sendRequest<GameObjectInfo>(
          COMMANDS.GAMEOBJECT_FIND,
          { name }
        );

        client.disconnect();

        if (!result) {
          logger.info('GameObject not found');
          return;
        }

        logger.info('✓ GameObject found:');
        logger.info(`  Name: ${result.name}`);
        logger.info(`  Instance ID: ${result.instanceId}`);
        logger.info(`  Path: ${result.path}`);
        logger.info(`  Active: ${result.active}`);
        logger.info(`  Tag: ${result.tag}`);
        logger.info(`  Layer: ${result.layer}`);
      } catch (error) {
        logger.error('Failed to find GameObject', error);
        process.exit(1);
      }
    });

  // Create GameObject
  goCmd
    .command('create')
    .description('Create new GameObject')
    .argument('<name>', 'GameObject name')
    .option('-p, --parent <name>', 'Parent GameObject name or path')
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

        logger.info(`Creating GameObject: ${name}`);
        const result = await client.sendRequest<GameObjectInfo>(
          COMMANDS.GAMEOBJECT_CREATE,
          {
            name,
            parent: options.parent,
          }
        );

        client.disconnect();

        logger.info('✓ GameObject created:');
        logger.info(`  Name: ${result.name}`);
        logger.info(`  Instance ID: ${result.instanceId}`);
        logger.info(`  Path: ${result.path}`);
      } catch (error) {
        logger.error('Failed to create GameObject', error);
        process.exit(1);
      }
    });

  // Destroy GameObject
  goCmd
    .command('destroy')
    .description('Destroy GameObject')
    .argument('<name>', 'GameObject name or path')
    .action(async (name) => {
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

        logger.info(`Destroying GameObject: ${name}`);
        await client.sendRequest(COMMANDS.GAMEOBJECT_DESTROY, { name });

        client.disconnect();

        logger.info('✓ GameObject destroyed');
      } catch (error) {
        logger.error('Failed to destroy GameObject', error);
        process.exit(1);
      }
    });

  // Set active state
  goCmd
    .command('set-active')
    .description('Set GameObject active state')
    .argument('<name>', 'GameObject name or path')
    .argument('<active>', 'Active state (true/false)', (value) => value === 'true')
    .action(async (name, active) => {
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

        logger.info(`Setting GameObject active state: ${name} → ${active}`);
        await client.sendRequest(COMMANDS.GAMEOBJECT_SET_ACTIVE, {
          name,
          active,
        });

        client.disconnect();

        logger.info(`✓ GameObject active state set to ${active}`);
      } catch (error) {
        logger.error('Failed to set active state', error);
        process.exit(1);
      }
    });
}
