/**
 * Transform command
 *
 * Manipulate Unity Transform components.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import type { TransformInfo, Vector3 } from '@/unity/protocol';

/**
 * Parse Vector3 from string "x,y,z"
 */
function parseVector3(str: string): Vector3 {
  const parts = str.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error('Invalid Vector3 format. Expected: x,y,z (e.g., "1,2,3")');
  }
  return { x: parts[0], y: parts[1], z: parts[2] };
}

/**
 * Format Vector3 for display
 */
function formatVector3(v: Vector3): string {
  return `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;
}

/**
 * Register Transform command
 */
export function registerTransformCommand(program: Command): void {
  const transformCmd = program
    .command('transform')
    .alias('tf')
    .description('Manipulate Unity Transform components');

  // Get transform
  transformCmd
    .command('get')
    .description('Get Transform information')
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

        logger.info(`Getting Transform: ${name}`);

        // Get position, rotation, scale
        const position = await client.sendRequest<Vector3>(
          COMMANDS.TRANSFORM_GET_POSITION,
          { name }
        );
        const rotation = await client.sendRequest<Vector3>(
          COMMANDS.TRANSFORM_GET_ROTATION,
          { name }
        );
        const scale = await client.sendRequest<Vector3>(
          COMMANDS.TRANSFORM_GET_SCALE,
          { name }
        );

        client.disconnect();

        logger.info('✓ Transform:');
        logger.info(`  Position: ${formatVector3(position)}`);
        logger.info(`  Rotation: ${formatVector3(rotation)}°`);
        logger.info(`  Scale: ${formatVector3(scale)}`);
      } catch (error) {
        logger.error('Failed to get Transform', error);
        process.exit(1);
      }
    });

  // Set position
  transformCmd
    .command('set-position')
    .description('Set Transform position')
    .argument('<name>', 'GameObject name or path')
    .argument('<position>', 'Position as "x,y,z" (e.g., "1,2,3")')
    .action(async (name, positionStr) => {
      try {
        const position = parseVector3(positionStr);

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

        logger.info(`Setting position: ${name} → ${formatVector3(position)}`);
        await client.sendRequest(COMMANDS.TRANSFORM_SET_POSITION, {
          name,
          position,
        });

        client.disconnect();

        logger.info('✓ Position set');
      } catch (error) {
        logger.error('Failed to set position', error);
        process.exit(1);
      }
    });

  // Set rotation
  transformCmd
    .command('set-rotation')
    .description('Set Transform rotation (Euler angles)')
    .argument('<name>', 'GameObject name or path')
    .argument('<rotation>', 'Rotation as "x,y,z" degrees (e.g., "0,90,0")')
    .action(async (name, rotationStr) => {
      try {
        const rotation = parseVector3(rotationStr);

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

        logger.info(`Setting rotation: ${name} → ${formatVector3(rotation)}°`);
        await client.sendRequest(COMMANDS.TRANSFORM_SET_ROTATION, {
          name,
          rotation,
        });

        client.disconnect();

        logger.info('✓ Rotation set');
      } catch (error) {
        logger.error('Failed to set rotation', error);
        process.exit(1);
      }
    });

  // Set scale
  transformCmd
    .command('set-scale')
    .description('Set Transform scale')
    .argument('<name>', 'GameObject name or path')
    .argument('<scale>', 'Scale as "x,y,z" (e.g., "1,1,1")')
    .action(async (name, scaleStr) => {
      try {
        const scale = parseVector3(scaleStr);

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

        logger.info(`Setting scale: ${name} → ${formatVector3(scale)}`);
        await client.sendRequest(COMMANDS.TRANSFORM_SET_SCALE, {
          name,
          scale,
        });

        client.disconnect();

        logger.info('✓ Scale set');
      } catch (error) {
        logger.error('Failed to set scale', error);
        process.exit(1);
      }
    });
}
