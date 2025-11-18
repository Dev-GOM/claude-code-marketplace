/**
 * Analytics command
 *
 * Get project and scene analytics, manage cache
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Analytics result interfaces
 */
interface ComponentStat {
  componentType: string;
  count: number;
}

interface ProjectStatsResult {
  success: boolean;
  totalScenes: number;
  totalObjects: number;
  totalComponents: number;
  totalTransforms: number;
  totalSnapshots: number;
  commandHistoryCount: number;
  topComponents: ComponentStat[];
}

interface SceneStatsResult {
  success: boolean;
  sceneName: string;
  scenePath: string;
  sceneId: number;
  objectCount: number;
  componentCount: number;
  snapshotCount: number;
  transformHistoryCount: number;
  message: string;
}

interface CacheResult {
  success: boolean;
  key: string;
  message: string;
}

interface GetCacheResult {
  success: boolean;
  key: string;
  data: string | null;
  message: string;
}

interface ClearCacheResult {
  success: boolean;
  deletedCount: number;
  message: string;
}

interface CacheEntry {
  cacheId: number;
  cacheKey: string;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
}

interface ListCacheResult {
  success: boolean;
  count: number;
  entries: CacheEntry[];
}

/**
 * Register Analytics command
 */
export function registerAnalyticsCommand(program: Command): void {
  const analyticsCmd = program
    .command('analytics')
    .description('Get project and scene analytics, manage cache');

  // Get project-wide statistics
  analyticsCmd
    .command('project-stats')
    .description('Get project-wide statistics')
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

        logger.info('Getting project statistics...');
        const result = await client.sendRequest<ProjectStatsResult>(
          COMMANDS.ANALYTICS_PROJECT_STATS
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Project Statistics:');
        logger.info(`  Scenes: ${result.totalScenes}`);
        logger.info(`  Objects: ${result.totalObjects}`);
        logger.info(`  Components: ${result.totalComponents}`);
        logger.info(`  Transforms: ${result.totalTransforms}`);
        logger.info(`  Snapshots: ${result.totalSnapshots}`);
        logger.info(`  Command History: ${result.commandHistoryCount}`);

        if (result.topComponents && result.topComponents.length > 0) {
          logger.info('  Top Components:');
          result.topComponents.forEach((c, index) => {
            logger.info(`    ${index + 1}. ${c.componentType}: ${c.count}`);
          });
        }
      } catch (error) {
        logger.error('Failed to get project stats', error);
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

  // Get current scene statistics
  analyticsCmd
    .command('scene-stats')
    .description('Get current scene statistics')
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

        logger.info('Getting scene statistics...');
        const result = await client.sendRequest<SceneStatsResult>(
          COMMANDS.ANALYTICS_SCENE_STATS
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info('✓ Scene Statistics:');
        logger.info(`  Scene: ${result.sceneName}`);
        logger.info(`  Path: ${result.scenePath}`);
        logger.info(`  Objects: ${result.objectCount}`);
        logger.info(`  Components: ${result.componentCount}`);
        logger.info(`  Snapshots: ${result.snapshotCount}`);
        logger.info(`  Transform History: ${result.transformHistoryCount}`);
        logger.info(`  ${result.message}`);
      } catch (error) {
        logger.error('Failed to get scene stats', error);
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

  // Set cache data
  analyticsCmd
    .command('set-cache')
    .description('Set cache data')
    .argument('<key>', 'Cache key')
    .argument('<data>', 'Cache data (JSON string)')
    .option('-t, --ttl <seconds>', 'Time to live in seconds', '3600')
    .option('--json', 'Output in JSON format')
    .action(async (key: string, data: string, options) => {
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

        logger.info(`Setting cache: ${key}`);
        const result = await client.sendRequest<CacheResult>(
          COMMANDS.ANALYTICS_SET_CACHE,
          {
            key,
            data,
            ttl: parseInt(options.ttl, 10),
          }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ ${result.message}`);
      } catch (error) {
        logger.error('Failed to set cache', error);
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

  // Get cache data
  analyticsCmd
    .command('get-cache')
    .description('Get cache data')
    .argument('<key>', 'Cache key')
    .option('--json', 'Output in JSON format')
    .action(async (key: string, options) => {
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

        logger.info(`Getting cache: ${key}`);
        const result = await client.sendRequest<GetCacheResult>(
          COMMANDS.ANALYTICS_GET_CACHE,
          { key }
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        if (result.success && result.data) {
          logger.info(`✓ Cache Data:`);
          logger.info(result.data);
        } else {
          logger.info(`❌ ${result.message}`);
        }
      } catch (error) {
        logger.error('Failed to get cache', error);
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

  // Clear cache
  analyticsCmd
    .command('clear-cache')
    .description('Clear cache data')
    .argument('[key]', 'Cache key (omit to clear all)')
    .option('--json', 'Output in JSON format')
    .action(async (key: string | undefined, options) => {
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

        logger.info('Clearing cache...');
        const result = await client.sendRequest<ClearCacheResult>(
          COMMANDS.ANALYTICS_CLEAR_CACHE,
          key ? { key } : {}
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ ${result.message}`);
      } catch (error) {
        logger.error('Failed to clear cache', error);
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

  // List all cache entries
  analyticsCmd
    .command('list-cache')
    .description('List all cache entries')
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

        logger.info('Listing cache entries...');
        const result = await client.sendRequest<ListCacheResult>(
          COMMANDS.ANALYTICS_LIST_CACHE
        );

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Cache Entries (${result.count}):`);
        result.entries.forEach((entry) => {
          const expiredMark = entry.isExpired ? '⚠️ Expired' : '✓ Valid';
          logger.info(`  [${entry.cacheId}] ${entry.cacheKey} - ${expiredMark}`);
          logger.info(`      Created: ${entry.createdAt}`);
          logger.info(`      Expires: ${entry.expiresAt}`);
        });
      } catch (error) {
        logger.error('Failed to list cache', error);
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
