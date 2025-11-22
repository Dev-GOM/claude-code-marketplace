import { Command } from 'commander';
import { FormattedConsoleMessage } from '../../cdp/browser';
import { executeViaDaemon } from '../daemon-helper';
import { TIMING } from '../../constants';
import * as fs from 'fs';
import * as path from 'path';

interface ConsoleOptions {
  url?: string;
  errorsOnly?: boolean;
  level?: string;
  warnings?: boolean;
  logs?: boolean;
  limit?: string;
  skip?: string;
  filter?: string;
  exclude?: string;
  json?: boolean;
  timestamp?: boolean;
  noColor?: boolean;
  output?: string;
  urlFilter?: string;
}

export function registerConsoleCommands(program: Command) {
  // Get console messages
  program
    .command('console')
    .description('Retrieve console messages from the page with powerful filtering and formatting options')
    .option('-u, --url <url>', 'Navigate to URL before getting console messages')

    // Level filtering options
    .option('-e, --errors-only', 'Show only error messages', false)
    .option('-l, --level <level>', 'Filter by level: error, warning, log, info, verbose')
    .option('--warnings', 'Show only warning messages', false)
    .option('--logs', 'Show only log messages', false)

    // Message limiting options
    .option('--limit <number>', 'Maximum number of messages to display')
    .option('--skip <number>', 'Skip first N messages')

    // Text filtering options
    .option('-f, --filter <pattern>', 'Show only messages matching regex pattern')
    .option('-x, --exclude <pattern>', 'Exclude messages matching regex pattern')

    // Output format options
    .option('-j, --json', 'Output in JSON format', false)
    .option('-t, --timestamp', 'Show timestamps', false)
    .option('--no-color', 'Disable colored output')

    // File output
    .option('-o, --output <file>', 'Save output to file')

    // Source filtering
    .option('--url-filter <pattern>', 'Filter by source URL (regex)')

    .action(async (options: ConsoleOptions) => {
      try {
        // Navigate if URL provided
        if (options.url) {
          await executeViaDaemon('navigate', { url: options.url });
          // Wait a bit for console messages to appear
          await new Promise(resolve => setTimeout(resolve, TIMING.ACTION_DELAY_NAVIGATION));
        }

        // Get console messages
        const response = await executeViaDaemon('console', { errorsOnly: options.errorsOnly });

        if (response.success) {
          const result = response.data as { count: number; errorCount: number; warningCount: number; logCount: number; messages: FormattedConsoleMessage[] };

          // Apply filters
          let filteredMessages = filterMessages(result.messages, options);

          // Generate output
          const output = formatOutput(filteredMessages, result, options);

          // Save to file or print to console
          if (options.output) {
            const outputPath = path.resolve(options.output);
            fs.writeFileSync(outputPath, output, 'utf-8');
            console.log(`Console messages saved to: ${outputPath}`);
          } else {
            console.log(output);
          }

          if (!options.json && !options.output) {
            console.log('\nBrowser will stay open. Use "daemon-stop" to close it.');
          }
        } else {
          console.error('Console retrieval failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}

/**
 * Filter messages based on provided options
 */
function filterMessages(messages: FormattedConsoleMessage[], options: ConsoleOptions): FormattedConsoleMessage[] {
  let filtered = [...messages];

  // Level filtering
  if (options.level) {
    const level = options.level.toLowerCase();
    filtered = filtered.filter(msg => msg.level.toLowerCase() === level);
  } else if (options.warnings) {
    filtered = filtered.filter(msg => msg.level.toLowerCase() === 'warning');
  } else if (options.logs) {
    filtered = filtered.filter(msg => msg.level.toLowerCase() === 'log');
  }
  // errorsOnly is handled by daemon

  // Text filtering
  if (options.filter) {
    const regex = new RegExp(options.filter, 'i');
    filtered = filtered.filter(msg => regex.test(msg.text));
  }

  if (options.exclude) {
    const regex = new RegExp(options.exclude, 'i');
    filtered = filtered.filter(msg => !regex.test(msg.text));
  }

  // URL filtering
  if (options.urlFilter) {
    const regex = new RegExp(options.urlFilter, 'i');
    filtered = filtered.filter(msg => msg.url && regex.test(msg.url));
  }

  // Skip messages
  const skip = options.skip ? parseInt(options.skip, 10) : 0;
  if (skip > 0) {
    filtered = filtered.slice(skip);
  }

  // Limit messages
  const limit = options.limit ? parseInt(options.limit, 10) : undefined;
  if (limit && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

/**
 * Format output based on options
 */
function formatOutput(
  messages: FormattedConsoleMessage[],
  result: { count: number; errorCount: number; warningCount: number; logCount: number },
  options: ConsoleOptions
): string {
  if (options.json) {
    return JSON.stringify({
      total: result.count,
      filtered: messages.length,
      counts: {
        errors: result.errorCount,
        warnings: result.warningCount,
        logs: result.logCount
      },
      messages: messages
    }, null, 2);
  }

  // Text format
  const lines: string[] = [];

  // Header
  lines.push(`\n=== Console Messages (Total: ${result.count}, Filtered: ${messages.length}) ===`);
  lines.push(`Errors: ${result.errorCount}, Warnings: ${result.warningCount}, Logs: ${result.logCount}\n`);

  if (messages.length === 0) {
    lines.push('No console messages found.');
  } else {
    messages.forEach((msg: FormattedConsoleMessage) => {
      const parts: string[] = [];

      // Timestamp
      if (options.timestamp) {
        parts.push(`[${msg.timestamp}]`);
      }

      // Level with color
      const levelStr = `[${msg.level.toUpperCase()}]`;
      if (options.noColor === false) {
        const coloredLevel = colorizeLevel(levelStr, msg.level);
        parts.push(coloredLevel);
      } else {
        parts.push(levelStr);
      }

      // Location
      if (msg.url) {
        parts.push(`(${msg.url}:${msg.lineNumber || '?'})`);
      }

      // Message text
      parts.push(msg.text);

      lines.push(parts.join(' '));
    });
  }

  return lines.join('\n');
}

/**
 * Colorize level string based on message level
 */
function colorizeLevel(levelStr: string, level: string): string {
  const colors: Record<string, string> = {
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    log: '\x1b[36m',     // Cyan
    info: '\x1b[34m',    // Blue
    verbose: '\x1b[90m', // Gray
  };

  const reset = '\x1b[0m';
  const color = colors[level.toLowerCase()] || '';

  return `${color}${levelStr}${reset}`;
}
