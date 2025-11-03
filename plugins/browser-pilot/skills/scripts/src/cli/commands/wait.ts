import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerWaitCommands(program: Command) {
  // Wait for element command
  program
    .command('wait')
    .description('Wait for element to appear')
    .requiredOption('-s, --selector <selector>', 'CSS selector to wait for')
    .option('-t, --timeout <ms>', 'Timeout in milliseconds', parseInt, 30000)
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.waitFor(browser, options.selector, options.timeout);
        console.log('Element found:', result.selector);
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Wait milliseconds
  program
    .command('sleep')
    .description('Wait for specified milliseconds')
    .requiredOption('-t, --time <ms>', 'Milliseconds to wait', parseInt)
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.waitMilliseconds(browser, options.time);
        console.log(`Waited ${result.waitedMs}ms`);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Wait for network idle
  program
    .command('wait-idle')
    .description('Wait for network to be idle')
    .option('-t, --timeout <ms>', 'Timeout in milliseconds', parseInt, 5000)
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.waitForNetworkIdle(browser, options.timeout);
        console.log('Network is idle:', result.state);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
