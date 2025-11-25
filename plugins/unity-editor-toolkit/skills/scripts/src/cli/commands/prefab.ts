/**
 * Prefab command
 *
 * Manipulate Unity Prefabs - instantiate, create, unpack, apply, revert, and more.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { output, outputJson } from '@/utils/output-formatter';

// Type definitions
interface Vector3Info {
  x: number;
  y: number;
  z: number;
}

interface InstantiateResult {
  success: boolean;
  instanceName: string;
  prefabPath: string;
  position: Vector3Info;
}

interface CreateResult {
  success: boolean;
  prefabPath: string;
  sourceName: string;
  isConnected: boolean;
}

interface ApplyResult {
  success: boolean;
  instanceName: string;
  prefabPath: string;
}

interface VariantResult {
  success: boolean;
  sourcePath: string;
  variantPath: string;
}

interface OverrideInfo {
  type: string;
  targetName: string;
  targetType: string;
}

interface GetOverridesResult {
  instanceName: string;
  hasOverrides: boolean;
  overrideCount: number;
  overrides: OverrideInfo[];
}

interface GetSourceResult {
  instanceName: string;
  isPrefabInstance: boolean;
  prefabPath: string | null;
  prefabType: string;
  prefabStatus?: string;
}

interface IsInstanceResult {
  name: string;
  isPrefabInstance: boolean;
  isPrefabAsset: boolean;
  isOutermostRoot: boolean;
  prefabType: string;
}

interface OpenResult {
  success: boolean;
  prefabPath: string;
  prefabName: string;
  stageRoot: string;
}

interface PrefabInfo {
  name: string;
  path: string;
  type: string;
  isVariant: boolean;
}

interface ListResult {
  count: number;
  searchPath: string;
  prefabs: PrefabInfo[];
}

/**
 * Register Prefab command
 */
export function registerPrefabCommand(program: Command): void {
  const prefabCmd = program
    .command('prefab')
    .description('Manipulate Unity Prefabs');

  // Instantiate prefab
  prefabCmd
    .command('instantiate')
    .alias('inst')
    .description('Instantiate a prefab in the scene')
    .argument('<path>', 'Prefab asset path (e.g., "Assets/Prefabs/Player.prefab")')
    .option('--name <name>', 'Name for the instantiated object')
    .option('--position <x,y,z>', 'Position to spawn at (e.g., "0,1,0")')
    .option('--rotation <x,y,z>', 'Rotation in euler angles (e.g., "0,90,0")')
    .option('--parent <gameobject>', 'Parent GameObject name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
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
        await client.connect();

        logger.info(`Instantiating prefab '${path}'...`);
        const result = await client.sendRequest<InstantiateResult>(
          COMMANDS.PREFAB_INSTANTIATE,
          {
            path,
            name: options.name,
            position: options.position,
            rotation: options.rotation,
            parent: options.parent,
          }
        );

        if (!result) {
          logger.error('Failed to instantiate prefab');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefab instantiated successfully`);
        logger.info(`  Instance: ${result.instanceName}`);
        logger.info(`  Prefab: ${result.prefabPath}`);
        if (result.position) {
          logger.info(`  Position: (${result.position.x}, ${result.position.y}, ${result.position.z})`);
        }
      } catch (error) {
        logger.error('Failed to instantiate prefab', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Create prefab from scene object
  prefabCmd
    .command('create')
    .description('Create a prefab from a scene GameObject')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<path>', 'Path to save prefab (e.g., "Assets/Prefabs/MyPrefab.prefab")')
    .option('--overwrite', 'Overwrite existing prefab')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, path, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        logger.info(`Creating prefab from '${gameobject}'...`);
        const result = await client.sendRequest<CreateResult>(
          COMMANDS.PREFAB_CREATE,
          { name: gameobject, path, overwrite: options.overwrite }
        );

        if (!result) {
          logger.error('Failed to create prefab');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefab created successfully`);
        logger.info(`  Source: ${result.sourceName}`);
        logger.info(`  Saved to: ${result.prefabPath}`);
        logger.info(`  Connected: ${result.isConnected ? 'Yes' : 'No'}`);
      } catch (error) {
        logger.error('Failed to create prefab', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Unpack prefab instance
  prefabCmd
    .command('unpack')
    .description('Unpack a prefab instance')
    .argument('<gameobject>', 'Prefab instance name or path')
    .option('--completely', 'Unpack completely (all nested prefabs)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        logger.info(`Unpacking prefab instance '${gameobject}'...`);
        const result = await client.sendRequest<{ success: boolean; unpackedObject: string; completely: boolean }>(
          COMMANDS.PREFAB_UNPACK,
          { name: gameobject, completely: options.completely }
        );

        if (!result) {
          logger.error('Failed to unpack prefab');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefab unpacked successfully`);
        logger.info(`  Object: ${result.unpackedObject}`);
        logger.info(`  Mode: ${result.completely ? 'Completely' : 'Outermost Root'}`);
      } catch (error) {
        logger.error('Failed to unpack prefab', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Apply prefab overrides
  prefabCmd
    .command('apply')
    .description('Apply prefab instance overrides to source prefab')
    .argument('<gameobject>', 'Prefab instance name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        logger.info(`Applying overrides from '${gameobject}'...`);
        const result = await client.sendRequest<ApplyResult>(
          COMMANDS.PREFAB_APPLY,
          { name: gameobject }
        );

        if (!result) {
          logger.error('Failed to apply prefab overrides');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Overrides applied to prefab`);
        logger.info(`  Instance: ${result.instanceName}`);
        logger.info(`  Prefab: ${result.prefabPath}`);
      } catch (error) {
        logger.error('Failed to apply prefab overrides', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Revert prefab overrides
  prefabCmd
    .command('revert')
    .description('Revert prefab instance overrides')
    .argument('<gameobject>', 'Prefab instance name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        logger.info(`Reverting overrides on '${gameobject}'...`);
        const result = await client.sendRequest<{ success: boolean; revertedObject: string }>(
          COMMANDS.PREFAB_REVERT,
          { name: gameobject }
        );

        if (!result) {
          logger.error('Failed to revert prefab overrides');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefab overrides reverted`);
        logger.info(`  Object: ${result.revertedObject}`);
      } catch (error) {
        logger.error('Failed to revert prefab overrides', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Create prefab variant
  prefabCmd
    .command('variant')
    .description('Create a prefab variant from an existing prefab')
    .argument('<sourcePath>', 'Source prefab path')
    .argument('<variantPath>', 'Path to save variant')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (sourcePath, variantPath, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        logger.info(`Creating variant of '${sourcePath}'...`);
        const result = await client.sendRequest<VariantResult>(
          COMMANDS.PREFAB_VARIANT,
          { sourcePath, variantPath }
        );

        if (!result) {
          logger.error('Failed to create prefab variant');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefab variant created`);
        logger.info(`  Source: ${result.sourcePath}`);
        logger.info(`  Variant: ${result.variantPath}`);
      } catch (error) {
        logger.error('Failed to create prefab variant', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Get prefab overrides
  prefabCmd
    .command('overrides')
    .alias('get-overrides')
    .description('Get list of overrides on a prefab instance')
    .argument('<gameobject>', 'Prefab instance name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        logger.info(`Getting overrides on '${gameobject}'...`);
        const result = await client.sendRequest<GetOverridesResult>(
          COMMANDS.PREFAB_GET_OVERRIDES,
          { name: gameobject }
        );

        if (!result) {
          logger.error('Failed to get prefab overrides');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Overrides on '${result.instanceName}':`);

        if (!result.hasOverrides) {
          logger.info('  (No overrides)');
          return;
        }

        for (const ov of result.overrides) {
          let icon = '●';
          if (ov.type === 'AddedComponent') icon = '+';
          if (ov.type === 'RemovedComponent') icon = '-';
          if (ov.type === 'AddedGameObject') icon = '★';
          logger.info(`  ${icon} [${ov.type}] ${ov.targetName} (${ov.targetType})`);
        }

        logger.info(`\n  Total: ${result.overrideCount} override(s)`);
      } catch (error) {
        logger.error('Failed to get prefab overrides', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Get source prefab
  prefabCmd
    .command('source')
    .alias('get-source')
    .description('Get source prefab path of a prefab instance')
    .argument('<gameobject>', 'GameObject name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        logger.info(`Getting source prefab of '${gameobject}'...`);
        const result = await client.sendRequest<GetSourceResult>(
          COMMANDS.PREFAB_GET_SOURCE,
          { name: gameobject }
        );

        if (!result) {
          logger.error('Failed to get source prefab');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefab info for '${result.instanceName}':`);
        logger.info(`  Is Prefab Instance: ${result.isPrefabInstance ? 'Yes' : 'No'}`);
        if (result.isPrefabInstance) {
          logger.info(`  Prefab Path: ${result.prefabPath}`);
          logger.info(`  Prefab Type: ${result.prefabType}`);
          if (result.prefabStatus) {
            logger.info(`  Status: ${result.prefabStatus}`);
          }
        }
      } catch (error) {
        logger.error('Failed to get source prefab', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Check if is prefab instance
  prefabCmd
    .command('is-instance')
    .description('Check if a GameObject is a prefab instance')
    .argument('<gameobject>', 'GameObject name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        logger.info(`Checking if '${gameobject}' is a prefab instance...`);
        const result = await client.sendRequest<IsInstanceResult>(
          COMMANDS.PREFAB_IS_INSTANCE,
          { name: gameobject }
        );

        if (!result) {
          logger.error('Failed to check prefab status');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefab status for '${result.name}':`);
        logger.info(`  Is Prefab Instance: ${result.isPrefabInstance ? 'Yes' : 'No'}`);
        logger.info(`  Is Prefab Asset: ${result.isPrefabAsset ? 'Yes' : 'No'}`);
        logger.info(`  Is Outermost Root: ${result.isOutermostRoot ? 'Yes' : 'No'}`);
        logger.info(`  Prefab Type: ${result.prefabType}`);
      } catch (error) {
        logger.error('Failed to check prefab status', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Open prefab in edit mode
  prefabCmd
    .command('open')
    .description('Open a prefab in prefab editing mode')
    .argument('<path>', 'Prefab asset path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
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
        await client.connect();

        logger.info(`Opening prefab '${path}'...`);
        const result = await client.sendRequest<OpenResult>(
          COMMANDS.PREFAB_OPEN,
          { path }
        );

        if (!result) {
          logger.error('Failed to open prefab');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefab opened in edit mode`);
        logger.info(`  Prefab: ${result.prefabName}`);
        logger.info(`  Path: ${result.prefabPath}`);
        if (result.stageRoot) {
          logger.info(`  Stage Root: ${result.stageRoot}`);
        }
      } catch (error) {
        logger.error('Failed to open prefab', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // Close prefab edit mode
  prefabCmd
    .command('close')
    .description('Close prefab editing mode and return to scene')
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
        await client.connect();

        logger.info('Closing prefab edit mode...');
        const result = await client.sendRequest<{ success: boolean; closedPrefab?: string; message?: string }>(
          COMMANDS.PREFAB_CLOSE,
          {}
        );

        if (!result) {
          logger.error('Failed to close prefab');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        if (result.closedPrefab) {
          logger.info(`✓ Prefab edit mode closed`);
          logger.info(`  Closed: ${result.closedPrefab}`);
        } else {
          logger.info(`✓ ${result.message || 'No prefab was open'}`);
        }
      } catch (error) {
        logger.error('Failed to close prefab', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });

  // List prefabs in folder
  prefabCmd
    .command('list')
    .description('List all prefabs in a folder')
    .option('--path <path>', 'Folder path to search (default: "Assets")')
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
        await client.connect();

        const searchPath = options.path || 'Assets';
        logger.info(`Listing prefabs in '${searchPath}'...`);
        const result = await client.sendRequest<ListResult>(
          COMMANDS.PREFAB_LIST,
          { path: options.path }
        );

        if (!result) {
          logger.error('Failed to list prefabs');
          process.exit(1);
        }

        if (options.json) {
          outputJson(result);
          return;
        }

        logger.info(`✓ Prefabs in '${result.searchPath}':`);

        if (result.count === 0) {
          logger.info('  (No prefabs found)');
          return;
        }

        for (const prefab of result.prefabs) {
          const icon = prefab.isVariant ? '◇' : '●';
          const type = prefab.isVariant ? ' [Variant]' : '';
          logger.info(`  ${icon} ${prefab.name}${type}`);
          logger.info(`    ${prefab.path}`);
        }

        logger.info(`\n  Total: ${result.count} prefab(s)`);
      } catch (error) {
        logger.error('Failed to list prefabs', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            // Ignore
          }
        }
      }
    });
}
