import { Command } from 'commander';
import { FormattedConsoleMessage } from '../../cdp/browser';
import { executeViaDaemon } from '../daemon-helper';
import { TIMING } from '../../constants';

export function registerConsoleCommands(program: Command) {
  // Get console messages
  program
    .command('console')
    .description('Get console messages from the page')
    .option('-u, --url <url>', 'Navigate to URL before getting console messages')
    .option('-e, --errors-only', 'Show only error messages', false)
    .action(async (options) => {
      try {
        // Navigate if URL provided
        if (options.url) {
          await executeViaDaemon('navigate', { url: options.url });
          // Wait a bit for console messages to appear
          await new Promise(resolve => setTimeout(resolve, TIMING.ACTION_DELAY_NAVIGATION));
        }

        // Get console messages
        const response = await executeViaDaemon('console', { errorsOnly: options.errorsOnly });

        if (response.success) {
          const result = response.data as { count: number; errorCount: number; warningCount: number; logCount: number; messages: FormattedConsoleMessage[] };
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

          console.log('\nBrowser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Console retrieval failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
