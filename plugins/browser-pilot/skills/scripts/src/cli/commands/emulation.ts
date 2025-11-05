import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerEmulationCommands(program: Command) {
  // Emulate media command
  program
    .command('emulate-media')
    .description('Emulate media type (screen/print) or color scheme (light/dark/no-preference) for testing responsive designs and dark mode')
    .option('-m, --media <type>', 'Media type: screen or print')
    .option('-c, --color-scheme <scheme>', 'Color scheme: light, dark, or no-preference')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.emulateMedia(
          browser,
          options.media as 'screen' | 'print' | undefined,
          options.colorScheme as 'light' | 'dark' | 'no-preference' | undefined
        );
        console.log('Emulated media:', result.mediaType || 'none', 'colorScheme:', result.colorScheme || 'none');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
