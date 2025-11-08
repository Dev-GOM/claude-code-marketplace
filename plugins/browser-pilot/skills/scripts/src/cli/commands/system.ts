/**
 * System maintenance commands
 */

import { Command } from 'commander';
import { DaemonManager } from '../../daemon/manager';
import * as fs from 'fs';
import * as path from 'path';

export function registerSystemCommands(program: Command) {
  // Reinstall command
  program
    .command('reinstall')
    .description('Reinstall Browser Pilot scripts (removes .browser-pilot directory)')
    .option('-y, --yes', 'Skip confirmation prompt')
    .option('-q, --quiet', 'Suppress output')
    .action(async (options) => {
      try {
        const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
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
        if (!options.quiet) {
          console.log('🛑 Stopping daemon...');
        }
        const manager = new DaemonManager();
        try {
          await manager.stop({ verbose: false, force: true });
          if (!options.quiet) {
            console.log('✓ Daemon stopped');
          }
        } catch (error) {
          // Daemon might not be running, that's ok
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
        console.error('❌ Error during reinstall:', error);
        process.exit(1);
      }
    });
}
