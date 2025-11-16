/**
 * Database command
 *
 * SQLite database management commands (connect, disconnect, reset, status)
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

// Response types
interface DatabaseStatusResponse {
  isInitialized: boolean;
  isConnected: boolean;
  isEnabled: boolean;
  databaseFilePath: string;
  databaseFileExists: boolean;
  undoCount: number;
  redoCount: number;
}

interface OperationResponse {
  success: boolean;
  message: string;
}

interface MigrationResponse extends OperationResponse {
  migrationsApplied: number;
}

/**
 * Register Database command
 */
export function registerDatabaseCommand(program: Command): void {
  const dbCmd = program
    .command('db')
    .description('SQLite database management commands');

  // Status
  dbCmd
    .command('status')
    .description('Get database connection status')
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

        logger.info('Getting database status...');
        const result = await client.sendRequest(COMMANDS.DATABASE_STATUS) as DatabaseStatusResponse;

        if (options.json) {
          outputJson(result);
        } else {
          logger.info('✓ Database Status');
          logger.info(`  Initialized: ${result.isInitialized ? '✓' : '❌'}`);
          logger.info(`  Connected: ${result.isConnected ? '✓' : '❌'}`);
          logger.info(`  Enabled: ${result.isEnabled ? '✓' : '❌'}`);
          logger.info(`  File Path: ${result.databaseFilePath}`);
          logger.info(`  File Exists: ${result.databaseFileExists ? '✓' : '❌'}`);
          logger.info(`  Undo Stack: ${result.undoCount}`);
          logger.info(`  Redo Stack: ${result.redoCount}`);
        }
      } catch (error) {
        logger.error('Failed to get database status', error);
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

  // Connect
  dbCmd
    .command('connect')
    .description('Connect to SQLite database')
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

        logger.info('Connecting to database...');
        const result = await client.sendRequest(COMMANDS.DATABASE_CONNECT) as OperationResponse;

        if (options.json) {
          outputJson(result);
        } else {
          if (result.success) {
            logger.info(`✓ ${result.message}`);
          } else {
            logger.error(`❌ ${result.message}`);
            process.exit(1);
          }
        }
      } catch (error) {
        logger.error('Failed to connect to database', error);
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

  // Disconnect
  dbCmd
    .command('disconnect')
    .description('Disconnect from SQLite database')
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

        logger.info('Disconnecting from database...');
        const result = await client.sendRequest(COMMANDS.DATABASE_DISCONNECT) as OperationResponse;

        if (options.json) {
          outputJson(result);
        } else {
          if (result.success) {
            logger.info(`✓ ${result.message}`);
          } else {
            logger.error(`❌ ${result.message}`);
            process.exit(1);
          }
        }
      } catch (error) {
        logger.error('Failed to disconnect from database', error);
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

  // Reset (delete and recreate)
  dbCmd
    .command('reset')
    .description('Reset database (delete and recreate with fresh migrations)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '60000')
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

        logger.info('Resetting database (this will delete all data)...');
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest(COMMANDS.DATABASE_RESET, undefined, timeout) as OperationResponse;

        if (options.json) {
          outputJson(result);
        } else {
          if (result.success) {
            logger.info(`✓ ${result.message}`);
          } else {
            logger.error(`❌ ${result.message}`);
            process.exit(1);
          }
        }
      } catch (error) {
        logger.error('Failed to reset database', error);
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

  // Run migrations
  dbCmd
    .command('migrate')
    .description('Run pending database migrations')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '60000')
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

        logger.info('Running database migrations...');
        const timeout = parseInt(options.timeout, 10);
        const result = await client.sendRequest(COMMANDS.DATABASE_RUN_MIGRATIONS, undefined, timeout) as MigrationResponse;

        if (options.json) {
          outputJson(result);
        } else {
          if (result.success) {
            logger.info(`✓ ${result.message}`);
            if (result.migrationsApplied > 0) {
              logger.info(`  Applied: ${result.migrationsApplied} migration(s)`);
            }
          } else {
            logger.error(`❌ ${result.message}`);
            process.exit(1);
          }
        }
      } catch (error) {
        logger.error('Failed to run migrations', error);
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

  // Clear migrations (for debugging)
  dbCmd
    .command('clear-migrations')
    .description('Clear migration history (forces re-run on next migrate)')
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

        logger.info('Clearing migration history...');
        const result = await client.sendRequest(COMMANDS.DATABASE_CLEAR_MIGRATIONS) as OperationResponse;

        if (options.json) {
          outputJson(result);
        } else {
          if (result.success) {
            logger.info(`✓ ${result.message}`);
          } else {
            logger.error(`❌ ${result.message}`);
            process.exit(1);
          }
        }
      } catch (error) {
        logger.error('Failed to clear migration history', error);
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
