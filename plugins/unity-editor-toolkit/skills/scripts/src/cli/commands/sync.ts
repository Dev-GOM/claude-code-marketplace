/**
 * Sync command
 *
 * Sync Unity GameObjects and Components with database
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Sync result interfaces
 */
interface SyncResult {
  success: boolean;
  sceneName: string;
  sceneId: number;
  syncedObjects: number;
  syncedComponents: number;
  closureRecords: number;
  message: string;
}

interface SyncGameObjectResult {
  success: boolean;
  objectName: string;
  objectId: number;
  syncedComponents: number;
  syncedChildren: number;
  message: string;
}

interface SyncStatusResult {
  success: boolean;
  sceneName: string;
  unityObjectCount: number;
  dbObjectCount: number;
  dbComponentCount: number;
  closureRecordCount: number;
  inSync: boolean;
}

interface ClearSyncResult {
  success: boolean;
  deletedObjects: number;
  deletedComponents: number;
  message: string;
}

interface AutoSyncResult {
  success: boolean;
  message: string;
  isRunning: boolean;
}

interface AutoSyncStatusResult {
  success: boolean;
  isRunning: boolean;
  isInitialized: boolean;
  lastSyncTime: string | null;
  successfulSyncCount: number;
  failedSyncCount: number;
  syncIntervalMs: number;
  batchSize: number;
}

/**
 * Register Sync command
 */
export function registerSyncCommand(program: Command): void {
  const syncCmd = program
    .command('sync')
    .description('Sync Unity GameObjects and Components with database');

  // Sync entire scene
  syncCmd
    .command('scene')
    .description('Sync entire scene to database')
    .option('--no-clear', 'Do not clear existing data before sync')
    .option('--no-components', 'Do not sync components')
    .option('--no-closure', 'Do not build closure table')
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

        logger.info('Syncing scene to database...');
        const result = await client.sendRequest<SyncResult>(
          COMMANDS.SYNC_SCENE,
          {
            clearExisting: options.clear !== false,
            includeComponents: options.components !== false,
            buildClosure: options.closure !== false,
          }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Scene synced successfully');
        logger.info(`  Scene: ${result.sceneName}`);
        logger.info(`  Objects: ${result.syncedObjects}`);
        logger.info(`  Components: ${result.syncedComponents}`);
        logger.info(`  Closure Records: ${result.closureRecords}`);
      } catch (error) {
        logger.error('Failed to sync scene', error);
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

  // Sync specific GameObject
  syncCmd
    .command('object')
    .description('Sync specific GameObject to database')
    .argument('<target>', 'GameObject name or path')
    .option('--no-components', 'Do not sync components')
    .option('-c, --children', 'Include children')
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

        logger.info(`Syncing GameObject: ${target}`);
        const result = await client.sendRequest<SyncGameObjectResult>(
          COMMANDS.SYNC_GAMEOBJECT,
          {
            target,
            includeComponents: options.components !== false,
            includeChildren: options.children || false,
          }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ GameObject synced successfully');
        logger.info(`  Object: ${result.objectName}`);
        logger.info(`  Components: ${result.syncedComponents}`);
        logger.info(`  Children: ${result.syncedChildren}`);
      } catch (error) {
        logger.error('Failed to sync GameObject', error);
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

  // Get sync status
  syncCmd
    .command('status')
    .description('Get sync status for current scene')
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

        logger.info('Getting sync status...');
        const result = await client.sendRequest<SyncStatusResult>(
          COMMANDS.SYNC_STATUS
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Sync Status:');
        logger.info(`  Scene: ${result.sceneName}`);
        logger.info(`  Unity Objects: ${result.unityObjectCount}`);
        logger.info(`  DB Objects: ${result.dbObjectCount}`);
        logger.info(`  DB Components: ${result.dbComponentCount}`);
        logger.info(`  Closure Records: ${result.closureRecordCount}`);
        logger.info(`  In Sync: ${result.inSync ? '✓' : '❌'}`);
      } catch (error) {
        logger.error('Failed to get sync status', error);
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

  // Clear sync data
  syncCmd
    .command('clear')
    .description('Clear sync data from database')
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

        logger.info('Clearing sync data...');
        const result = await client.sendRequest<ClearSyncResult>(
          COMMANDS.SYNC_CLEAR
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Sync data cleared');
        logger.info(`  Deleted Objects: ${result.deletedObjects}`);
        logger.info(`  Deleted Components: ${result.deletedComponents}`);
      } catch (error) {
        logger.error('Failed to clear sync data', error);
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

  // Auto-sync start
  syncCmd
    .command('auto-start')
    .description('Start automatic synchronization')
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

        logger.info('Starting automatic synchronization...');
        const result = await client.sendRequest<AutoSyncResult>(
          COMMANDS.SYNC_START_AUTO
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ ${result.message}`);
        logger.info(`  Running: ${result.isRunning ? 'Yes' : 'No'}`);
      } catch (error) {
        logger.error('Failed to start auto-sync', error);
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

  // Auto-sync stop
  syncCmd
    .command('auto-stop')
    .description('Stop automatic synchronization')
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

        logger.info('Stopping automatic synchronization...');
        const result = await client.sendRequest<AutoSyncResult>(
          COMMANDS.SYNC_STOP_AUTO
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ ${result.message}`);
        logger.info(`  Running: ${result.isRunning ? 'Yes' : 'No'}`);
      } catch (error) {
        logger.error('Failed to stop auto-sync', error);
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

  // Auto-sync status
  syncCmd
    .command('auto-status')
    .description('Get automatic synchronization status')
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

        logger.info('Getting auto-sync status...');
        const result = await client.sendRequest<AutoSyncStatusResult>(
          COMMANDS.SYNC_GET_AUTO_STATUS
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Auto-Sync Status:');
        logger.info(`  Initialized: ${result.isInitialized ? '✓' : '✗'}`);
        logger.info(`  Running: ${result.isRunning ? '✓' : '✗'}`);
        if (result.lastSyncTime) {
          logger.info(`  Last Sync: ${result.lastSyncTime}`);
        }
        logger.info(`  Successful Syncs: ${result.successfulSyncCount}`);
        logger.info(`  Failed Syncs: ${result.failedSyncCount}`);
        logger.info(`  Sync Interval: ${result.syncIntervalMs}ms`);
        logger.info(`  Batch Size: ${result.batchSize}`);
      } catch (error) {
        logger.error('Failed to get auto-sync status', error);
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
