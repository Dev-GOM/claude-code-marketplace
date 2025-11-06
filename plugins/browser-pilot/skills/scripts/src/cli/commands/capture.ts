import { Command } from 'commander';
import { executeViaDaemon } from '../daemon-helper';

export function registerCaptureCommands(program: Command) {
  // Screenshot command
  program
    .command('screenshot')
    .description('Capture screenshot of webpage (saved to .browser-pilot/screenshots/)')
    .option('-u, --url <url>', 'URL to capture (optional, uses current page if not specified)')
    .option('-o, --output <path>', 'Output file path', 'screenshot.png')
    .option('--headless', 'Run in headless mode', false)
    .option('--full-page', 'Capture full page', true)
    .option('--clip-x <x>', 'Clip region X coordinate (pixels)')
    .option('--clip-y <y>', 'Clip region Y coordinate (pixels)')
    .option('--clip-width <width>', 'Clip region width (pixels)')
    .option('--clip-height <height>', 'Clip region height (pixels)')
    .option('--clip-scale <scale>', 'Clip region scale factor (default: 1)', '1')
    .action(async (options) => {
      try {
        // Navigate if URL provided
        if (options.url) {
          await executeViaDaemon('navigate', { url: options.url });
        }

        // Build screenshot params
        const params: Record<string, unknown> = {
          filename: options.output,
          fullPage: options.fullPage
        };

        // Add clip options if provided
        if (options.clipX && options.clipY && options.clipWidth && options.clipHeight) {
          params.clipX = parseFloat(options.clipX);
          params.clipY = parseFloat(options.clipY);
          params.clipWidth = parseFloat(options.clipWidth);
          params.clipHeight = parseFloat(options.clipHeight);
          params.clipScale = parseFloat(options.clipScale);
        }

        // Take screenshot
        const response = await executeViaDaemon('screenshot', params);

        if (response.success) {
          const data = response.data as { success: boolean; path: string };
          console.log('Screenshot saved:', data.path);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Screenshot failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Set viewport size command
  program
    .command('set-viewport')
    .description('Set browser viewport size')
    .requiredOption('-w, --width <width>', 'Viewport width in pixels')
    .requiredOption('-h, --height <height>', 'Viewport height in pixels')
    .option('--scale <scale>', 'Device scale factor (default: 1)', '1')
    .option('--mobile', 'Emulate mobile device', false)
    .action(async (options) => {
      try {
        const response = await executeViaDaemon('set-viewport', {
          width: parseInt(options.width),
          height: parseInt(options.height),
          deviceScaleFactor: parseFloat(options.scale),
          mobile: options.mobile
        });

        if (response.success) {
          const data = response.data as { width: number; height: number };
          console.log(`Viewport size set to: ${data.width}x${data.height}`);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Set viewport failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Generate PDF command
  program
    .command('pdf')
    .description('Generate PDF from webpage (saved to .browser-pilot/pdfs/)')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .option('-o, --output <path>', 'Output file path', 'page.pdf')
    .option('--headless', 'Run in headless mode', false)
    .option('--landscape', 'Use landscape orientation', false)
    .action(async (options) => {
      try {
        // Navigate if URL provided
        if (options.url) {
          await executeViaDaemon('navigate', { url: options.url });
        }

        // Generate PDF
        const response = await executeViaDaemon('pdf', {
          filename: options.output,
          landscape: options.landscape
        });

        if (response.success) {
          const data = response.data as { success: boolean; path: string };
          console.log('PDF saved:', data.path);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('PDF generation failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
