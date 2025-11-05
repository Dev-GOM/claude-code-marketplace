import { Command } from 'commander';
import { executeViaDaemon } from '../daemon-helper';

export function registerScrollCommands(program: Command) {
  // Scroll command
  program
    .command('scroll')
    .description('Scroll the page or a specific element to coordinates (x, y) or use a CSS selector to scroll an element into view')
    .requiredOption('-x, --x <pixels>', 'Horizontal scroll position', parseInt)
    .requiredOption('-y, --y <pixels>', 'Vertical scroll position', parseInt)
    .option('-s, --selector <selector>', 'CSS selector to scroll (optional)')
    .action(async (options) => {
      try {
        const response = await executeViaDaemon('scroll', {
          x: options.x,
          y: options.y,
          selector: options.selector
        });

        if (response.success) {
          const data = response.data as { success: boolean; position: { x: number; y: number } };
          console.log('Scrolled to:', data.position);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Scroll failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
