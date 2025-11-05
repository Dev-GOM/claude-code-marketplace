import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerFocusCommands(program: Command) {
  // Focus element
  program
    .command('focus')
    .description('Set focus on a specific element (for keyboard input)')
    .requiredOption('-s, --selector <selector>', 'CSS selector')
    .option('-u, --url <url>', 'Navigate to URL first')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.focus(browser, options.selector);
        console.log('Focused:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Blur element
  program
    .command('blur')
    .description('Remove focus from an element (deactivate active element)')
    .requiredOption('-s, --selector <selector>', 'CSS selector')
    .option('-u, --url <url>', 'Navigate to URL first')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.blur(browser, options.selector);
        console.log('Blurred:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
