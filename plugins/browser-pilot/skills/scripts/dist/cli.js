#!/usr/bin/env node
"use strict";
/**
 * CDP Browser CLI - Chrome DevTools Protocol browser automation tool.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const navigation_1 = require("./cli/commands/navigation");
const interaction_1 = require("./cli/commands/interaction");
const forms_1 = require("./cli/commands/forms");
const capture_1 = require("./cli/commands/capture");
const tabs_1 = require("./cli/commands/tabs");
const cookies_1 = require("./cli/commands/cookies");
const console_1 = require("./cli/commands/console");
const network_1 = require("./cli/commands/network");
const emulation_1 = require("./cli/commands/emulation");
const dialogs_1 = require("./cli/commands/dialogs");
const scroll_1 = require("./cli/commands/scroll");
const wait_1 = require("./cli/commands/wait");
const data_1 = require("./cli/commands/data");
const focus_1 = require("./cli/commands/focus");
const accessibility_1 = require("./cli/commands/accessibility");
const program = new commander_1.Command();
program
    .name('cdp-browser')
    .description('Chrome DevTools Protocol browser automation CLI')
    .version('1.0.0')
    .requiredOption('--project-root <path>', 'Project root directory (required for file output paths)');
// Register all command groups
(0, navigation_1.registerNavigationCommands)(program);
(0, interaction_1.registerInteractionCommands)(program);
(0, forms_1.registerFormsCommands)(program);
(0, capture_1.registerCaptureCommands)(program);
(0, tabs_1.registerTabsCommands)(program);
(0, cookies_1.registerCookiesCommands)(program);
(0, console_1.registerConsoleCommands)(program);
(0, network_1.registerNetworkCommands)(program);
(0, emulation_1.registerEmulationCommands)(program);
(0, dialogs_1.registerDialogsCommands)(program);
(0, scroll_1.registerScrollCommands)(program);
(0, wait_1.registerWaitCommands)(program);
(0, data_1.registerDataCommands)(program);
(0, focus_1.registerFocusCommands)(program);
(0, accessibility_1.registerAccessibilityCommands)(program);
// Handle --project-root option before any command action
program.hook('preAction', (thisCommand, actionCommand) => {
    const opts = thisCommand.opts(); // Use thisCommand instead of actionCommand for global options
    if (opts.projectRoot) {
        process.env.CLAUDE_PROJECT_ROOT = opts.projectRoot;
    }
});
// Parse command line arguments
program.parse();
//# sourceMappingURL=cli.js.map