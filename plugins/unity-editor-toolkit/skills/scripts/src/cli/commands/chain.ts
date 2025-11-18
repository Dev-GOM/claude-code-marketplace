/**
 * Chain command
 *
 * Execute multiple Unity commands sequentially
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';
import * as fs from 'fs';
import * as path from 'path';

interface CommandEntry {
  method: string;
  parameters?: object;
}

/**
 * Register Chain command
 */
export function registerChainCommand(program: Command): void {
  const chainCmd = program
    .command('chain')
    .description('Execute multiple Unity commands sequentially');

  // Execute from JSON file
  chainCmd
    .command('execute <file>')
    .description('Execute commands from JSON file')
    .option('--json', 'Output in JSON format')
    .option('--stop-on-error', 'Stop on first error (default: true)', true)
    .option('--continue-on-error', 'Continue on error')
    .option('--timeout <ms>', 'Timeout in milliseconds', '300000')
    .action(async (file, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        // Read and parse JSON file
        const filePath = path.resolve(file);
        if (!fs.existsSync(filePath)) {
          logger.error(`File not found: ${filePath}`);
          process.exit(1);
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        let commands: CommandEntry[];

        try {
          const parsed = JSON.parse(fileContent);
          commands = Array.isArray(parsed) ? parsed : parsed.commands;

          if (!Array.isArray(commands)) {
            logger.error('Invalid JSON format. Expected array or object with "commands" property.');
            process.exit(1);
          }
        } catch (error) {
          logger.error('Failed to parse JSON file', error);
          process.exit(1);
        }

        // Validate commands
        for (let i = 0; i < commands.length; i++) {
          const cmd = commands[i];
          if (!cmd.method) {
            logger.error(`Command at index ${i} is missing "method" property`);
            process.exit(1);
          }
        }

        logger.info(`Executing ${commands.length} command(s) from ${file}...`);

        client = createUnityClient(port);
        await client.connect();

        const timeout = parseInt(options.timeout, 10);
        const stopOnError = options.continueOnError ? false : options.stopOnError;

        interface ChainResult {
          success: boolean;
          totalCommands: number;
          executedCommands: number;
          totalElapsed: number;
          results: Array<{
            index: number;
            method: string;
            success: boolean;
            result?: object;
            error?: string;
            elapsed: number;
          }>;
        }

        const result = await client.sendRequest<ChainResult>(COMMANDS.CHAIN_EXECUTE, {
          commands,
          stopOnError,
        }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Chain execution completed`);
          logger.info(`  Total commands: ${result.totalCommands}`);
          logger.info(`  Executed: ${result.executedCommands}`);
          logger.info(`  Total time: ${result.totalElapsed.toFixed(3)}s`);

          // Display results
          for (const cmdResult of result.results) {
            const status = cmdResult.success ? '✓' : '✗';
            const message = cmdResult.success ? 'Success' : `Error: ${cmdResult.error}`;
            logger.info(`  [${cmdResult.index + 1}] ${status} ${cmdResult.method} (${cmdResult.elapsed.toFixed(3)}s)`);
            if (!cmdResult.success) {
              logger.error(`      ${message}`);
            }
          }
        }

        // Exit with error if any command failed
        const anyFailed = result.results.some(r => !r.success);
        if (anyFailed) {
          process.exit(1);
        }
      } catch (error) {
        logger.error('Failed to execute chain', error);
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

  // Execute inline commands
  chainCmd
    .command('exec <commands...>')
    .description('Execute commands inline (format: method:param1=value1,param2=value2)')
    .option('--json', 'Output in JSON format')
    .option('--stop-on-error', 'Stop on first error (default: true)', true)
    .option('--continue-on-error', 'Continue on error')
    .option('--timeout <ms>', 'Timeout in milliseconds', '300000')
    .action(async (commandStrings, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        // Parse inline commands
        const commands: CommandEntry[] = commandStrings.map((cmdStr: string, index: number) => {
          const parts = cmdStr.split(':');
          if (parts.length < 1) {
            logger.error(`Invalid command format at index ${index}: ${cmdStr}`);
            process.exit(1);
          }

          const method = parts[0];
          let parameters: object | undefined = undefined;

          if (parts.length > 1) {
            // Parse parameters (format: key1=value1,key2=value2)
            const paramStr = parts.slice(1).join(':');
            parameters = {};
            const paramPairs = paramStr.split(',');
            for (const pair of paramPairs) {
              const [key, value] = pair.split('=');
              if (key && value !== undefined) {
                // Try to parse value as number or boolean
                let parsedValue: string | number | boolean = value;
                if (value === 'true') parsedValue = true;
                else if (value === 'false') parsedValue = false;
                else if (!isNaN(Number(value))) parsedValue = Number(value);

                (parameters as Record<string, unknown>)[key] = parsedValue;
              }
            }
          }

          return { method, parameters };
        });

        logger.info(`Executing ${commands.length} inline command(s)...`);

        client = createUnityClient(port);
        await client.connect();

        const timeout = parseInt(options.timeout, 10);
        const stopOnError = options.continueOnError ? false : options.stopOnError;

        interface ChainResult {
          success: boolean;
          totalCommands: number;
          executedCommands: number;
          totalElapsed: number;
          results: Array<{
            index: number;
            method: string;
            success: boolean;
            result?: object;
            error?: string;
            elapsed: number;
          }>;
        }

        const result = await client.sendRequest<ChainResult>(COMMANDS.CHAIN_EXECUTE, {
          commands,
          stopOnError,
        }, timeout);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Chain execution completed`);
          logger.info(`  Total commands: ${result.totalCommands}`);
          logger.info(`  Executed: ${result.executedCommands}`);
          logger.info(`  Total time: ${result.totalElapsed.toFixed(3)}s`);

          // Display results
          for (const cmdResult of result.results) {
            const status = cmdResult.success ? '✓' : '✗';
            const message = cmdResult.success ? 'Success' : `Error: ${cmdResult.error}`;
            logger.info(`  [${cmdResult.index + 1}] ${status} ${cmdResult.method} (${cmdResult.elapsed.toFixed(3)}s)`);
            if (!cmdResult.success) {
              logger.error(`      ${message}`);
            }
          }
        }

        // Exit with error if any command failed
        const anyFailed = result.results.some(r => !r.success);
        if (anyFailed) {
          process.exit(1);
        }
      } catch (error) {
        logger.error('Failed to execute chain', error);
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
