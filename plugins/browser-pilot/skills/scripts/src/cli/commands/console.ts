import { Command } from 'commander';
import { ChromeBrowser, FormattedConsoleMessage } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerConsoleCommands(program: Command) {
  // Get console messages
  program
    .command('console')
    .description('Get console messages from the page')
    .option('-u, --url <url>', 'Navigate to URL before getting console messages')
    .option('-e, --errors-only', 'Show only error messages', false)
    .action(async (options) => {
      const browser = new ChromeBrowser();
      try {
        await browser.connect();

        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
          // Wait a bit for console messages to appear
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const result = await actions.getConsoleMessages(browser, options.errorsOnly);
        console.log(`\n=== Console Messages (Total: ${result.count}) ===`);
        console.log(`Errors: ${result.errorCount}, Warnings: ${result.warningCount}, Logs: ${result.logCount}\n`);

        if (result.messages.length === 0) {
          console.log('No console messages found.');
        } else {
          result.messages.forEach((msg: FormattedConsoleMessage) => {
            const location = msg.url ? ` (${msg.url}:${msg.lineNumber || '?'})` : '';
            console.log(`[${msg.level.toUpperCase()}]${location} ${msg.text}`);
          });
        }

        console.log('\nBrowser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
