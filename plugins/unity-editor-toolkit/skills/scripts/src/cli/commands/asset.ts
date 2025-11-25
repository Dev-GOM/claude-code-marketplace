/**
 * Asset command
 *
 * Unity Asset management commands (ScriptableObject creation, modification, etc.)
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Register Asset command
 */
export function registerAssetCommand(program: Command): void {
  const assetCmd = program
    .command('asset')
    .description('Unity Asset management commands (ScriptableObject, etc.)');

  // List ScriptableObject types
  assetCmd
    .command('list-types')
    .description('List available ScriptableObject types')
    .option('--filter <pattern>', 'Filter types by pattern (supports * wildcard)')
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

        interface TypeInfo {
          fullName: string;
          name: string;
          assembly: string;
          namespaceName: string;
        }

        interface ListTypesResponse {
          success: boolean;
          types: TypeInfo[];
          count: number;
        }

        const params: { filter?: string } = {};
        if (options.filter) {
          params.filter = options.filter;
        }

        logger.info('Fetching ScriptableObject types...');
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<ListTypesResponse>(COMMANDS.ASSET_LIST_SO_TYPES, params, timeout);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Found ${result.count} ScriptableObject type(s):`);
          logger.info('');

          // Group by namespace
          const namespaces = new Map<string, TypeInfo[]>();
          for (const type of result.types) {
            const ns = type.namespaceName || '(No Namespace)';
            const list = namespaces.get(ns) || [];
            list.push(type);
            namespaces.set(ns, list);
          }

          for (const [ns, types] of namespaces.entries()) {
            logger.info(`[${ns}]`);
            for (const type of types) {
              logger.info(`  ${type.name}`);
              logger.info(`    Full: ${type.fullName}`);
              logger.info(`    Assembly: ${type.assembly}`);
            }
            logger.info('');
          }
        }
      } catch (error) {
        logger.error('Failed to list ScriptableObject types', error);
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

  // Create ScriptableObject
  assetCmd
    .command('create-so')
    .description('Create a new ScriptableObject asset')
    .argument('<typeName>', 'ScriptableObject type name (e.g., "GameConfig" or "MyGame.GameConfig")')
    .argument('<path>', 'Asset path (e.g., "Assets/Config/game.asset")')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (typeName, path, options) => {
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

        interface CreateResponse {
          success: boolean;
          path: string;
          typeName: string;
          message: string;
        }

        logger.info(`Creating ScriptableObject: ${typeName} at ${path}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<CreateResponse>(COMMANDS.ASSET_CREATE_SO, { typeName, path }, timeout);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
          logger.info(`  Type: ${result.typeName}`);
          logger.info(`  Path: ${result.path}`);
        }
      } catch (error) {
        logger.error(`Failed to create ScriptableObject '${typeName}'`, error);
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

  // Get ScriptableObject fields
  assetCmd
    .command('get-fields')
    .description('Get fields of a ScriptableObject')
    .argument('<path>', 'Asset path (e.g., "Assets/Config/game.asset")')
    .option('--expand', 'Expand array/list elements')
    .option('--depth <n>', 'Max depth for nested expansion', '3')
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

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        interface FieldInfo {
          name: string;
          displayName: string;
          type: string;
          value: string;
          isArray: boolean;
          arraySize: number;
          propertyPath?: string;
          elementType?: string;
          elements?: FieldInfo[];
        }

        interface GetFieldsResponse {
          success: boolean;
          path: string;
          typeName: string;
          fields: FieldInfo[];
          count: number;
        }

        const params: { path: string; expandArrays?: boolean; maxDepth?: number } = { path };
        if (options.expand) {
          params.expandArrays = true;
          params.maxDepth = parseInt(options.depth, 10) || 3;
        }

        logger.info(`Getting fields for: ${path}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<GetFieldsResponse>(COMMANDS.ASSET_GET_FIELDS, params, timeout);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Fields for ${result.typeName} (${result.path}):`);
          logger.info('');

          const printField = (field: FieldInfo, indent: string = '  ') => {
            const arrayInfo = field.isArray ? ` [Array: ${field.arraySize}]` : '';
            logger.info(`${indent}${field.displayName} (${field.name})`);
            logger.info(`${indent}  Type: ${field.type}${arrayInfo}`);
            if (field.elementType) {
              logger.info(`${indent}  Element Type: ${field.elementType}`);
            }
            logger.info(`${indent}  Value: ${field.value}`);

            // Print nested elements
            if (field.elements && field.elements.length > 0) {
              for (const element of field.elements) {
                printField(element, indent + '    ');
              }
            }
          };

          for (const field of result.fields) {
            printField(field);
          }
        }
      } catch (error) {
        logger.error(`Failed to get fields for '${path}'`, error);
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

  // Set ScriptableObject field
  assetCmd
    .command('set-field')
    .description('Set a field value of a ScriptableObject (supports array index: items[0], items[0].name)')
    .argument('<path>', 'Asset path (e.g., "Assets/Config/game.asset")')
    .argument('<fieldName>', 'Field name or path (e.g., "health", "items[0]", "items[2].name")')
    .argument('<value>', 'New value (format depends on type: "10" for int, "1.5" for float, "text" for string, "true/false" for bool, "x,y,z" for Vector3)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (path, fieldName, value, options) => {
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

        interface SetFieldResponse {
          success: boolean;
          path: string;
          fieldName: string;
          previousValue: string;
          newValue: string;
          message: string;
        }

        logger.info(`Setting field '${fieldName}' to '${value}' in ${path}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<SetFieldResponse>(COMMANDS.ASSET_SET_FIELD, { path, fieldName, value }, timeout);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
          logger.info(`  Previous: ${result.previousValue}`);
          logger.info(`  New: ${result.newValue}`);
        }
      } catch (error) {
        logger.error(`Failed to set field '${fieldName}'`, error);
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

  // Inspect ScriptableObject
  assetCmd
    .command('inspect')
    .description('Inspect a ScriptableObject with full details (metadata + fields)')
    .argument('<path>', 'Asset path (e.g., "Assets/Config/game.asset")')
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

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        interface FieldInfo {
          name: string;
          displayName: string;
          type: string;
          value: string;
          isArray: boolean;
          arraySize: number;
        }

        interface Metadata {
          path: string;
          guid: string;
          typeName: string;
          typeNameShort: string;
          namespaceName: string;
          assemblyName: string;
          instanceId: number;
          name: string;
          hideFlags: string;
          userData: string;
        }

        interface InspectResponse {
          success: boolean;
          metadata: Metadata;
          fields: FieldInfo[];
          fieldCount: number;
        }

        logger.info(`Inspecting: ${path}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<InspectResponse>(COMMANDS.ASSET_INSPECT, { path }, timeout);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          const meta = result.metadata;
          logger.info(`✓ Asset Inspection: ${meta.name}`);
          logger.info('');
          logger.info('=== Metadata ===');
          logger.info(`  Path: ${meta.path}`);
          logger.info(`  GUID: ${meta.guid}`);
          logger.info(`  Type: ${meta.typeName}`);
          logger.info(`  Namespace: ${meta.namespaceName || '(none)'}`);
          logger.info(`  Assembly: ${meta.assemblyName}`);
          logger.info(`  Instance ID: ${meta.instanceId}`);
          logger.info(`  Hide Flags: ${meta.hideFlags}`);
          logger.info('');
          logger.info(`=== Fields (${result.fieldCount}) ===`);

          for (const field of result.fields) {
            const arrayInfo = field.isArray ? ` [Array: ${field.arraySize}]` : '';
            logger.info(`  ${field.displayName} (${field.name})`);
            logger.info(`    Type: ${field.type}${arrayInfo}`);
            logger.info(`    Value: ${field.value}`);
          }
        }
      } catch (error) {
        logger.error(`Failed to inspect '${path}'`, error);
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

  // Add array element
  assetCmd
    .command('add-element')
    .description('Add an element to an array/list field')
    .argument('<path>', 'Asset path (e.g., "Assets/Config/game.asset")')
    .argument('<fieldName>', 'Array field name (e.g., "items", "enemies")')
    .option('--value <value>', 'Initial value for the new element')
    .option('--index <n>', 'Insert position (-1 = end)', '-1')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (path, fieldName, options) => {
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

        interface AddElementResponse {
          success: boolean;
          path: string;
          fieldName: string;
          index: number;
          newSize: number;
          message: string;
        }

        const params: { path: string; fieldName: string; index?: number; value?: string } = { path, fieldName };
        const index = parseInt(options.index, 10);
        if (!isNaN(index)) {
          params.index = index;
        }
        if (options.value !== undefined) {
          params.value = options.value;
        }

        logger.info(`Adding element to '${fieldName}' in ${path}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<AddElementResponse>(COMMANDS.ASSET_ADD_ARRAY_ELEMENT, params, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
          logger.info(`  New size: ${result.newSize}`);
        }
      } catch (error) {
        logger.error(`Failed to add element to '${fieldName}'`, error);
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

  // Remove array element
  assetCmd
    .command('remove-element')
    .description('Remove an element from an array/list field')
    .argument('<path>', 'Asset path (e.g., "Assets/Config/game.asset")')
    .argument('<fieldName>', 'Array field name (e.g., "items", "enemies")')
    .argument('<index>', 'Index of element to remove')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (path, fieldName, indexStr, options) => {
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

        interface RemoveElementResponse {
          success: boolean;
          path: string;
          fieldName: string;
          removedIndex: number;
          removedValue: string;
          newSize: number;
          message: string;
        }

        const index = parseInt(indexStr, 10);
        if (isNaN(index) || index < 0) {
          throw new Error(`Invalid index: ${indexStr}`);
        }

        logger.info(`Removing element at index ${index} from '${fieldName}' in ${path}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<RemoveElementResponse>(COMMANDS.ASSET_REMOVE_ARRAY_ELEMENT, { path, fieldName, index }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
          logger.info(`  Removed value: ${result.removedValue}`);
          logger.info(`  New size: ${result.newSize}`);
        }
      } catch (error) {
        logger.error(`Failed to remove element from '${fieldName}'`, error);
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

  // Get array element
  assetCmd
    .command('get-element')
    .description('Get a specific element from an array/list field')
    .argument('<path>', 'Asset path (e.g., "Assets/Config/game.asset")')
    .argument('<fieldName>', 'Array field name (e.g., "items", "enemies")')
    .argument('<index>', 'Index of element to get')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (path, fieldName, indexStr, options) => {
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

        interface FieldInfo {
          name: string;
          displayName: string;
          type: string;
          value: string;
          isArray: boolean;
          arraySize: number;
          propertyPath?: string;
          elementType?: string;
          elements?: FieldInfo[];
        }

        interface GetElementResponse {
          success: boolean;
          path: string;
          fieldName: string;
          index: number;
          element: FieldInfo;
        }

        const index = parseInt(indexStr, 10);
        if (isNaN(index) || index < 0) {
          throw new Error(`Invalid index: ${indexStr}`);
        }

        logger.info(`Getting element at index ${index} from '${fieldName}' in ${path}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<GetElementResponse>(COMMANDS.ASSET_GET_ARRAY_ELEMENT, { path, fieldName, index }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Element [${result.index}] from '${result.fieldName}':`);
          logger.info('');

          const printField = (field: FieldInfo, indent: string = '  ') => {
            const arrayInfo = field.isArray ? ` [Array: ${field.arraySize}]` : '';
            logger.info(`${indent}${field.displayName} (${field.name})`);
            logger.info(`${indent}  Type: ${field.type}${arrayInfo}`);
            logger.info(`${indent}  Value: ${field.value}`);

            if (field.elements && field.elements.length > 0) {
              for (const element of field.elements) {
                printField(element, indent + '    ');
              }
            }
          };

          printField(result.element);
        }
      } catch (error) {
        logger.error(`Failed to get element from '${fieldName}'`, error);
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

  // Clear array
  assetCmd
    .command('clear-array')
    .description('Clear all elements from an array/list field')
    .argument('<path>', 'Asset path (e.g., "Assets/Config/game.asset")')
    .argument('<fieldName>', 'Array field name (e.g., "items", "enemies")')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (path, fieldName, options) => {
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

        interface ClearArrayResponse {
          success: boolean;
          path: string;
          fieldName: string;
          previousSize: number;
          newSize: number;
          message: string;
        }

        logger.info(`Clearing array '${fieldName}' in ${path}`);
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<ClearArrayResponse>(COMMANDS.ASSET_CLEAR_ARRAY, { path, fieldName }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
          logger.info(`  Previous size: ${result.previousSize}`);
          logger.info(`  New size: ${result.newSize}`);
        }
      } catch (error) {
        logger.error(`Failed to clear array '${fieldName}'`, error);
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
