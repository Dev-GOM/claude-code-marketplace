import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerFormsCommands(program: Command) {
  // Select option command
  program
    .command('select')
    .description('Select option from dropdown (requires -s and -v)')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector of select element')
    .requiredOption('-v, --value <value>', 'Option value to select')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        try { await browser.connect(); } catch { await browser.launch(); }
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.selectOption(browser, options.selector, options.value);
        console.log('Selected:', result.value, 'in', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Check checkbox command
  program
    .command('check')
    .description('Check a checkbox (requires -s/--selector)')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector of checkbox')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        try { await browser.connect(); } catch { await browser.launch(); }
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.check(browser, options.selector);
        console.log('Checked:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Uncheck checkbox command
  program
    .command('uncheck')
    .description('Uncheck a checkbox (requires -s/--selector)')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector of checkbox')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        try { await browser.connect(); } catch { await browser.launch(); }
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.uncheck(browser, options.selector);
        console.log('Unchecked:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
