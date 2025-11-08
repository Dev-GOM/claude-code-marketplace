import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';
import { DaemonManager } from '../../daemon/manager';

export function registerTabsCommands(program: Command) {
  // List tabs command
  program
    .command('tabs')
    .description('List all open tabs with their index numbers, titles, and URLs')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.listTabs(browser);
        const tabs = result.tabs as Array<{ index: number; title: string; url: string; targetId: string }>;
        console.log(`Found ${result.count} tabs:`);
        tabs.forEach((tab) => {
          console.log(`[${tab.index}] ${tab.title} - ${tab.url}`);
        });
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // New tab command
  program
    .command('new-tab')
    .description('Open a new tab in the browser (optionally navigate to a specific URL with -u)')
    .option('-u, --url <url>', 'URL to open', 'about:blank')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.newTab(browser, options.url);
        console.log('New tab opened:', result.targetId);
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Close tab command
  program
    .command('close-tab')
    .description('Close a specific tab by its index number (use "tabs" command to see index numbers)')
    .requiredOption('-i, --index <number>', 'Tab index to close', parseInt)
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.closeTab(browser, undefined, options.index);
        console.log(result.message);
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Switch tab
  program
    .command('switch-tab')
    .description('Switch to a different tab by its index number (use "tabs" command to see index numbers)')
    .requiredOption('-i, --index <index>', 'Tab index', parseInt)
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.switchTab(browser, options.index);
        console.log(result.message);
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Close browser command
  program
    .command('close')
    .description('Close the browser completely and stop the daemon process')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      const daemonManager = new DaemonManager();

      try {
        // Close browser first
        await browser.connect();
        await browser.close();
        console.log('✓ Browser closed');

        // Then stop daemon
        if (await daemonManager.isRunning()) {
          await daemonManager.stop({ verbose: true });
          console.log('✓ Daemon stopped');
        }

        process.exit(0);
      } catch (error) {
        // Try to stop daemon even if browser close failed
        try {
          if (await daemonManager.isRunning()) {
            await daemonManager.stop({ verbose: true });
            console.log('✓ Daemon stopped');
          }
        } catch (daemonError) {
          console.error('Warning: Could not stop daemon:', daemonError);
        }

        console.error('Error:', error);
        process.exit(1);
      }
    });
}
