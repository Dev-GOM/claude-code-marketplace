"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTabsCommands = registerTabsCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
const manager_1 = require("../../daemon/manager");
function registerTabsCommands(program) {
    // List tabs command
    program
        .command('tabs')
        .description('List all open tabs with their index numbers, titles, and URLs')
        .action(async () => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.listTabs(browser);
            const tabs = result.tabs;
            console.log(`Found ${result.count} tabs:`);
            tabs.forEach((tab) => {
                console.log(`[${tab.index}] ${tab.title} - ${tab.url}`);
            });
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // New tab command
    program
        .command('new-tab')
        .description('Open a new tab in the browser (optionally navigate to a specific URL with -u)')
        .option('-u, --url <url>', 'URL to open', 'about:blank')
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.newTab(browser, options.url);
            console.log('New tab opened:', result.targetId);
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Close tab command
    program
        .command('close-tab')
        .description('Close a specific tab by its index number (use "tabs" command to see index numbers)')
        .requiredOption('-i, --index <number>', 'Tab index to close', parseInt)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.closeTab(browser, undefined, options.index);
            console.log(result.message);
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Switch tab
    program
        .command('switch-tab')
        .description('Switch to a different tab by its index number (use "tabs" command to see index numbers)')
        .requiredOption('-i, --index <index>', 'Tab index', parseInt)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.switchTab(browser, options.index);
            console.log(result.message);
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Close browser command
    program
        .command('close')
        .description('Close the browser completely and stop the daemon process')
        .action(async () => {
        const browser = new browser_1.ChromeBrowser(false);
        const daemonManager = new manager_1.DaemonManager();
        try {
            // Close browser first
            await browser.connect();
            await browser.close();
            console.log('✓ Browser closed');
            // Then stop daemon
            if (await daemonManager.isRunning()) {
                await daemonManager.stop({ verbose: true });
                console.log('✓ Daemon stopped');
            }
            process.exit(0);
        }
        catch (error) {
            // Try to stop daemon even if browser close failed
            try {
                if (await daemonManager.isRunning()) {
                    await daemonManager.stop({ verbose: true });
                    console.log('✓ Daemon stopped');
                }
            }
            catch (daemonError) {
                console.error('Warning: Could not stop daemon:', daemonError);
            }
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=tabs.js.map