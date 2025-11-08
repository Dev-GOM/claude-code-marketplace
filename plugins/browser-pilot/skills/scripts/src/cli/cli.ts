#!/usr/bin/env node

/**
 * CDP Browser CLI - Chrome DevTools Protocol browser automation tool.
 */

import { Command } from 'commander';
import { registerNavigationCommands } from './commands/navigation';
import { registerInteractionCommands } from './commands/interaction';
import { registerFormsCommands } from './commands/forms';
import { registerCaptureCommands } from './commands/capture';
import { registerTabsCommands } from './commands/tabs';
import { registerCookiesCommands } from './commands/cookies';
import { registerConsoleCommands } from './commands/console';
import { registerNetworkCommands } from './commands/network';
import { registerEmulationCommands } from './commands/emulation';
import { registerDialogsCommands } from './commands/dialogs';
import { registerScrollCommands } from './commands/scroll';
import { registerWaitCommands } from './commands/wait';
import { registerDataCommands } from './commands/data';
import { registerFocusCommands } from './commands/focus';
import { registerAccessibilityCommands } from './commands/accessibility';
import { registerDaemonCommands } from './commands/daemon';
import { registerChainCommands } from './commands/chain';
import { registerQueryCommands } from './commands/query';
import { registerSystemCommands } from './commands/system';

const program = new Command();

program
  .name('cdp-browser')
  .description('Chrome DevTools Protocol browser automation CLI')
  .version('1.0.0')
  .addHelpText('after', '\nTip: Use "<command> --help" to see detailed options for each command.\nExample: cdp-browser navigate --help');

// Register all command groups
registerDaemonCommands(program); // Daemon management first
registerSystemCommands(program); // System maintenance commands
registerChainCommands(program); // Chain mode for sequential execution
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
registerQueryCommands(program); // Query interaction map

// Parse command line arguments
program.parse();
