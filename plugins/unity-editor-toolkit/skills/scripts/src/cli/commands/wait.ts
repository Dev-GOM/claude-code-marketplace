/**
 * Wait command
 *
 * Wait for various Unity conditions (compilation, play mode, scene load, sleep)
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Register Wait command
 */
export function registerWaitCommand(program: Command): void {
  const waitCmd = program
    .command('wait')
    .description('Wait for Unity conditions');

  // Wait for compilation
  waitCmd
    .command('compile')
    .description('Wait for Unity compilation to complete')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'Timeout in milliseconds', '300000')
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

        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest(COMMANDS.WAIT_WAIT, {
          type: 'compile',
          timeout: timeout / 1000, // Convert to seconds
        }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info('✓ Compilation completed');
        }
      } catch (error) {
        logger.error('Failed to wait for compilation', error);
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

  // Wait for play mode
  waitCmd
    .command('playmode <state>')
    .description('Wait for play mode state (enter, exit, pause)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'Timeout in milliseconds', '300000')
    .action(async (state, options) => {
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

        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest(COMMANDS.WAIT_WAIT, {
          type: 'playmode',
          value: state,
          timeout: timeout / 1000,
        }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Play mode ${state} completed`);
        }
      } catch (error) {
        logger.error(`Failed to wait for play mode ${state}`, error);
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

  // Sleep
  waitCmd
    .command('sleep <seconds>')
    .description('Sleep for specified seconds')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'Timeout in milliseconds (must be > sleep duration)', '300000')
    .action(async (seconds, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        const sleepSeconds = parseFloat(seconds);
        if (isNaN(sleepSeconds) || sleepSeconds <= 0) {
          logger.error('Sleep duration must be a positive number');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest(COMMANDS.WAIT_WAIT, {
          type: 'sleep',
          seconds: sleepSeconds,
          timeout: timeout / 1000,
        }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Slept for ${sleepSeconds} seconds`);
        }
      } catch (error) {
        logger.error('Failed to sleep', error);
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

  // Wait for scene load
  waitCmd
    .command('scene')
    .description('Wait for scene to finish loading (play mode only)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'Timeout in milliseconds', '300000')
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

        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest(COMMANDS.WAIT_WAIT, {
          type: 'scene',
          timeout: timeout / 1000,
        }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info('✓ Scene loading completed');
        }
      } catch (error) {
        logger.error('Failed to wait for scene load', error);
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
