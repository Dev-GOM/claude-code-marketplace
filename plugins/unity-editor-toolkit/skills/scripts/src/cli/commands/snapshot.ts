/**
 * Snapshot command
 *
 * Save and restore Unity scene snapshots to/from database.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Snapshot result interfaces
 */
interface SnapshotSaveResult {
  success: boolean;
  snapshotId: number;
  snapshotName: string;
  sceneName: string;
  scenePath: string;
  objectCount: number;
  message: string;
}

interface SnapshotInfo {
  snapshotId: number;
  sceneId: number;
  sceneName: string;
  scenePath: string;
  snapshotName: string;
  description: string;
  createdAt: string;
}

interface SnapshotListResult {
  success: boolean;
  count: number;
  snapshots: SnapshotInfo[];
}

interface SnapshotGetResult {
  success: boolean;
  snapshotId: number;
  sceneId: number;
  sceneName: string;
  scenePath: string;
  snapshotName: string;
  description: string;
  createdAt: string;
  objectCount: number;
  data: unknown;
}

interface SnapshotRestoreResult {
  success: boolean;
  snapshotId: number;
  snapshotName: string;
  sceneName: string;
  restoredObjects: number;
  message: string;
}

interface SnapshotDeleteResult {
  success: boolean;
  snapshotId: number;
  snapshotName: string;
  message: string;
}

/**
 * Register Snapshot command
 */
export function registerSnapshotCommand(program: Command): void {
  const snapshotCmd = program
    .command('snapshot')
    .description('Save and restore Unity scene snapshots');

  // Save snapshot
  snapshotCmd
    .command('save')
    .description('Save current scene state as a snapshot')
    .argument('<name>', 'Snapshot name')
    .option('-d, --description <text>', 'Snapshot description')
    .option('--json', 'Output in JSON format')
    .action(async (name: string, options) => {
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

        logger.info(`Saving snapshot: ${name}`);
        const result = await client.sendRequest<SnapshotSaveResult>(
          COMMANDS.SNAPSHOT_SAVE,
          {
            name,
            description: options.description || '',
          }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Snapshot saved successfully');
        logger.info(`  ID: ${result.snapshotId}`);
        logger.info(`  Name: ${result.snapshotName}`);
        logger.info(`  Scene: ${result.sceneName}`);
        logger.info(`  Objects: ${result.objectCount}`);
      } catch (error) {
        logger.error('Failed to save snapshot', error);
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

  // List snapshots
  snapshotCmd
    .command('list')
    .description('List all snapshots')
    .option('-a, --all', 'List snapshots for all scenes')
    .option('-n, --limit <number>', 'Maximum number of snapshots to show', '50')
    .option('--json', 'Output in JSON format')
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

        logger.info('Fetching snapshots...');
        const result = await client.sendRequest<SnapshotListResult>(
          COMMANDS.SNAPSHOT_LIST,
          {
            allScenes: options.all || false,
            limit: parseInt(options.limit, 10),
          }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        if (result.count === 0) {
          logger.info('No snapshots found');
          return;
        }

        logger.info(`✓ Found ${result.count} snapshot(s)`);

        for (const snapshot of result.snapshots) {
          logger.info(`[${snapshot.snapshotId}] ${snapshot.snapshotName}`);
          logger.info(`   Scene: ${snapshot.sceneName} (${snapshot.scenePath})`);
          logger.info(`   Created: ${snapshot.createdAt}`);
          if (snapshot.description) {
            logger.info(`   Description: ${snapshot.description}`);
          }
        }
      } catch (error) {
        logger.error('Failed to list snapshots', error);
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

  // Get snapshot details
  snapshotCmd
    .command('get')
    .description('Get snapshot details by ID')
    .argument('<id>', 'Snapshot ID')
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

        const snapshotId = parseInt(id, 10);
        if (isNaN(snapshotId)) {
          logger.error('Invalid snapshot ID');
          process.exit(1);
        }

        logger.info(`Fetching snapshot ${snapshotId}...`);
        const result = await client.sendRequest<SnapshotGetResult>(
          COMMANDS.SNAPSHOT_GET,
          { snapshotId }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Snapshot Details:');
        logger.info(`  ID: ${result.snapshotId}`);
        logger.info(`  Name: ${result.snapshotName}`);
        logger.info(`  Scene: ${result.sceneName} (${result.scenePath})`);
        logger.info(`  Objects: ${result.objectCount}`);
        logger.info(`  Created: ${result.createdAt}`);
        if (result.description) {
          logger.info(`  Description: ${result.description}`);
        }
      } catch (error) {
        logger.error('Failed to get snapshot', error);
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

  // Restore snapshot
  snapshotCmd
    .command('restore')
    .description('Restore scene from snapshot')
    .argument('<id>', 'Snapshot ID')
    .option('-c, --clear', 'Clear current scene before restoring')
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

        const snapshotId = parseInt(id, 10);
        if (isNaN(snapshotId)) {
          logger.error('Invalid snapshot ID');
          process.exit(1);
        }

        logger.info(`Restoring snapshot ${snapshotId}...`);
        const result = await client.sendRequest<SnapshotRestoreResult>(
          COMMANDS.SNAPSHOT_RESTORE,
          {
            snapshotId,
            clearScene: options.clear || false,
          }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Snapshot restored successfully');
        logger.info(`  Snapshot: ${result.snapshotName}`);
        logger.info(`  Scene: ${result.sceneName}`);
        logger.info(`  Restored Objects: ${result.restoredObjects}`);
      } catch (error) {
        logger.error('Failed to restore snapshot', error);
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

  // Delete snapshot
  snapshotCmd
    .command('delete')
    .description('Delete a snapshot')
    .argument('<id>', 'Snapshot ID')
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

        const snapshotId = parseInt(id, 10);
        if (isNaN(snapshotId)) {
          logger.error('Invalid snapshot ID');
          process.exit(1);
        }

        logger.info(`Deleting snapshot ${snapshotId}...`);
        const result = await client.sendRequest<SnapshotDeleteResult>(
          COMMANDS.SNAPSHOT_DELETE,
          { snapshotId }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Snapshot deleted successfully');
        logger.info(`  ID: ${result.snapshotId}`);
        logger.info(`  Name: ${result.snapshotName}`);
      } catch (error) {
        logger.error('Failed to delete snapshot', error);
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
