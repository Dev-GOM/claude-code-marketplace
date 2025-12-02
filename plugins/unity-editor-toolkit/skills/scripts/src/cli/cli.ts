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
import { registerComponentCommand } from './commands/component';
import { registerSceneCommand } from './commands/scene';
import { registerConsoleCommand } from './commands/console';
import { registerEditorCommand } from './commands/editor';
import { registerPrefsCommand } from './commands/prefs';
import { registerWaitCommand } from './commands/wait';
import { registerChainCommand } from './commands/chain';
import { registerDatabaseCommand } from './commands/db';
import { registerSnapshotCommand } from './commands/snapshot';
import { registerTransformHistoryCommand } from './commands/transform-history';
import { registerSyncCommand } from './commands/sync';
import { registerAnalyticsCommand } from './commands/analytics';
import { registerMenuCommand } from './commands/menu';
import { registerAssetCommand } from './commands/asset';
import { registerPrefabCommand } from './commands/prefab';
import { registerMaterialCommand } from './commands/material';
import { registerShaderCommand } from './commands/shader';
import { registerAnimationCommand } from './commands/animation';

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
registerComponentCommand(program);
registerSceneCommand(program);
registerConsoleCommand(program);
registerEditorCommand(program);
registerPrefsCommand(program);
registerWaitCommand(program);
registerChainCommand(program);
registerDatabaseCommand(program);
registerSnapshotCommand(program);
registerTransformHistoryCommand(program);
registerSyncCommand(program);
registerAnalyticsCommand(program);
registerMenuCommand(program);
registerAssetCommand(program);
registerPrefabCommand(program);
registerMaterialCommand(program);
registerShaderCommand(program);
registerAnimationCommand(program);

// Status command (built-in)
program
  .command('status')
  .description('Show Unity WebSocket connection status')
  .action(async () => {
    try {
      const projectRoot = config.getProjectRoot();
      const projectName = config.getProjectName(projectRoot);

      // Read server status first
      const serverStatus = config.readServerStatus(projectRoot);
      const port = config.getUnityPort(projectRoot);

      logger.info('✓ Unity WebSocket Status');
      logger.info(`  Project: ${projectName}`);
      logger.info(`  Root: ${projectRoot}`);

      if (serverStatus) {
        logger.info(`  Port: ${serverStatus.port}`);
        logger.info(`  Running: ${serverStatus.isRunning ? '✓' : '❌'}`);
        logger.info(`  Unity Version: ${serverStatus.editorVersion}`);
        logger.info(`  Last Heartbeat: ${serverStatus.lastHeartbeat}`);
        logger.info(`  Status: ${config.isServerStatusStale(serverStatus) ? '⚠️ Stale' : '✓ Active'}`);
      } else {
        logger.info(`  Port: ${port || 'Unknown'}`);
        logger.info(`  Status: ❌ No server status file found`);
      }

      if (!port) {
        logger.info('');
        logger.info('❌ Unity server not detected');
        logger.info('   Make sure Unity Editor is running with WebSocket server enabled');
        process.exit(1);
      }

      // Try to connect
      const client = createUnityClient(port);
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
