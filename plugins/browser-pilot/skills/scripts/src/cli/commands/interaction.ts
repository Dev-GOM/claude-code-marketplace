import { Command } from 'commander';
import { executeViaDaemon } from '../daemon-helper';
import { findSelector } from '../../cdp/map/query-map';
import { SELECTOR_RETRY_CONFIG } from '../../cdp/actions/helpers';
import { getOutputDir } from '../../cdp/config';
import * as path from 'path';

export function registerInteractionCommands(program: Command) {
  // Click command
  program
    .command('click')
    .description('Click an element on the page')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .option('-s, --selector <selector>', 'CSS selector to click (direct mode)')
    .option('--text <text>', 'Text content to search for (smart mode)')
    .option('--index <number>', 'Select nth match (1-based, for duplicate text)', parseInt)
    .option('--type <type>', 'Element type filter (e.g., button, input)')
    .option('--viewport-only', 'Only search visible elements', false)
    .option('--verify', 'Verify action success', false)
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      try {
        if (options.url) {
          await executeViaDaemon('navigate', { url: options.url, waitForLoad: true });
        }

        let selector = options.selector;

        // Smart mode: query map if text option provided
        if (options.text && !selector) {
          console.log(`🔍 Searching for: "${options.text}"${options.index ? ` (match #${options.index})` : ''}`);

          const outputDir = getOutputDir();
          const mapPath = path.join(outputDir, SELECTOR_RETRY_CONFIG.MAP_FILENAME);
          console.log(`📁 Map path: ${mapPath}`);

          selector = findSelector(mapPath, {
            text: options.text,
            index: options.index,
            type: options.type,
            viewportOnly: options.viewportOnly
          });

          if (!selector) {
            console.error('❌ Element not found in interaction map');
            console.error('   Try generating a new map or use --selector for direct mode');
            process.exit(1);
          }

          console.log(`✓ Found element with selector: ${selector}`);
        }

        // Validate selector
        if (!selector) {
          console.error('❌ No selector provided. Use either:');
          console.error('   --selector <selector>  (direct mode)');
          console.error('   --text <text>          (smart mode)');
          process.exit(1);
        }

        const response = await executeViaDaemon('click', {
          selector,
          verify: options.verify
        });

        if (response.success) {
          console.log('✓ Clicked:', selector);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('❌ Click failed:', response.error);
        }
        process.exit(response.success ? 0 : 1);
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
    .option('-s, --selector <selector>', 'CSS selector of input field (direct mode)')
    .option('--label <label>', 'Label or placeholder text to search for (smart mode)')
    .option('--type <type>', 'Input type filter (e.g., input-text, input-password)', 'input')
    .option('--viewport-only', 'Only search visible elements', false)
    .requiredOption('-v, --value <value>', 'Value to fill')
    .option('--verify', 'Verify action success', false)
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      try {
        if (options.url) {
          await executeViaDaemon('navigate', { url: options.url, waitForLoad: true });
        }

        let selector = options.selector;

        // Smart mode: query map if label option provided
        if (options.label && !selector) {
          console.log(`🔍 Searching for input: "${options.label}"`);

          const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
          selector = findSelector(mapPath, {
            text: options.label,
            type: options.type,
            viewportOnly: options.viewportOnly
          });

          if (!selector) {
            console.error('❌ Input field not found in interaction map');
            console.error('   Try generating a new map or use --selector for direct mode');
            process.exit(1);
          }

          console.log(`✓ Found input field with selector: ${selector}`);
        }

        // Validate selector
        if (!selector) {
          console.error('❌ No selector provided. Use either:');
          console.error('   --selector <selector>  (direct mode)');
          console.error('   --label <label>        (smart mode)');
          process.exit(1);
        }

        const response = await executeViaDaemon('fill', {
          selector,
          value: options.value,
          verify: options.verify
        });

        if (response.success) {
          console.log('✓ Filled:', selector, 'with:', options.value);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('❌ Fill failed:', response.error);
        }
        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Hover command (not implemented in server yet, skip for now)
  program
    .command('hover')
    .description('Hover over an element')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector to hover')
    .option('--headless', 'Run in headless mode', false)
    .action(async () => {
      console.error('Hover command not yet implemented in daemon mode');
      process.exit(1);
    });

  // Press key command (not implemented in server yet, skip for now)
  program
    .command('press')
    .description('Press a keyboard key')
    .requiredOption('-k, --key <key>', 'Key to press (e.g., Enter, Tab, Escape)')
    .option('--headless', 'Run in headless mode', false)
    .action(async () => {
      console.error('Press command not yet implemented in daemon mode');
      process.exit(1);
    });

  // Type text command (not implemented in server yet, skip for now)
  program
    .command('type')
    .description('Type text character by character')
    .requiredOption('-t, --text <text>', 'Text to type')
    .option('-d, --delay <ms>', 'Delay between characters (ms)', parseInt, 0)
    .option('--headless', 'Run in headless mode', false)
    .action(async () => {
      console.error('Type command not yet implemented in daemon mode');
      process.exit(1);
    });

  // Upload file command (not implemented in server yet, skip for now)
  program
    .command('upload')
    .description('Upload file to input element')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('-s, --selector <selector>', 'CSS selector of file input')
    .requiredOption('-f, --file <path>', 'File path to upload')
    .option('--headless', 'Run in headless mode', false)
    .action(async () => {
      console.error('Upload command not yet implemented in daemon mode');
      process.exit(1);
    });

  // Drag and drop command (not implemented in server yet, skip for now)
  program
    .command('drag')
    .description('Drag and drop element')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .requiredOption('--from <selector>', 'Source element selector')
    .requiredOption('--to <selector>', 'Target element selector')
    .option('--headless', 'Run in headless mode', false)
    .action(async () => {
      console.error('Drag command not yet implemented in daemon mode');
      process.exit(1);
    });
}
