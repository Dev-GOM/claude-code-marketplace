import { Command } from 'commander';
import { executeViaDaemon } from '../daemon-helper';
import { findSelector } from '../../cdp/map/query-map';
import { findSelectorWithRetry } from './selector-helper';
import { SELECTOR_RETRY_CONFIG } from '../../cdp/actions/helpers';
import { getOutputDir } from '../../cdp/config';
import * as path from 'path';

/**
 * List of all available commands
 */
const AVAILABLE_COMMANDS = [
  // Navigation
  'navigate', 'back', 'forward', 'reload',
  // Interaction
  'click', 'hover', 'press', 'type', 'upload',
  // Forms
  'fill', 'select', 'check', 'uncheck',
  // Capture
  'screenshot', 'pdf',
  // Tabs
  'tabs', 'new-tab', 'close-tab', 'switch-tab', 'close',
  // Cookies
  'cookies', 'set-cookie', 'delete-cookies',
  // Console
  'console',
  // Scroll
  'scroll',
  // Wait
  'wait', 'wait-idle', 'sleep',
  // Data extraction
  'extract', 'content', 'extract-data', 'find', 'get-property',
  // Focus
  'focus', 'blur',
  // Accessibility
  'accessibility',
  // Network
  'block-url', 'unblock-urls',
  // Dialogs
  'dialog', 'enable-interception', 'disable-interception',
  // Emulation
  'emulate-media',
  // Drag
  'drag'
];

interface ChainCommand {
  command: string;
  args: string[];
}

/**
 * Parse raw arguments into command groups
 */
function parseChainArgs(rawArgs: string[]): ChainCommand[] {
  const commands: ChainCommand[] = [];
  let currentCommand: ChainCommand | null = null;

  for (const arg of rawArgs) {
    // Check if this is a command name
    if (AVAILABLE_COMMANDS.includes(arg)) {
      // Save previous command
      if (currentCommand) {
        commands.push(currentCommand);
      }
      // Start new command
      currentCommand = {
        command: arg,
        args: []
      };
    } else if (currentCommand) {
      // Add argument to current command
      currentCommand.args.push(arg);
    } else {
      // Argument before any command (error)
      throw new Error(`Unexpected argument "${arg}" before any command`);
    }
  }

  // Save last command
  if (currentCommand) {
    commands.push(currentCommand);
  }

  return commands;
}

/**
 * Parse command arguments into params object
 */
function parseCommandArgs(command: string, args: string[]): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Long option: --option value or --option=value
    if (arg.startsWith('--')) {
      const optionName = arg.slice(2);

      // Check for --option=value format
      if (optionName.includes('=')) {
        const [key, value] = optionName.split('=', 2);
        params[key] = value;
        continue;
      }

      // Check if next arg is a value (doesn't start with -)
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        // Parse value type
        let value: unknown = nextArg;

        // Try to parse as number
        const num = Number(nextArg);
        if (!isNaN(num)) {
          value = num;
        }
        // Check for boolean strings
        else if (nextArg === 'true') {
          value = true;
        } else if (nextArg === 'false') {
          value = false;
        }

        params[optionName] = value;
        i++; // Skip next arg
      } else {
        // Boolean flag
        params[optionName] = true;
      }
    }
    // Short option: -s value or -s=value
    else if (arg.startsWith('-') && arg.length > 1) {
      const optionName = arg.slice(1);

      // Check for -s=value format
      if (optionName.includes('=')) {
        const [key, value] = optionName.split('=', 2);
        params[key] = value;
        continue;
      }

      // Check if next arg is a value
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        // Parse value type
        let value: unknown = nextArg;

        const num = Number(nextArg);
        if (!isNaN(num)) {
          value = num;
        } else if (nextArg === 'true') {
          value = true;
        } else if (nextArg === 'false') {
          value = false;
        }

        params[optionName] = value;
        i++;
      } else {
        params[optionName] = true;
      }
    }
    // Positional argument
    else {
      // Store as _args array
      if (!params._args) {
        params._args = [];
      }
      (params._args as unknown[]).push(arg);
    }
  }

  return params;
}

/**
 * Convert parsed params to daemon-compatible format
 */
function convertParamsForDaemon(command: string, params: Record<string, unknown>): Record<string, unknown> {
  const converted: Record<string, unknown> = { ...params };

  // Map common option names
  const mappings: Record<string, string> = {
    'u': 'url',
    's': 'selector',
    'v': 'value',
    't': 'timeout',
    'k': 'key',
    'o': 'output',
    'f': 'file',
    'i': 'index',
    'x': 'x',
    'y': 'y',
    'e': 'expression',
    'd': 'delay'
  };

  // Apply mappings
  for (const [short, long] of Object.entries(mappings)) {
    if (short in converted && !(long in converted)) {
      converted[long] = converted[short];
      delete converted[short];
    }
  }

  // Handle Smart Mode options for click/fill
  if (command === 'click' || command === 'fill') {
    // Convert kebab-case to camelCase
    if ('viewport-only' in converted) {
      converted.viewportOnly = converted['viewport-only'];
      delete converted['viewport-only'];
    }
  }

  // Remove _args if present
  delete converted._args;

  return converted;
}

export function registerChainCommands(program: Command) {
  program
    .command('chain [args...]')
    .description('Execute multiple commands in sequence with automatic map synchronization\n' +
      '  Format: chain <cmd1> [opts1] <cmd2> [opts2] ...\n' +
      '  Examples:\n' +
      '    • No quotes: chain navigate -u http://example.com click --text Submit screenshot -o result.png\n' +
      '    • With quotes (when values have spaces): chain click --text "Sign In" fill -s #email -v "user@example.com"\n' +
      '  • Supports Smart Mode (--text) for click/fill commands\n' +
      '  • Auto-waits for page load and map generation after navigation\n' +
      '  • Adds random human-like delay (300-800ms) between commands')
    .option('--timeout <ms>', 'Timeout for waiting map ready after navigation (default: 10000ms)', parseInt, 10000)
    .option('--delay <ms>', 'Fixed delay between commands in milliseconds (overrides random 300-800ms delay)', parseInt)
    .allowUnknownOption()
    .action(async (args: string[] = [], options, _cmd) => {
      try {
        // Extract chain-level options
        const chainTimeout = options.timeout || 10000;
        const chainDelay = options.delay;

        // Use provided args array
        const rawArgs = args;

        if (rawArgs.length === 0) {
          console.error('Error: No commands provided');
          console.log('Usage: npm run bp:chain -- <command1> [options1] <command2> [options2] ...');
          console.log('Example: npm run bp:chain -- navigate -u "http://example.com" click --text "Submit"');
          console.log('Options:');
          console.log('  --timeout <ms>  Timeout for waiting map ready (default: 10000ms)');
          console.log('  --delay <ms>    Delay between commands (default: random 300-800ms)');
          process.exit(1);
        }

        // Parse chain arguments
        const commands = parseChainArgs(rawArgs);

        console.log(`Executing ${commands.length} command(s) in sequence...\n`);

        // Execute commands sequentially
        for (let i = 0; i < commands.length; i++) {
          const { command, args } = commands[i];

          console.log(`[${i + 1}/${commands.length}] Executing: ${command} ${args.join(' ')}`);

          // Parse command arguments
          const params = parseCommandArgs(command, args);
          const daemonParams = convertParamsForDaemon(command, params);

          // Smart Mode: query map for click/fill commands with text option
          if ((command === 'click' || command === 'fill') && daemonParams.text && !daemonParams.selector) {
            console.log(`⏳ Waiting for map to be ready (timeout: ${chainTimeout}ms)...`);
            const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);

            // Get current URL for debugging
            let currentUrl = 'unknown';
            try {
              const fs = require('fs');
              if (fs.existsSync(mapPath)) {
                const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
                currentUrl = mapData.url || 'unknown';
              }
            } catch (_e) {
              // Ignore errors, just use 'unknown'
            }

            // Try to find selector with retry on failure
            let selector = findSelector(
              mapPath,
              {
                text: daemonParams.text as string,
                index: daemonParams.index as number | undefined,
                type: daemonParams.type as string | undefined,
                viewportOnly: daemonParams.viewportOnly as boolean | undefined
              },
              true, // waitForReady
              chainTimeout // timeout
            );

            // Fallback: regenerate map if element not found
            if (!selector) {
              selector = await findSelectorWithRetry({
                text: daemonParams.text as string,
                index: daemonParams.index as number | undefined,
                type: daemonParams.type as string | undefined,
                viewportOnly: daemonParams.viewportOnly as boolean | undefined
              }, 'element');

              if (!selector) {
                console.error(`   in URL: ${currentUrl}`);
                process.exit(1);
              }
            } else {
              console.log(`✓ Map ready, found selector: ${selector}`);
            }
            daemonParams.selector = selector;
            delete daemonParams.text;
            delete daemonParams.index;
            delete daemonParams.type;
            delete daemonParams.viewportOnly;
          }

          // Execute via daemon
          const response = await executeViaDaemon(command, daemonParams, { verbose: false });

          if (!response.success) {
            console.error(`✗ Command failed: ${command}`);
            console.error(`Error: ${response.error}`);
            process.exit(1);
          }

          console.log(`✓ Success: ${command}`);

          // Wait for map generation to complete after navigation-triggering commands
          const navigationCommands = ['navigate', 'click', 'back', 'forward', 'reload'];
          if (navigationCommands.includes(command)) {
            console.log('⏳ Waiting for interaction map to be ready...');

            const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
            const startTime = Date.now();
            const mapTimeout = chainTimeout;

            // For navigate command: verify URL matches target
            const expectedUrl = command === 'navigate' && daemonParams.url
              ? String(daemonParams.url)
              : null;

            // Poll map file until ready: true AND URL matches (for navigate)
            while (Date.now() - startTime < mapTimeout) {
              try {
                const fs = require('fs');
                if (fs.existsSync(mapPath)) {
                  const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

                  // Check if map is ready
                  if (mapData.ready !== true) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                  }

                  // For navigate: verify URL matches exactly
                  if (expectedUrl) {
                    const mapUrl = String(mapData.url || '');

                    // Normalize URLs (remove trailing slash, compare as lowercase)
                    const normalizedExpected = expectedUrl.replace(/\/$/, '').toLowerCase();
                    const normalizedMap = mapUrl.replace(/\/$/, '').toLowerCase();

                    // Exact match required
                    if (normalizedExpected !== normalizedMap) {
                      // URL mismatch - keep waiting
                      await new Promise(resolve => setTimeout(resolve, 100));
                      continue;
                    }
                  }

                  // Map is ready and URL matches (if applicable)
                  console.log(`✓ Interaction map ready (${mapData.statistics?.total || 0} elements)`);
                  if (expectedUrl) {
                    console.log(`  → URL verified: ${mapData.url}`);
                  }
                  break;
                }
              } catch (_e) {
                // Ignore parse errors, continue polling
              }

              // Wait 100ms before next check
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          // Display result if present
          if (response.data) {
            const data = response.data as Record<string, unknown>;

            // Display relevant info based on command
            if (command === 'navigate' && data.url) {
              console.log(`  → Navigated to: ${data.url}`);
            } else if (command === 'click' && data.selector) {
              console.log(`  → Clicked: ${data.selector}`);
            } else if (command === 'fill' && data.selector) {
              console.log(`  → Filled: ${data.selector}`);
            } else if (command === 'extract' && data.text) {
              console.log(`  → Extracted: ${data.text}`);
            } else if (command === 'screenshot' && data.path) {
              console.log(`  → Saved to: ${data.path}`);
            } else if (command === 'tabs') {
              console.log(`  → ${JSON.stringify(data, null, 2)}`);
            }
          }

          console.log();

          // Add delay before next command (except for last command)
          if (i < commands.length - 1) {
            let delayMs: number;
            if (chainDelay !== undefined) {
              delayMs = chainDelay;
            } else {
              // Random human-like delay (300-800ms)
              delayMs = Math.floor(Math.random() * (800 - 300 + 1)) + 300;
            }
            console.log(`⏱️  Waiting ${delayMs}ms before next command...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }

        console.log(`✓ All ${commands.length} command(s) completed successfully`);
        process.exit(0);

      } catch (error) {
        console.error('Chain execution error:', error);
        process.exit(1);
      }
    });
}
