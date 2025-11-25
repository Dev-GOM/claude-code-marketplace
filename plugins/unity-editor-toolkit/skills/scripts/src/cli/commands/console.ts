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
import { outputJson } from '@/utils/output-formatter';

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
    .option('-n, --limit <number>', 'Number of recent logs to fetch', '50')
    .option('-e, --errors-only', 'Show only errors and exceptions')
    .option('-w, --warnings', 'Include warnings')
    .option('-t, --type <type>', 'Filter by log type: error, warning, log, exception, assert')
    .option('-f, --filter <text>', 'Filter logs by text (case-insensitive)')
    .option('-s, --stack', 'Show stack traces (default: title only)')
    .option('--stack-lines <number>', 'Number of stack trace lines to show (default: 5)', '5')
    .option('-v, --verbose', 'Show full messages and complete stack traces')
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

        let result = await client.sendRequest<ConsoleLogEntry[]>(
          COMMANDS.CONSOLE_GET_LOGS,
          {
            count: parseInt(options.limit, 10),
            errorsOnly: options.errorsOnly || false,
            includeWarnings: options.warnings || false,
          }
        );

        // Apply type filter if provided (overrides --errors-only and --warnings)
        if (options.type) {
          const typeFilter = options.type.toLowerCase();
          const typeMap: { [key: string]: number } = {
            'error': UnityLogType.ERROR,
            'warning': UnityLogType.WARNING,
            'log': UnityLogType.LOG,
            'exception': UnityLogType.EXCEPTION,
            'assert': UnityLogType.ASSERT,
          };

          const targetType = typeMap[typeFilter];
          if (targetType === undefined) {
            logger.error(`Invalid log type: ${options.type}. Valid types: error, warning, log, exception, assert`);
            process.exit(1);
          }

          result = result.filter(log => log.type === targetType);
        }

        // Apply text filter if provided
        if (options.filter) {
          const filterText = options.filter.toLowerCase();
          result = result.filter(log =>
            log.message.toLowerCase().includes(filterText) ||
            (log.stackTrace && log.stackTrace.toLowerCase().includes(filterText))
          );
        }

        if (!result || result.length === 0) {
          if (options.json) {
            outputJson({ logs: [], total: 0, filter: options.filter || null });
          } else {
            logger.info(options.filter ? `No logs found matching filter: "${options.filter}"` : 'No logs found');
          }
          return;
        }

        // JSON output
        if (options.json) {
          outputJson({
            logs: result.map(log => ({
              type: getLogTypeName(log.type),
              timestamp: log.timestamp,
              message: log.message,
              stackTrace: log.stackTrace || null,
            })),
            total: result.length,
            filter: options.filter || null,
          });
          return;
        }

        // Text output
        logger.info('✓ Unity Console Logs:');

        const showStack = options.stack || options.verbose;
        const stackLineCount = options.verbose ? Infinity : parseInt(options.stackLines, 10);

        for (const log of result) {
          const icon = getLogTypeIcon(log.type);
          const typeName = getLogTypeName(log.type);

          // Extract first line as title (or full message if --verbose)
          const messageLines = log.message.split('\n');
          const title = messageLines[0];

          // 타임스탬프가 있으면 표시, 없으면 생략
          const timestampPart = log.timestamp ? `[${log.timestamp}] ` : '';

          if (options.verbose) {
            // Show full message
            logger.info(`${icon} ${timestampPart}[${typeName}]`);
            logger.info('Stack Trace:');
            for (const line of messageLines) {
              logger.info(line);
            }
          } else {
            // Show title only (first line) - single line format
            logger.info(`${icon} ${timestampPart}[${typeName}] ${title}`);
          }

          // Show stack trace if --stack or --verbose
          if (showStack && log.stackTrace && log.stackTrace.trim()) {
            if (!options.verbose) {
              logger.info('Stack Trace:');
            }
            const stackLines = log.stackTrace.split('\n').filter(line => line.trim());

            // Show specified number of lines
            const linesToShow = stackLineCount === Infinity ? stackLines : stackLines.slice(0, stackLineCount);
            for (const line of linesToShow) {
              logger.info(line);
            }

            if (stackLineCount !== Infinity && stackLines.length > stackLineCount) {
              logger.info(`... (${stackLines.length - stackLineCount} more lines, use --verbose to see all)`);
            }
          }
        }

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

        await client.sendRequest(COMMANDS.CONSOLE_CLEAR);

        if (options.json) {
          outputJson({ success: true, message: 'Console cleared' });
        } else {
          logger.info('✓ Console cleared');
        }
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
