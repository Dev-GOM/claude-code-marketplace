import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerCaptureCommands(program: Command) {
  // Screenshot command
  program
    .command('screenshot')
    .description('Capture screenshot of a webpage')
    .option('-u, --url <url>', 'URL to capture (optional, uses current page if not specified)')
    .option('-o, --output <path>', 'Output file path', 'screenshot.png')
    .option('--headless', 'Run in headless mode', false)
    .option('--full-page', 'Capture full page', true)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        // Try to connect to existing browser first, launch new one if failed
        try {
          await browser.connect();
        } catch {
          await browser.launch();
        }
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.screenshot(browser, options.output, options.fullPage);
        console.log('Screenshot saved:', result.path);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Generate PDF command
  program
    .command('pdf')
    .description('Generate PDF from webpage')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .option('-o, --output <path>', 'Output file path', 'page.pdf')
    .option('--headless', 'Run in headless mode', false)
    .option('--landscape', 'Use landscape orientation', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        // Try to connect to existing browser first, launch new one if failed
        try {
          await browser.connect();
        } catch {
          await browser.launch();
        }
        // Only navigate if URL is provided
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.generatePdf(browser, options.output, options.landscape);
        console.log('PDF saved:', result.path);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
