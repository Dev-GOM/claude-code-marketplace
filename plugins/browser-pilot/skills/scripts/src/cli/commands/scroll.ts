import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerScrollCommands(program: Command) {
  // Scroll command
  program
    .command('scroll')
    .description('Scroll page or element')
    .requiredOption('-x, --x <pixels>', 'Horizontal scroll position', parseInt)
    .requiredOption('-y, --y <pixels>', 'Vertical scroll position', parseInt)
    .option('-s, --selector <selector>', 'CSS selector to scroll (optional)')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.scroll(browser, {
          x: options.x,
          y: options.y,
          selector: options.selector
        });
        console.log('Scrolled to:', result.position);
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
