/**
 * Editor command
 *
 * Unity Editor utility commands (refresh, recompile, etc.)
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Register Editor command
 */
export function registerEditorCommand(program: Command): void {
  const editorCmd = program
    .command('editor')
    .description('Unity Editor utility commands');

  // Refresh AssetDatabase
  editorCmd
    .command('refresh')
    .description('Refresh Unity AssetDatabase')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
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

        logger.info('Refreshing AssetDatabase...');
        await client.sendRequest(COMMANDS.EDITOR_REFRESH);

        // JSON output
        if (options.json) {
          outputJson({
            success: true,
            message: 'AssetDatabase refreshed',
          });
        } else {
          logger.info('✓ AssetDatabase refreshed');
          logger.warn('⚠ Please check Unity Editor for compilation status');
        }
      } catch (error) {
        logger.error('Failed to refresh AssetDatabase', error);
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

  // Recompile scripts
  editorCmd
    .command('recompile')
    .description('Recompile Unity scripts')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
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

        logger.info('Requesting script recompilation...');
        await client.sendRequest(COMMANDS.EDITOR_RECOMPILE);

        // JSON output
        if (options.json) {
          outputJson({
            success: true,
            message: 'Script recompilation requested',
          });
        } else {
          logger.info('✓ Script recompilation requested');
          logger.warn('⚠ Please check Unity Editor for compilation status');
        }
      } catch (error) {
        logger.error('Failed to recompile scripts', error);
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

  // Reimport asset
  editorCmd
    .command('reimport')
    .description('Reimport asset at path')
    .argument('<path>', 'Asset path relative to Assets folder')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
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

        logger.info(`Reimporting asset: ${path}`);
        await client.sendRequest(COMMANDS.EDITOR_REIMPORT, { path });

        // JSON output
        if (options.json) {
          outputJson({
            success: true,
            path,
            message: 'Asset reimported',
          });
        } else {
          logger.info('✓ Asset reimported');
          logger.warn('⚠ Please check Unity Editor for compilation status');
        }
      } catch (error) {
        logger.error('Failed to reimport asset', error);
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

  // Execute method
  editorCmd
    .command('execute')
    .description('Execute a static method marked with [ExecutableMethod]')
    .argument('<commandName>', 'Command name to execute (e.g., reinstall-cli)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
    .action(async (commandName, options) => {
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

        interface ExecuteResponse {
          success: boolean;
          commandName: string;
          message: string;
        }

        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest<ExecuteResponse>(COMMANDS.EDITOR_EXECUTE, { commandName }, timeout);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
        }
      } catch (error) {
        logger.error(`Failed to execute command '${commandName}'`, error);
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

  // List executable methods
  editorCmd
    .command('list')
    .description('List all executable methods available via execute command')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '300000')
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

        interface ExecutableMethod {
          commandName: string;
          description: string;
          className: string;
          methodName: string;
        }

        interface ListResponse {
          success: boolean;
          count: number;
          methods: ExecutableMethod[];
        }

        const result = await client.sendRequest<ListResponse>(COMMANDS.EDITOR_LIST_EXECUTABLE);

        // JSON output
        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Found ${result.count} executable method(s):`);

          for (const method of result.methods) {
            logger.info(`  ${method.commandName}`);
            if (method.description) {
              logger.info(`    ${method.description}`);
            }
            logger.info(`    ${method.className}.${method.methodName}`);
          }
        }
      } catch (error) {
        logger.error('Failed to list executable methods', error);
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
