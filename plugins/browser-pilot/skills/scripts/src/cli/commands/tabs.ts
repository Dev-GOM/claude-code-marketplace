import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerTabsCommands(program: Command) {
  // List tabs command
  program
    .command('tabs')
    .description('List all open tabs')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.listTabs(browser);
        console.log(`Found ${result.count} tabs:`);
        result.tabs.forEach((tab: any) => {
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
    .description('Open a new tab')
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
    .description('Close a tab by index')
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
    .description('Switch to a tab by index')
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
    .description('Close the browser')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        await browser.close();
        console.log('✓ Browser closed');
        process.exit(0);
      } catch (error) {
        console.error('Error: Could not connect to browser. Is it running?');
        process.exit(1);
      }
    });
}
