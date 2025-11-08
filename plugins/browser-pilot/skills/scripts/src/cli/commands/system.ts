/**
 * System maintenance commands
 */

import { Command } from 'commander';
import { DaemonManager } from '../../daemon/manager';
import { loadSharedConfig, saveSharedConfig } from '../../cdp/config';
import { getLocalTimestamp } from '../../utils/timestamp';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Show usage error and exit
 */
function showUsageAndExit(message: string, usage: string): never {
  console.error(`❌ Error: ${message}`);
  console.error(`Usage: ${usage}`);
  process.exit(1);
}

/**
 * Validate project root path
 */
function validateProjectRoot(projectRoot: string): string {
  // Normalize path to prevent path traversal attacks
  const normalized = path.normalize(projectRoot);

  // Check if path exists
  if (!fs.existsSync(normalized)) {
    throw new Error(`Project root does not exist: ${normalized}`);
  }

  // Check if it's a directory
  const stats = fs.statSync(normalized);
  if (!stats.isDirectory()) {
    throw new Error(`Project root is not a directory: ${normalized}`);
  }

  return normalized;
}

/**
 * Parse and validate port number
 */
function parsePort(value: string): number {
  const port = parseInt(value, 10);
  if (isNaN(port)) {
    throw new Error('Port must be a valid number');
  }
  return port;
}

export function registerSystemCommands(program: Command) {
  // Reinstall command
  program
    .command('reinstall')
    .description('Reinstall Browser Pilot scripts (removes .browser-pilot directory)')
    .option('-y, --yes', 'Skip confirmation prompt')
    .option('-q, --quiet', 'Suppress output')
    .action(async (options) => {
      try {
        const projectRoot = validateProjectRoot(process.env.CLAUDE_PROJECT_DIR || process.cwd());
        const browserPilotDir = path.join(projectRoot, '.browser-pilot');

        // Check if directory exists
        if (!fs.existsSync(browserPilotDir)) {
          if (!options.quiet) {
            console.log('✨ .browser-pilot directory not found. Nothing to reinstall.');
            console.log('Run any command to initialize Browser Pilot.');
          }
          process.exit(0);
          return;
        }

        // Confirmation prompt (skip if --yes flag provided)
        if (!options.yes) {
          console.log('⚠️  This will remove the .browser-pilot directory and stop the daemon.');
          console.log('📁 Directory: ' + browserPilotDir);
          console.log('');
          console.log('Next command will trigger automatic reinstallation.');
          console.log('');
          console.log('Use --yes flag to skip this prompt.');
          process.exit(1);
          return;
        }

        // Stop daemon if running
        const manager = new DaemonManager();
        if (await manager.isRunning()) {
          if (!options.quiet) {
            console.log('🛑 Stopping daemon...');
          }
          try {
            await manager.stop({ verbose: false, force: true });
            if (!options.quiet) {
              console.log('✓ Daemon stopped');
            }
          } catch (stopError) {
            const errorMessage = stopError instanceof Error ? stopError.message : String(stopError);
            console.error('⚠️  Failed to stop daemon:', errorMessage);
            console.error('Continuing anyway, but manual cleanup may be needed.');
            if (stopError instanceof Error && stopError.stack) {
              logger.debug(`Stack trace: ${stopError.stack}`);
            }
          }
        } else {
          if (!options.quiet) {
            console.log('✓ Daemon not running');
          }
        }

        // Remove .browser-pilot directory
        if (!options.quiet) {
          console.log('🗑️  Removing .browser-pilot directory...');
        }
        fs.rmSync(browserPilotDir, { recursive: true, force: true });

        if (!options.quiet) {
          console.log('✨ Browser Pilot reinstalled successfully!');
          console.log('');
          console.log('Run any command to initialize Browser Pilot:');
          console.log('  node .browser-pilot/bp navigate -u "https://example.com"');
          console.log('');
          console.log('Note: The .browser-pilot directory will be recreated automatically.');
        }

        process.exit(0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error during reinstall:', errorMessage);
        if (error instanceof Error && error.stack) {
          logger.debug(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
      }
    });

  // Change port command
  program
    .command('change-port')
    .description('Change Chrome DevTools Protocol port for current project')
    .option('-p, --port <number>', 'New port number', parsePort)
    .option('-q, --quiet', 'Suppress output')
    .action(async (options) => {
      try {
        const projectRoot = validateProjectRoot(process.env.CLAUDE_PROJECT_DIR || process.cwd());
        const projectName = path.basename(projectRoot);

        if (!options.port) {
          showUsageAndExit('Port number is required', 'change-port -p <port>');
        }

        const newPort = options.port;

        // Validate port number
        if (isNaN(newPort) || newPort < 1024 || newPort > 65535) {
          console.error('❌ Error: Invalid port number');
          console.error('Port must be between 1024 and 65535');
          process.exit(1);
          return;
        }

        // Load config
        const config = loadSharedConfig();
        const projectConfig = config.projects[projectName];

        if (!projectConfig) {
          console.error('❌ Error: Project configuration not found');
          console.error('Run any Browser Pilot command to initialize the project first');
          process.exit(1);
          return;
        }

        const oldPort = projectConfig.port;

        // Stop daemon if running
        const manager = new DaemonManager();
        if (await manager.isRunning()) {
          if (!options.quiet) {
            console.log('🛑 Stopping daemon on port ' + oldPort + '...');
          }
          try {
            await manager.stop({ verbose: false, force: true });
            if (!options.quiet) {
              console.log('✓ Daemon stopped');
            }
          } catch (stopError) {
            const errorMessage = stopError instanceof Error ? stopError.message : String(stopError);
            console.error('⚠️  Failed to stop daemon:', errorMessage);
            console.error('Continuing anyway, but daemon may still be running on old port.');
            if (stopError instanceof Error && stopError.stack) {
              logger.debug(`Stack trace: ${stopError.stack}`);
            }
          }
        }

        // Update port in config
        projectConfig.port = newPort;
        projectConfig.lastUsed = getLocalTimestamp();
        saveSharedConfig(config);

        if (!options.quiet) {
          console.log('✅ Port changed successfully!');
          console.log('');
          console.log('Old port: ' + oldPort);
          console.log('New port: ' + newPort);
          console.log('');
          console.log('The daemon will use the new port on next command.');
        }

        process.exit(0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error changing port:', errorMessage);
        if (error instanceof Error && error.stack) {
          logger.debug(`Stack trace: ${error.stack}`);
        }
        process.exit(1);
      }
    });
}
