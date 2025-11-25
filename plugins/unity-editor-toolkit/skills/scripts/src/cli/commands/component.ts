/**
 * Component command
 *
 * Manipulate Unity Components on GameObjects.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import type {
  ComponentInfo,
  ComponentListResult,
  PropertyInfo,
  GetComponentResult,
  SetPropertyResult,
  InspectComponentResult,
} from '@/unity/protocol';
import { output, outputJson } from '@/utils/output-formatter';

/**
 * Register Component command
 */
export function registerComponentCommand(program: Command): void {
  const compCmd = program
    .command('component')
    .alias('comp')
    .description('Manipulate Unity Components on GameObjects');

  // List components
  compCmd
    .command('list')
    .description('List all components on a GameObject')
    .argument('<gameobject>', 'GameObject name or path')
    .option('--include-disabled', 'Include disabled components')
    .option('--type-only', 'Show only component types')
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

        logger.info(`Listing components on '${gameobject}'...`);
        const result = await client.sendRequest<ComponentListResult>(
          COMMANDS.COMPONENT_LIST,
          { name: gameobject, includeDisabled: options.includeDisabled }
        );

        if (!result) {
          logger.error('Failed to list components');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson(result);
          return;
        }

        // Text output
        logger.info(`✓ Components on '${gameobject}':`);

        if (result.count === 0) {
          logger.info('  (No components)');
          return;
        }

        for (const comp of result.components) {
          let icon = '●'; // Active built-in component
          if (!comp.enabled) icon = '○'; // Disabled component
          if (comp.isMonoBehaviour) icon = '★'; // MonoBehaviour

          if (options.typeOnly) {
            logger.info(`  ${icon} ${comp.type}`);
          } else {
            const status = comp.enabled ? '' : ' (disabled)';
            logger.info(`  ${icon} ${comp.type}${status}`);
          }
        }

        logger.info(`\n  Total: ${result.count} component(s)`);
      } catch (error) {
        logger.error('Failed to list components', error);
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

  // Add component
  compCmd
    .command('add')
    .description('Add a component to a GameObject')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name (e.g., Rigidbody, BoxCollider, AudioSource)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, options) => {
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

        logger.info(`Adding component to '${gameobject}': ${component}`);
        const result = await client.sendRequest<ComponentInfo>(
          COMMANDS.COMPONENT_ADD,
          { name: gameobject, componentType: component }
        );

        if (!result) {
          logger.error('Failed to add component');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson({ success: true, component: result });
          return;
        }

        // Text output
        logger.info('✓ Component added:');
        logger.info(`  Type: ${result.type}`);
        logger.info(`  Full Name: ${result.fullTypeName}`);
        logger.info(`  Enabled: ${result.enabled}`);
        logger.info(`  Is MonoBehaviour: ${result.isMonoBehaviour}`);
        logger.info('\n  Tip: Use Ctrl+Z in Unity Editor to undo');
      } catch (error) {
        logger.error('Failed to add component', error);
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

  // Remove component
  compCmd
    .command('remove')
    .description('Remove a component from a GameObject')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name')
    .option('--force', 'Confirm removal without prompt')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, options) => {
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

        logger.info(`Removing component from '${gameobject}': ${component}`);
        const result = await client.sendRequest<{ success: boolean }>(
          COMMANDS.COMPONENT_REMOVE,
          { name: gameobject, componentType: component }
        );

        if (!result?.success) {
          logger.error('Failed to remove component');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson({ success: true });
          return;
        }

        // Text output
        logger.info('✓ Component removed:');
        logger.info(`  Type: ${component}`);
        logger.info('\n  Tip: Use Ctrl+Z in Unity Editor to undo');
      } catch (error) {
        logger.error('Failed to remove component', error);
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

  // Enable component
  compCmd
    .command('enable')
    .description('Enable a component on a GameObject')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, options) => {
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

        logger.info(`Enabling component on '${gameobject}': ${component}`);
        const result = await client.sendRequest<{ success: boolean; enabled: boolean }>(
          COMMANDS.COMPONENT_SET_ENABLED,
          { name: gameobject, componentType: component, enabled: true }
        );

        if (!result?.success) {
          logger.error('Failed to enable component');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson({ success: true, enabled: result.enabled });
          return;
        }

        // Text output
        logger.info('✓ Component enabled:');
        logger.info(`  Type: ${component}`);
        logger.info(`  Enabled: ${result.enabled}`);
      } catch (error) {
        logger.error('Failed to enable component', error);
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

  // Disable component
  compCmd
    .command('disable')
    .description('Disable a component on a GameObject')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, options) => {
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

        logger.info(`Disabling component on '${gameobject}': ${component}`);
        const result = await client.sendRequest<{ success: boolean; enabled: boolean }>(
          COMMANDS.COMPONENT_SET_ENABLED,
          { name: gameobject, componentType: component, enabled: false }
        );

        if (!result?.success) {
          logger.error('Failed to disable component');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson({ success: true, enabled: result.enabled });
          return;
        }

        // Text output
        logger.info('✓ Component disabled:');
        logger.info(`  Type: ${component}`);
        logger.info(`  Enabled: ${result.enabled}`);
      } catch (error) {
        logger.error('Failed to disable component', error);
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

  // Get component properties
  compCmd
    .command('get')
    .description('Get component properties')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name')
    .argument('[property]', 'Optional: specific property name (if not specified, list all properties)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, property, options) => {
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

        if (property) {
          logger.info(`Getting property '${property}' from ${component} on '${gameobject}'...`);
        } else {
          logger.info(`Getting properties from ${component} on '${gameobject}'...`);
        }

        const result = property
          ? await client.sendRequest<PropertyInfo>(
              COMMANDS.COMPONENT_GET,
              { name: gameobject, componentType: component, property }
            )
          : await client.sendRequest<GetComponentResult>(
              COMMANDS.COMPONENT_GET,
              { name: gameobject, componentType: component }
            );

        if (!result) {
          logger.error('Failed to get component properties');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson(result);
          return;
        }

        // Text output for single property
        if (property && 'name' in result) {
          logger.info('✓ Property value:');
          logger.info(`  Name: ${result.name}`);
          logger.info(`  Type: ${result.type}`);
          logger.info(`  Value: ${JSON.stringify(result.value)}`);
          return;
        }

        // Text output for all properties
        if ('properties' in result) {
          logger.info(`✓ Properties of ${component}:`);
          logger.info('');

          const props = result.properties;
          if (props.length === 0) {
            logger.info('  (No properties)');
          } else {
            const maxNameLen = Math.max(...props.map((p) => p.name.length));
            for (const prop of props) {
              const paddedName = prop.name.padEnd(maxNameLen);
              logger.info(`  ${paddedName}  : ${prop.type} = ${JSON.stringify(prop.value)}`);
            }
          }
        }
      } catch (error) {
        logger.error('Failed to get component properties', error);
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

  // Set component property
  compCmd
    .command('set')
    .description('Set a component property')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name')
    .argument('<property>', 'Property name')
    .argument('<value>', 'New value (parsed as JSON, or use string for text)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, property, value, options) => {
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

        logger.info(`Setting ${component}.${property} = ${value} on '${gameobject}'...`);
        const result = await client.sendRequest<SetPropertyResult>(
          COMMANDS.COMPONENT_SET,
          { name: gameobject, componentType: component, property, value }
        );

        if (!result?.success) {
          logger.error('Failed to set component property');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson(result);
          return;
        }

        // Text output
        logger.info('✓ Property updated:');
        logger.info(`  Property: ${result.property}`);
        logger.info(`  Old Value: ${JSON.stringify(result.oldValue)}`);
        logger.info(`  New Value: ${JSON.stringify(result.newValue)}`);
        logger.info('\n  Tip: Use Ctrl+Z in Unity Editor to undo');
      } catch (error) {
        logger.error('Failed to set component property', error);
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

  // Inspect component
  compCmd
    .command('inspect')
    .description('Inspect a component (show all properties and state)')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, options) => {
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

        logger.info(`Inspecting ${component} on '${gameobject}'...`);
        const result = await client.sendRequest<InspectComponentResult>(
          COMMANDS.COMPONENT_INSPECT,
          { name: gameobject, componentType: component }
        );

        if (!result) {
          logger.error('Failed to inspect component');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson(result);
          return;
        }

        // Text output
        logger.info('✓ Component Inspection:');
        logger.info('');
        logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        logger.info(`  ${result.componentType}`);
        logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        const icon = result.enabled ? '●' : '○';
        const typeLabel = result.isMonoBehaviour ? '★' : '●';

        logger.info(`  ${typeLabel} Type: ${result.fullTypeName}`);
        logger.info(`  ${icon} Enabled: ${result.enabled}`);
        logger.info('');

        if (result.properties.length === 0) {
          logger.info('  (No properties)');
        } else {
          const maxNameLen = Math.max(...result.properties.map((p) => p.name.length));
          for (const prop of result.properties) {
            const paddedName = prop.name.padEnd(maxNameLen);
            logger.info(`    ${paddedName}  : ${prop.type} = ${JSON.stringify(prop.value)}`);
          }
        }

        logger.info('');
        logger.info(`  Total: ${result.propertyCount} properties`);
      } catch (error) {
        logger.error('Failed to inspect component', error);
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

  // Move component up
  compCmd
    .command('move-up')
    .description('Move a component up in the component list')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, options) => {
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

        logger.info(`Moving ${component} up on '${gameobject}'...`);
        const result = await client.sendRequest<{ success: boolean }>(
          COMMANDS.COMPONENT_MOVE_UP,
          { name: gameobject, componentType: component }
        );

        if (!result?.success) {
          logger.error('Failed to move component up');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson({ success: true });
          return;
        }

        // Text output
        logger.info('✓ Component moved up:');
        logger.info(`  Type: ${component}`);
        logger.info('  Position: moved to higher index');
        logger.info('\n  Tip: Use Ctrl+Z in Unity Editor to undo');
      } catch (error) {
        logger.error('Failed to move component up', error);
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

  // Move component down
  compCmd
    .command('move-down')
    .description('Move a component down in the component list')
    .argument('<gameobject>', 'GameObject name or path')
    .argument('<component>', 'Component type name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameobject, component, options) => {
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

        logger.info(`Moving ${component} down on '${gameobject}'...`);
        const result = await client.sendRequest<{ success: boolean }>(
          COMMANDS.COMPONENT_MOVE_DOWN,
          { name: gameobject, componentType: component }
        );

        if (!result?.success) {
          logger.error('Failed to move component down');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson({ success: true });
          return;
        }

        // Text output
        logger.info('✓ Component moved down:');
        logger.info(`  Type: ${component}`);
        logger.info('  Position: moved to lower index');
        logger.info('\n  Tip: Use Ctrl+Z in Unity Editor to undo');
      } catch (error) {
        logger.error('Failed to move component down', error);
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

  // Copy component
  compCmd
    .command('copy')
    .description('Copy a component from one GameObject to another')
    .argument('<source>', 'Source GameObject name or path')
    .argument('<component>', 'Component type name')
    .argument('<target>', 'Target GameObject name or path')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (source, component, target, options) => {
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

        logger.info(`Copying ${component} from '${source}' to '${target}'...`);
        const result = await client.sendRequest<{ success: boolean }>(
          COMMANDS.COMPONENT_COPY,
          { source, componentType: component, target }
        );

        if (!result?.success) {
          logger.error('Failed to copy component');
          process.exit(1);
        }

        // JSON output
        if (options.json) {
          outputJson({ success: true });
          return;
        }

        // Text output
        logger.info('✓ Component copied:');
        logger.info(`  Type: ${component}`);
        logger.info(`  From: ${source}`);
        logger.info(`  To: ${target}`);
        logger.info('\n  Tip: Use Ctrl+Z in Unity Editor to undo');
      } catch (error) {
        logger.error('Failed to copy component', error);
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
