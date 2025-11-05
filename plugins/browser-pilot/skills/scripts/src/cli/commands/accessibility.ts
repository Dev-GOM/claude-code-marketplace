import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';
import { logger } from '../../utils/logger';

export function registerAccessibilityCommands(program: Command) {
  // Get accessibility snapshot
  program
    .command('accessibility')
    .description('Get accessibility tree snapshot (ARIA roles, labels, and screen reader info)')
    .option('-u, --url <url>', 'Navigate to URL first')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.getAccessibilitySnapshot(browser);
        console.log(`Accessibility nodes: ${result.nodeCount}`);
        console.log('First 50 nodes:', JSON.stringify(result.nodes, null, 2));
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        logger.error('Command execution failed', error);
        process.exit(1);
      }
    });
}
