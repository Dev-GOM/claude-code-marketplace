#!/usr/bin/env node

/**
 * Unity Editor Toolkit CLI
 *
 * Complete command-line interface for controlling Unity Editor with real-time automation.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';

// Import commands
import { registerHierarchyCommand } from './commands/hierarchy';
import { registerGameObjectCommand } from './commands/gameobject';
import { registerTransformCommand } from './commands/transform';
import { registerSceneCommand } from './commands/scene';
import { registerConsoleCommand } from './commands/console';

const program = new Command();

// CLI metadata
program
  .name('unity-editor')
  .description('Unity Editor Toolkit - Complete Unity Editor control and automation')
  .version('0.1.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-p, --port <number>', 'Unity WebSocket port', (value) => parseInt(value, 10))
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      logger.setLogLevel(3); // DEBUG
    }
  });

// Register commands
registerHierarchyCommand(program);
registerGameObjectCommand(program);
registerTransformCommand(program);
registerSceneCommand(program);
registerConsoleCommand(program);

// Status command (built-in)
program
  .command('status')
  .description('Show Unity WebSocket connection status')
  .action(async () => {
    try {
      const projectRoot = config.getProjectRoot();
      const projectName = config.getProjectName(projectRoot);
      const projectConfig = config.getProjectConfig(projectName);

      if (!projectConfig) {
        logger.info('❌ Project not registered');
        logger.info(`   Run this command in a Unity project that has been opened with Claude Code`);
        process.exit(1);
      }

      logger.info('✓ Unity WebSocket Status');
      logger.info(`  Project: ${projectName}`);
      logger.info(`  Root: ${projectRoot}`);
      logger.info(`  Port: ${projectConfig.port}`);
      logger.info(`  Output: ${projectConfig.outputDir}`);
      logger.info(`  Last Used: ${projectConfig.lastUsed}`);

      // Try to connect
      const client = createUnityClient(projectConfig.port);
      try {
        await client.connect();
        logger.info('  Connection: ✓ Connected');
        client.disconnect();
      } catch (error) {
        logger.info('  Connection: ❌ Not connected');
        logger.info('  Make sure Unity Editor is running with WebSocket server enabled');
      }
    } catch (error) {
      logger.error('Failed to get status', error);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
