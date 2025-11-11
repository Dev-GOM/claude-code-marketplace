/**
 * Daemon management commands
 */

import { Command } from 'commander';
import { DaemonManager } from '../../daemon/manager';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

export function registerDaemonCommands(program: Command) {
  // Start daemon
  program
    .command('daemon-start')
    .description('Start Blender Toolkit daemon (persistent background service)')
    .option('-q, --quiet', 'Suppress output')
    .action(async (options) => {
      const manager = new DaemonManager();
      try {
        await manager.start({ verbose: !options.quiet });
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Stop daemon
  program
    .command('daemon-stop')
    .description('Stop Blender Toolkit daemon')
    .option('-q, --quiet', 'Suppress output')
    .option('-f, --force', 'Force kill the daemon')
    .action(async (options) => {
      const manager = new DaemonManager();
      try {
        await manager.stop({ verbose: !options.quiet, force: options.force });
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Restart daemon
  program
    .command('daemon-restart')
    .description('Restart Blender Toolkit daemon')
    .option('-q, --quiet', 'Suppress output')
    .action(async (options) => {
      const manager = new DaemonManager();
      try {
        await manager.restart({ verbose: !options.quiet });
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Daemon status
  program
    .command('daemon-status')
    .description('Check daemon status and Blender connection info')
    .option('-q, --quiet', 'Suppress output')
    .action(async (options) => {
      const manager = new DaemonManager();
      try {
        const state = await manager.getStatus({ verbose: !options.quiet });
        process.exit(state ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Addon install
  program
    .command('addon-install')
    .description('Install Blender Toolkit addon automatically')
    .option('-b, --blender <path>', 'Blender executable path', 'blender')
    .action(async (options) => {
      try {
        console.log('🔧 Installing Blender Toolkit addon...\n');

        // Install script path
        const scriptDir = join(__dirname, '..', '..', '..');
        const installScript = join(scriptDir, 'install-addon.py');

        if (!existsSync(installScript)) {
          console.error(`❌ Error: Install script not found at ${installScript}`);
          process.exit(1);
        }

        console.log(`📍 Script: ${installScript}`);
        console.log(`📍 Blender: ${options.blender}\n`);

        // Run Blender in background with install script
        const blender = spawn(options.blender, [
          '--background',
          '--python', installScript
        ], {
          stdio: 'inherit'
        });

        blender.on('exit', (code) => {
          if (code === 0) {
            console.log('\n✅ Addon installation completed!');
            console.log('\n📝 Next steps:');
            console.log('   1. Start Blender normally');
            console.log('   2. The WebSocket server will auto-start on port 9400');
            console.log('   3. Start daemon: blender-toolkit daemon-start');
            console.log('   4. Use CLI commands: blender-toolkit <command>');
          } else {
            console.error(`\n❌ Installation failed with code ${code}`);
          }
          process.exit(code || 0);
        });

        blender.on('error', (error) => {
          console.error(`\n❌ Failed to run Blender: ${error.message}`);
          console.error('\nTips:');
          console.error('   - Make sure Blender is installed');
          console.error('   - Use --blender flag to specify path: --blender /path/to/blender');
          process.exit(1);
        });

      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Addon build
  program
    .command('addon-build')
    .description('Build Blender addon ZIP package for distribution')
    .option('-o, --output-dir <path>', 'Output directory for ZIP file')
    .option('-f, --force', 'Force rebuild even if ZIP already exists')
    .action(async (options) => {
      try {
        console.log('📦 Building Blender addon ZIP...\n');

        // Build script path (plugins/blender-toolkit/scripts/build-addon.js)
        const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
        if (!pluginRoot) {
          console.error('❌ Error: CLAUDE_PLUGIN_ROOT environment variable not set');
          process.exit(1);
        }

        const buildScript = join(pluginRoot, 'scripts', 'build-addon.js');
        if (!existsSync(buildScript)) {
          console.error(`❌ Error: Build script not found at ${buildScript}`);
          process.exit(1);
        }

        const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
        console.log(`📍 Project: ${projectRoot}`);
        console.log(`📍 Script: ${buildScript}\n`);

        // Prepare arguments
        const args = ['--project-root', projectRoot];
        if (options.outputDir) {
          args.push('--output-dir', options.outputDir);
        }
        if (options.force) {
          args.push('--force');
        }

        // Run build script
        const buildProcess = spawn('node', [buildScript, ...args], {
          stdio: 'inherit'
        });

        buildProcess.on('exit', (code) => {
          if (code === 0) {
            console.log('\n📝 Next steps:');
            console.log('   1. Open Blender 4.0+');
            console.log('   2. Edit > Preferences > Add-ons > Install');
            console.log('   3. Select: .blender-toolkit/blender-toolkit-addon-v*.zip');
            console.log('   4. Enable "Blender Toolkit WebSocket Server"');
          }
          process.exit(code || 0);
        });

        buildProcess.on('error', (error) => {
          console.error(`\n❌ Failed to run build script: ${error.message}`);
          process.exit(1);
        });

      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
