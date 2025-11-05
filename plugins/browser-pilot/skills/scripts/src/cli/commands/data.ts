import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';
import { executeViaDaemon } from '../daemon-helper';

export function registerDataCommands(program: Command) {
  // Extract text command
  program
    .command('extract')
    .description('Extract text from element (use -s for selector)')
    .option('-u, --url <url>', 'URL to extract from (optional, uses current page if not specified)')
    .option('-s, --selector <selector>', 'CSS selector (optional)')
    .option('--headless', 'Run in headless mode', false)
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
        const result = await actions.extractText(browser, options.selector);
        console.log('Extracted text:', result.text);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Evaluate command
  program
    .command('eval')
    .description('Execute JavaScript on page (requires -e/--expression)')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-e, --expression <script>', 'JavaScript expression to evaluate')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      try {
        // Navigate if URL provided
        if (options.url) {
          await executeViaDaemon('navigate', { url: options.url });
        }

        // Execute JavaScript
        const response = await executeViaDaemon('eval', { expression: options.expression });

        if (response.success) {
          const data = response.data as { result: unknown };
          console.log('Result:', data.result);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Eval failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Get content command
  program
    .command('content')
    .description('Get page HTML content')
    .action(async () => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.getContent(browser);
        console.log('HTML content length:', result.length);
        console.log(result.content);
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Extract data
  program
    .command('extract-data')
    .description('Extract data using multiple selectors (requires -s/--selectors)')
    .requiredOption('-s, --selectors <json>', 'JSON object of key-selector pairs')
    .option('-u, --url <url>', 'Navigate to URL first')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const selectors = JSON.parse(options.selectors);
        const result = await actions.extractData(browser, selectors);
        console.log('Extracted data:', JSON.stringify(result.data, null, 2));
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Find element
  program
    .command('find')
    .description('Find element and return info (requires -s/--selector)')
    .requiredOption('-s, --selector <selector>', 'CSS selector')
    .option('-u, --url <url>', 'Navigate to URL first')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.findElement(browser, options.selector);
        console.log('Element info:', JSON.stringify(result.element, null, 2));
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Get element property
  program
    .command('get-property')
    .description('Get element property value (requires -s and -p)')
    .requiredOption('-s, --selector <selector>', 'CSS selector')
    .requiredOption('-p, --property <property>', 'Property name')
    .option('-u, --url <url>', 'Navigate to URL first')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.getElementProperty(browser, options.selector, options.property);
        console.log(`${options.property}:`, result.value);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
