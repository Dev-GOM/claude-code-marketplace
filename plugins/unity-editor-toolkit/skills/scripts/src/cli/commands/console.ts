/**
 * Console command
 *
 * Access Unity console logs.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { UnityLogType } from '@/constants';
import type { ConsoleLogEntry } from '@/unity/protocol';

/**
 * Get log type icon
 */
function getLogTypeIcon(type: number): string {
  switch (type) {
    case UnityLogType.ERROR:
    case UnityLogType.EXCEPTION:
      return '❌';
    case UnityLogType.WARNING:
      return '⚠️ ';
    case UnityLogType.ASSERT:
      return '🔴';
    default:
      return 'ℹ️ ';
  }
}

/**
 * Get log type name
 */
function getLogTypeName(type: number): string {
  switch (type) {
    case UnityLogType.ERROR:
      return 'ERROR';
    case UnityLogType.ASSERT:
      return 'ASSERT';
    case UnityLogType.WARNING:
      return 'WARN';
    case UnityLogType.LOG:
      return 'LOG';
    case UnityLogType.EXCEPTION:
      return 'EXCEPTION';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Register Console command
 */
export function registerConsoleCommand(program: Command): void {
  const consoleCmd = program
    .command('console')
    .description('Access Unity console logs');

  // Get logs
  consoleCmd
    .command('logs')
    .description('Get Unity console logs')
    .option('-n, --count <number>', 'Number of recent logs to fetch', '50')
    .option('-e, --errors-only', 'Show only errors and exceptions')
    .option('-w, --warnings', 'Include warnings')
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

        logger.info('Fetching console logs...');
        const result = await client.sendRequest<ConsoleLogEntry[]>(
          COMMANDS.CONSOLE_GET_LOGS,
          {
            count: parseInt(options.count, 10),
            errorsOnly: options.errorsOnly || false,
            includeWarnings: options.warnings || false,
          }
        );

        if (!result || result.length === 0) {
          logger.info('No logs found');
          return;
        }

        logger.info('✓ Unity Console Logs:');
        logger.info('━'.repeat(80));

        for (const log of result) {
          const icon = getLogTypeIcon(log.type);
          const typeName = getLogTypeName(log.type);
          logger.info(`${icon} [${log.timestamp}] [${typeName}]`);
          logger.info(`   ${log.message}`);

          if (log.stackTrace && log.stackTrace.trim()) {
            logger.info('   Stack Trace:');
            const stackLines = log.stackTrace.split('\n');
            for (const line of stackLines.slice(0, 5)) {
              // Show first 5 lines
              logger.info(`     ${line}`);
            }
            if (stackLines.length > 5) {
              logger.info(`     ... (${stackLines.length - 5} more lines)`);
            }
          }

          logger.info('');
        }

        logger.info('━'.repeat(80));
        logger.info(`Total: ${result.length} log(s)`);
      } catch (error) {
        logger.error('Failed to get console logs', error);
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

  // Clear console
  consoleCmd
    .command('clear')
    .description('Clear Unity console logs')
    .action(async () => {
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

        logger.info('Clearing console logs...');
        await client.sendRequest(COMMANDS.CONSOLE_CLEAR);

        logger.info('✓ Console cleared');
      } catch (error) {
        logger.error('Failed to clear console', error);
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
