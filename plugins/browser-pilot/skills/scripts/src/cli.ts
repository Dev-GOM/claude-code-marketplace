#!/usr/bin/env node

/**
 * CDP Browser CLI - Chrome DevTools Protocol browser automation tool.
 */

import { Command } from 'commander';
import { registerNavigationCommands } from './cli/commands/navigation';
import { registerInteractionCommands } from './cli/commands/interaction';
import { registerFormsCommands } from './cli/commands/forms';
import { registerCaptureCommands } from './cli/commands/capture';
import { registerTabsCommands } from './cli/commands/tabs';
import { registerCookiesCommands } from './cli/commands/cookies';
import { registerConsoleCommands } from './cli/commands/console';
import { registerNetworkCommands } from './cli/commands/network';
import { registerEmulationCommands } from './cli/commands/emulation';
import { registerDialogsCommands } from './cli/commands/dialogs';
import { registerScrollCommands } from './cli/commands/scroll';
import { registerWaitCommands } from './cli/commands/wait';
import { registerDataCommands } from './cli/commands/data';
import { registerFocusCommands } from './cli/commands/focus';
import { registerAccessibilityCommands } from './cli/commands/accessibility';

const program = new Command();

program
  .name('cdp-browser')
  .description('Chrome DevTools Protocol browser automation CLI')
  .version('1.0.0')
  .requiredOption('--project-root <path>', 'Project root directory (required for file output paths)');

// Register all command groups
registerNavigationCommands(program);
registerInteractionCommands(program);
registerFormsCommands(program);
registerCaptureCommands(program);
registerTabsCommands(program);
registerCookiesCommands(program);
registerConsoleCommands(program);
registerNetworkCommands(program);
registerEmulationCommands(program);
registerDialogsCommands(program);
registerScrollCommands(program);
registerWaitCommands(program);
registerDataCommands(program);
registerFocusCommands(program);
registerAccessibilityCommands(program);

// Handle --project-root option before any command action
program.hook('preAction', (thisCommand, actionCommand) => {
  const opts = thisCommand.opts();  // Use thisCommand instead of actionCommand for global options
  if (opts.projectRoot) {
    process.env.CLAUDE_PROJECT_ROOT = opts.projectRoot;
  }
});

// Parse command line arguments
program.parse();
