import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerInteractionCommands(program: Command) {
  // Click command
  program
    .command('click')
    .description('Click an element on the page')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector to click')
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
        const result = await actions.click(browser, options.selector);
        console.log('Clicked:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Fill command
  program
    .command('fill')
    .description('Fill an input field')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector of input field')
    .requiredOption('-v, --value <value>', 'Value to fill')
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
        const result = await actions.fill(browser, options.selector, options.value);
        console.log('Filled:', result.selector, 'with:', result.value);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Hover command
  program
    .command('hover')
    .description('Hover over an element')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector to hover')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        try { await browser.connect(); } catch { await browser.launch(); }
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.hover(browser, options.selector);
        console.log('Hovered:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Press key command
  program
    .command('press')
    .description('Press a keyboard key')
    .requiredOption('-k, --key <key>', 'Key to press (e.g., Enter, Tab, Escape)')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        try {
          await browser.connect();
        } catch {
          await browser.launch();
        }
        const result = await actions.pressKey(browser, options.key);
        console.log('Pressed key:', result.key);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Type text command
  program
    .command('type')
    .description('Type text character by character')
    .requiredOption('-t, --text <text>', 'Text to type')
    .option('-d, --delay <ms>', 'Delay between characters (ms)', parseInt, 0)
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        try {
          await browser.connect();
        } catch {
          await browser.launch();
        }
        const result = await actions.typeText(browser, options.text, options.delay);
        console.log('Typed:', result.text);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Upload file command
  program
    .command('upload')
    .description('Upload file to input element')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector of file input')
    .requiredOption('-f, --file <path>', 'File path to upload')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        try { await browser.connect(); } catch { await browser.launch(); }
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.uploadFile(browser, options.selector, options.file);
        console.log('Uploaded:', result.file);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Drag and drop command
  program
    .command('drag')
    .description('Drag and drop element')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('--from <selector>', 'Source element selector')
    .requiredOption('--to <selector>', 'Target element selector')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        try { await browser.connect(); } catch { await browser.launch(); }
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.dragAndDrop(browser, options.from, options.to);
        console.log('Dragged', result.sourceSelector, 'to', result.targetSelector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
