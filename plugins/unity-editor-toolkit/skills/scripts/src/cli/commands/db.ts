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

interface UndoRedoResponse extends OperationResponse {
  commandName: string;
  remainingUndo: number;
  remainingRedo: number;
}

interface HistoryEntry {
  name: string;
  timestamp: string;
  canUndo: boolean;
}

interface HistoryResponse {
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  totalUndo: number;
  totalRedo: number;
}

interface QueryResponse extends OperationResponse {
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
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

  // Undo
  dbCmd
    .command('undo')
    .description('Undo last command (Transform, GameObject changes)')
    .option('-n, --count <number>', 'Number of commands to undo', '1')
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

        const count = parseInt(options.count, 10);
        const results: UndoRedoResponse[] = [];

        for (let i = 0; i < count; i++) {
          logger.info(`Undoing command ${i + 1}/${count}...`);
          const result = await client.sendRequest(COMMANDS.DATABASE_UNDO) as UndoRedoResponse;
          results.push(result);

          if (!result.success) {
            if (options.json) {
              outputJson({ results, totalUndone: i, error: result.message });
            } else {
              if (i === 0) {
                logger.error(`❌ ${result.message}`);
              } else {
                logger.warn(`⚠️  Stopped after ${i} undo(s): ${result.message}`);
              }
            }
            if (i === 0) process.exit(1);
            break;
          }

          if (!options.json) {
            logger.info(`  ↩️  Undone: ${result.commandName}`);
          }
        }

        if (options.json) {
          outputJson({ results, totalUndone: results.filter(r => r.success).length });
        } else {
          const successCount = results.filter(r => r.success).length;
          if (successCount > 0) {
            const lastResult = results[results.length - 1];
            logger.info(`✓ Undone ${successCount} command(s)`);
            logger.info(`  Remaining: Undo=${lastResult.remainingUndo}, Redo=${lastResult.remainingRedo}`);
          }
        }
      } catch (error) {
        logger.error('Failed to undo', error);
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

  // Redo
  dbCmd
    .command('redo')
    .description('Redo previously undone command')
    .option('-n, --count <number>', 'Number of commands to redo', '1')
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

        const count = parseInt(options.count, 10);
        const results: UndoRedoResponse[] = [];

        for (let i = 0; i < count; i++) {
          logger.info(`Redoing command ${i + 1}/${count}...`);
          const result = await client.sendRequest(COMMANDS.DATABASE_REDO) as UndoRedoResponse;
          results.push(result);

          if (!result.success) {
            if (options.json) {
              outputJson({ results, totalRedone: i, error: result.message });
            } else {
              if (i === 0) {
                logger.error(`❌ ${result.message}`);
              } else {
                logger.warn(`⚠️  Stopped after ${i} redo(s): ${result.message}`);
              }
            }
            if (i === 0) process.exit(1);
            break;
          }

          if (!options.json) {
            logger.info(`  ↪️  Redone: ${result.commandName}`);
          }
        }

        if (options.json) {
          outputJson({ results, totalRedone: results.filter(r => r.success).length });
        } else {
          const successCount = results.filter(r => r.success).length;
          if (successCount > 0) {
            const lastResult = results[results.length - 1];
            logger.info(`✓ Redone ${successCount} command(s)`);
            logger.info(`  Remaining: Undo=${lastResult.remainingUndo}, Redo=${lastResult.remainingRedo}`);
          }
        }
      } catch (error) {
        logger.error('Failed to redo', error);
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

  // History
  dbCmd
    .command('history')
    .description('Show command history (undo/redo stacks)')
    .option('-n, --limit <number>', 'Maximum entries to show per stack', '10')
    .option('--clear', 'Clear all history')
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

        if (options.clear) {
          logger.info('Clearing command history...');
          const result = await client.sendRequest(COMMANDS.DATABASE_CLEAR_HISTORY) as OperationResponse;

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
          return;
        }

        logger.info('Getting command history...');
        const limit = parseInt(options.limit, 10);
        const result = await client.sendRequest(COMMANDS.DATABASE_GET_HISTORY, { limit }) as HistoryResponse;

        if (options.json) {
          outputJson(result);
        } else {
          logger.info('✓ Command History');

          // Undo stack (most recent first)
          logger.info(`📜 Undo Stack (${result.totalUndo} total):`);
          if (result.undoStack.length === 0) {
            logger.info('  (empty)');
          } else {
            for (let i = 0; i < result.undoStack.length; i++) {
              const entry = result.undoStack[i];
              const marker = i === 0 ? '→' : ' ';
              logger.info(`  ${marker} ${i + 1}. ${entry.name} [${entry.timestamp}]`);
            }
            if (result.totalUndo > result.undoStack.length) {
              logger.info(`  ... and ${result.totalUndo - result.undoStack.length} more`);
            }
          }


          // Redo stack
          logger.info(`🔄 Redo Stack (${result.totalRedo} total):`);
          if (result.redoStack.length === 0) {
            logger.info('  (empty)');
          } else {
            for (let i = 0; i < result.redoStack.length; i++) {
              const entry = result.redoStack[i];
              const marker = i === 0 ? '→' : ' ';
              logger.info(`  ${marker} ${i + 1}. ${entry.name} [${entry.timestamp}]`);
            }
            if (result.totalRedo > result.redoStack.length) {
              logger.info(`  ... and ${result.totalRedo - result.redoStack.length} more`);
            }
          }
        }
      } catch (error) {
        logger.error('Failed to get history', error);
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

  // Query (table-based)
  dbCmd
    .command('query')
    .description('Query database table (migrations, command_history)')
    .argument('<table>', 'Table name to query (migrations, command_history)')
    .option('-n, --limit <number>', 'Maximum rows to return', '100')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (table: string, options) => {
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

        logger.info(`Querying table: ${table}...`);
        const limit = parseInt(options.limit, 10);
        const result = await client.sendRequest(COMMANDS.DATABASE_QUERY, { table, limit }) as QueryResponse;

        if (options.json) {
          outputJson(result);
        } else {
          if (result.success) {
            logger.info(`✓ ${result.message}`);

            if (result.rowCount === 0) {
              logger.info('(no rows returned)');
            } else {
              // Display as table
              const columns = result.columns;
              const rows = result.rows;

              // Calculate column widths
              const colWidths: number[] = columns.map(col => col.length);
              for (const row of rows) {
                for (let i = 0; i < columns.length; i++) {
                  const value = String(row[columns[i]] ?? 'NULL');
                  colWidths[i] = Math.max(colWidths[i], Math.min(value.length, 50));
                }
              }

              // Print header
              const header = columns.map((col, i) => col.padEnd(colWidths[i])).join(' | ');
              logger.info(header);
              logger.info('-'.repeat(header.length));

              // Print rows
              for (const row of rows) {
                const rowStr = columns.map((col, i) => {
                  let value = String(row[col] ?? 'NULL');
                  if (value.length > 50) {
                    value = value.substring(0, 47) + '...';
                  }
                  return value.padEnd(colWidths[i]);
                }).join(' | ');
                logger.info(rowStr);
              }

              logger.info(`${result.rowCount} row(s) returned`);
            }
          } else {
            logger.error(`❌ ${result.message}`);
            process.exit(1);
          }
        }
      } catch (error) {
        logger.error('Failed to execute query', error);
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
