import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerNetworkCommands(program: Command) {
  // Block URL command
  program
    .command('block-url')
    .description('Block network requests matching URL pattern')
    .requiredOption('-p, --pattern <pattern>', 'URL pattern to block (e.g., "*.jpg", "*ads*")')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.blockRequest(browser, options.pattern);
        console.log('Blocked URL pattern:', result.urlPattern);
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Unblock URLs command
  program
    .command('unblock-urls')
    .description('Unblock all network requests')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        await actions.unblockRequests(browser);
        console.log('All URL blocks removed');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Enable request interception
  program
    .command('enable-interception')
    .description('Enable network request interception')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.enableRequestInterception(browser);
        console.log('Request interception enabled');
        console.log('Note:', result.note);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Disable request interception
  program
    .command('disable-interception')
    .description('Disable network request interception')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        await actions.disableRequestInterception(browser);
        console.log('Request interception disabled');
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
