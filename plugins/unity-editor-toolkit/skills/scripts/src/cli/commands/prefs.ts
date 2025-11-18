/**
 * Prefs command
 *
 * Unity EditorPrefs management commands
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { outputJson } from '@/utils/output-formatter';

/**
 * EditorPrefs response types
 */
interface PrefsGetResponse {
  success: boolean;
  key: string;
  value: string | number | boolean;
  type: string;
}

interface PrefsSetResponse {
  success: boolean;
}

interface PrefsDeleteResponse {
  success: boolean;
}

interface PrefsHasKeyResponse {
  success: boolean;
  hasKey: boolean;
  type?: string;
  value?: string | number | boolean;
}

interface PrefsClearResponse {
  success: boolean;
}

/**
 * Register Prefs command
 */
export function registerPrefsCommand(program: Command): void {
  const prefsCmd = program
    .command('prefs')
    .description('Unity EditorPrefs management commands');

  // Get EditorPrefs value
  prefsCmd
    .command('get')
    .description('Get EditorPrefs value')
    .argument('<key>', 'EditorPrefs key name')
    .option('-t, --type <type>', 'Value type (string|int|float|bool)', 'string')
    .option('-d, --default <value>', 'Default value if key does not exist')
    .option('--json', 'Output in JSON format')
    .action(async (key, options) => {
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

        // Determine which command to use based on type
        let command: string;
        switch (options.type) {
          case 'int':
            command = 'Prefs.GetInt';
            break;
          case 'float':
            command = 'Prefs.GetFloat';
            break;
          case 'bool':
            command = 'Prefs.GetBool';
            break;
          default:
            command = 'Prefs.GetString';
        }

        logger.info(`Getting EditorPrefs value: ${key}`);
        const result = await client.sendRequest<PrefsGetResponse>(command, {
          key,
          defaultValue: options.default,
        });

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ EditorPrefs value retrieved`);
          logger.info(`Key: ${result.key}`);
          logger.info(`Type: ${result.type}`);
          logger.info(`Value: ${result.value}`);
        }
      } catch (error) {
        logger.error('Failed to get EditorPrefs value', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
            logger.info('Disconnected from Unity Editor');
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Set EditorPrefs value
  prefsCmd
    .command('set')
    .description('Set EditorPrefs value')
    .argument('<key>', 'EditorPrefs key name')
    .argument('<value>', 'Value to set')
    .option('-t, --type <type>', 'Value type (string|int|float|bool)', 'string')
    .option('--json', 'Output in JSON format')
    .action(async (key, value, options) => {
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

        // Determine which command to use based on type
        let command: string;
        switch (options.type) {
          case 'int':
            command = 'Prefs.SetInt';
            break;
          case 'float':
            command = 'Prefs.SetFloat';
            break;
          case 'bool':
            command = 'Prefs.SetBool';
            break;
          default:
            command = 'Prefs.SetString';
        }

        logger.info(`Setting EditorPrefs value: ${key} = ${value}`);
        const result = await client.sendRequest<PrefsSetResponse>(command, { key, value });

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ EditorPrefs value set`);
          logger.info(`Key: ${key}`);
          logger.info(`Value: ${value}`);
          logger.info(`Type: ${options.type}`);
        }
      } catch (error) {
        logger.error('Failed to set EditorPrefs value', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
            logger.info('Disconnected from Unity Editor');
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Delete EditorPrefs key
  prefsCmd
    .command('delete')
    .description('Delete EditorPrefs key')
    .argument('<key>', 'EditorPrefs key name')
    .option('--json', 'Output in JSON format')
    .action(async (key, options) => {
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

        logger.info(`Deleting EditorPrefs key: ${key}`);
        const result = await client.sendRequest<PrefsDeleteResponse>('Prefs.DeleteKey', { key });

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ EditorPrefs key deleted`);
          logger.info(`Key: ${key}`);
        }
      } catch (error) {
        logger.error('Failed to delete EditorPrefs key', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
            logger.info('Disconnected from Unity Editor');
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Clear all EditorPrefs
  prefsCmd
    .command('clear')
    .description('Delete all EditorPrefs (WARNING: irreversible)')
    .option('--json', 'Output in JSON format')
    .option('--force', 'Skip confirmation prompt')
    .action(async (options) => {
      let client = null;
      try {
        // Confirmation prompt (unless --force)
        if (!options.force) {
          logger.warn('WARNING: This will delete ALL EditorPrefs data!');
          logger.warn('This action cannot be undone.');
          logger.info('Use --force flag to skip this confirmation.');
          process.exit(1);
        }

        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);

        logger.info('Connecting to Unity Editor...');
        await client.connect();

        logger.info('Deleting all EditorPrefs...');
        const result = await client.sendRequest<PrefsClearResponse>('Prefs.DeleteAll');

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info('✓ All EditorPrefs deleted');
        }
      } catch (error) {
        logger.error('Failed to delete all EditorPrefs', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
            logger.info('Disconnected from Unity Editor');
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Check if EditorPrefs key exists
  prefsCmd
    .command('has')
    .description('Check if EditorPrefs key exists')
    .argument('<key>', 'EditorPrefs key name')
    .option('--json', 'Output in JSON format')
    .action(async (key, options) => {
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

        logger.info(`Checking if EditorPrefs key exists: ${key}`);
        const result = await client.sendRequest<PrefsHasKeyResponse>('Prefs.HasKey', { key });

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Check complete`);
          logger.info(`Key: ${key}`);
          logger.info(`Exists: ${result.hasKey ? 'Yes' : 'No'}`);

          // 키가 존재하고 값이 있으면 타입과 값도 출력
          if (result.hasKey && result.type && result.value !== undefined) {
            logger.info(`Type: ${result.type}`);
            logger.info(`Value: ${result.value}`);
          }
        }
      } catch (error) {
        logger.error('Failed to check EditorPrefs key', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
            logger.info('Disconnected from Unity Editor');
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });
}
