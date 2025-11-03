import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerNavigationCommands(program: Command) {
  // Navigate command
  program
    .command('navigate')
    .description('Navigate to a URL')
    .requiredOption('-u, --url <url>', 'URL to navigate to')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        // Try to connect to existing browser first, launch new one if failed
        try {
          await browser.connect();
        } catch {
          await browser.launch();
        }
        const result = await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
        console.log('Navigated to:', result.url);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Go back command
  program
    .command('back')
    .description('Navigate back in history')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.goBack(browser);
        if (result.success) {
          console.log('Navigated back to:', result.url);
        } else {
          console.log(result.error);
        }
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Go forward command
  program
    .command('forward')
    .description('Navigate forward in history')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.goForward(browser);
        if (result.success) {
          console.log('Navigated forward to:', result.url);
        } else {
          console.log(result.error);
        }
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Reload command
  program
    .command('reload')
    .description('Reload the current page')
    .option('--hard', 'Hard reload (ignore cache)', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        try {
          await browser.connect();
        } catch {
          await browser.launch();
        }
        const result = await actions.reload(browser, options.hard);
        console.log('Page reloaded (hard:', result.hardReload, ')');
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
