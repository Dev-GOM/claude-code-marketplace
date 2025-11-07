import { Command } from 'commander';
import { executeViaDaemon } from '../daemon-helper';

/**
 * Type guard for viewport response data
 */
function isViewportResponse(data: unknown): data is { viewport: { width: number; height: number; devicePixelRatio: number } } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'viewport' in data &&
    typeof (data as Record<string, unknown>).viewport === 'object' &&
    (data as Record<string, unknown>).viewport !== null &&
    'width' in ((data as Record<string, unknown>).viewport as object) &&
    'height' in ((data as Record<string, unknown>).viewport as object) &&
    'devicePixelRatio' in ((data as Record<string, unknown>).viewport as object) &&
    typeof ((data as Record<string, unknown>).viewport as Record<string, unknown>).width === 'number' &&
    typeof ((data as Record<string, unknown>).viewport as Record<string, unknown>).height === 'number' &&
    typeof ((data as Record<string, unknown>).viewport as Record<string, unknown>).devicePixelRatio === 'number'
  );
}

/**
 * Type guard for screen info response data
 */
function isScreenInfoResponse(data: unknown): data is {
  viewport: { width: number; height: number };
  screen: { width: number; height: number; availWidth: number; availHeight: number };
  devicePixelRatio: number;
} {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  // Check viewport
  if (typeof d.viewport !== 'object' || d.viewport === null) return false;
  const viewport = d.viewport as Record<string, unknown>;
  if (typeof viewport.width !== 'number' || typeof viewport.height !== 'number') return false;

  // Check screen
  if (typeof d.screen !== 'object' || d.screen === null) return false;
  const screen = d.screen as Record<string, unknown>;
  if (
    typeof screen.width !== 'number' ||
    typeof screen.height !== 'number' ||
    typeof screen.availWidth !== 'number' ||
    typeof screen.availHeight !== 'number'
  ) return false;

  // Check devicePixelRatio
  if (typeof d.devicePixelRatio !== 'number') return false;

  return true;
}

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

  // Get viewport command
  program
    .command('get-viewport')
    .description('Get current viewport size')
    .action(async () => {
      try {
        const response = await executeViaDaemon('get-viewport', {});

        if (response.success) {
          if (!isViewportResponse(response.data)) {
            console.error('Get viewport failed: Invalid response format');
            process.exit(1);
          }
          const data = response.data;
          console.log('=== Viewport Information ===');
          console.log(`Size: ${data.viewport.width}x${data.viewport.height}`);
          console.log(`Scale: ${data.viewport.devicePixelRatio}`);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Get viewport failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Get screen info command
  program
    .command('get-screen-info')
    .description('Get screen and viewport information')
    .action(async () => {
      try {
        const response = await executeViaDaemon('get-screen-info', {});

        if (response.success) {
          if (!isScreenInfoResponse(response.data)) {
            console.error('Get screen info failed: Invalid response format');
            process.exit(1);
          }
          const data = response.data;
          console.log('=== Screen Information ===');
          console.log(`Screen: ${data.screen.width}x${data.screen.height}`);
          console.log(`Available: ${data.screen.availWidth}x${data.screen.availHeight}`);
          console.log(`Viewport: ${data.viewport.width}x${data.viewport.height}`);
          console.log(`Scale: ${data.devicePixelRatio}`);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Get screen info failed:', response.error);
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
