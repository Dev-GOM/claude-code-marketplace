/**
 * Transform History command
 *
 * Track and restore GameObject transform changes in database.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Transform history result interfaces
 */
interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

interface Vector4Data {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface TransformHistoryEntry {
  transformId: number;
  position: Vector3Data;
  rotation: Vector4Data;
  scale: Vector3Data;
  recordedAt: string;
}

interface RecordResult {
  success: boolean;
  transformId: number;
  objectId: number;
  objectName: string;
  position: Vector3Data;
  rotation: Vector4Data;
  scale: Vector3Data;
  message: string;
}

interface ListResult {
  success: boolean;
  objectName: string;
  objectId: number;
  count: number;
  history: TransformHistoryEntry[];
}

interface RestoreResult {
  success: boolean;
  transformId: number;
  objectName: string;
  position: Vector3Data;
  rotation: Vector4Data;
  scale: Vector3Data;
  message: string;
}

interface CompareResult {
  success: boolean;
  transform1: TransformHistoryEntry;
  transform2: TransformHistoryEntry;
  positionDifference: Vector3Data;
  rotationAngleDifference: number;
  scaleDifference: Vector3Data;
}

interface ClearResult {
  success: boolean;
  objectName: string;
  objectId: number;
  deletedCount: number;
  message: string;
}

/**
 * Register Transform History command
 */
export function registerTransformHistoryCommand(program: Command): void {
  const historyCmd = program
    .command('transform-history')
    .alias('th')
    .description('Track and restore GameObject transform changes');

  // Record current transform
  historyCmd
    .command('record')
    .description('Record current transform state')
    .argument('<target>', 'GameObject name or path')
    .option('--json', 'Output in JSON format')
    .action(async (target: string, options) => {
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

        logger.info(`Recording transform for: ${target}`);
        const result = await client.sendRequest<RecordResult>(
          COMMANDS.TRANSFORM_HISTORY_RECORD,
          { target }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Transform recorded');
        logger.info(`  ID: ${result.transformId}`);
        logger.info(`  Object: ${result.objectName}`);
        logger.info(`  Position: (${result.position.x.toFixed(3)}, ${result.position.y.toFixed(3)}, ${result.position.z.toFixed(3)})`);
        logger.info(`  Scale: (${result.scale.x.toFixed(3)}, ${result.scale.y.toFixed(3)}, ${result.scale.z.toFixed(3)})`);
      } catch (error) {
        logger.error('Failed to record transform', error);
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

  // List transform history
  historyCmd
    .command('list')
    .description('List transform history for a GameObject')
    .argument('<target>', 'GameObject name or path')
    .option('-n, --limit <number>', 'Maximum number of entries', '50')
    .option('--json', 'Output in JSON format')
    .action(async (target: string, options) => {
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

        logger.info(`Fetching transform history for: ${target}`);
        const result = await client.sendRequest<ListResult>(
          COMMANDS.TRANSFORM_HISTORY_LIST,
          { target, limit: parseInt(options.limit, 10) }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        if (result.count === 0) {
          logger.info(`No transform history found for '${result.objectName}'`);
          return;
        }

        logger.info(`✓ Transform history for '${result.objectName}' (${result.count} entries)`);

        for (const entry of result.history) {
          logger.info(`[${entry.transformId}] ${entry.recordedAt}`);
          logger.info(`   Position: (${entry.position.x.toFixed(3)}, ${entry.position.y.toFixed(3)}, ${entry.position.z.toFixed(3)})`);
          logger.info(`   Scale: (${entry.scale.x.toFixed(3)}, ${entry.scale.y.toFixed(3)}, ${entry.scale.z.toFixed(3)})`);
        }
      } catch (error) {
        logger.error('Failed to list transform history', error);
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

  // Restore transform
  historyCmd
    .command('restore')
    .description('Restore transform from history')
    .argument('<id>', 'Transform history ID')
    .option('--json', 'Output in JSON format')
    .action(async (id: string, options) => {
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

        const transformId = parseInt(id, 10);
        if (isNaN(transformId)) {
          logger.error('Invalid transform ID');
          process.exit(1);
        }

        logger.info(`Restoring transform ${transformId}...`);
        const result = await client.sendRequest<RestoreResult>(
          COMMANDS.TRANSFORM_HISTORY_RESTORE,
          { transformId }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Transform restored');
        logger.info(`  Object: ${result.objectName}`);
        logger.info(`  Position: (${result.position.x.toFixed(3)}, ${result.position.y.toFixed(3)}, ${result.position.z.toFixed(3)})`);
        logger.info(`  Scale: (${result.scale.x.toFixed(3)}, ${result.scale.y.toFixed(3)}, ${result.scale.z.toFixed(3)})`);
      } catch (error) {
        logger.error('Failed to restore transform', error);
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

  // Compare transforms
  historyCmd
    .command('compare')
    .description('Compare two transform records')
    .argument('<id1>', 'First transform history ID')
    .argument('<id2>', 'Second transform history ID')
    .option('--json', 'Output in JSON format')
    .action(async (id1: string, id2: string, options) => {
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

        const transformId1 = parseInt(id1, 10);
        const transformId2 = parseInt(id2, 10);

        if (isNaN(transformId1) || isNaN(transformId2)) {
          logger.error('Invalid transform ID(s)');
          process.exit(1);
        }

        logger.info(`Comparing transforms ${transformId1} and ${transformId2}...`);
        const result = await client.sendRequest<CompareResult>(
          COMMANDS.TRANSFORM_HISTORY_COMPARE,
          { transformId1, transformId2 }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Transform Comparison');

        logger.info(`Transform 1 (ID: ${result.transform1.transformId}):`);
        logger.info(`  Recorded: ${result.transform1.recordedAt}`);
        logger.info(`  Position: (${result.transform1.position.x.toFixed(3)}, ${result.transform1.position.y.toFixed(3)}, ${result.transform1.position.z.toFixed(3)})`);


        logger.info(`Transform 2 (ID: ${result.transform2.transformId}):`);
        logger.info(`  Recorded: ${result.transform2.recordedAt}`);
        logger.info(`  Position: (${result.transform2.position.x.toFixed(3)}, ${result.transform2.position.y.toFixed(3)}, ${result.transform2.position.z.toFixed(3)})`);

        logger.info('Differences:');
        logger.info(`  Position Δ: (${result.positionDifference.x.toFixed(3)}, ${result.positionDifference.y.toFixed(3)}, ${result.positionDifference.z.toFixed(3)})`);
        logger.info(`  Rotation Δ: ${result.rotationAngleDifference.toFixed(2)}°`);
        logger.info(`  Scale Δ: (${result.scaleDifference.x.toFixed(3)}, ${result.scaleDifference.y.toFixed(3)}, ${result.scaleDifference.z.toFixed(3)})`);

      } catch (error) {
        logger.error('Failed to compare transforms', error);
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

  // Clear transform history
  historyCmd
    .command('clear')
    .description('Clear transform history for a GameObject')
    .argument('<target>', 'GameObject name or path')
    .option('--json', 'Output in JSON format')
    .action(async (target: string, options) => {
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

        logger.info(`Clearing transform history for: ${target}`);
        const result = await client.sendRequest<ClearResult>(
          COMMANDS.TRANSFORM_HISTORY_CLEAR,
          { target }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Transform history cleared');
        logger.info(`  Object: ${result.objectName}`);
        logger.info(`  Deleted: ${result.deletedCount} records`);
      } catch (error) {
        logger.error('Failed to clear transform history', error);
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
