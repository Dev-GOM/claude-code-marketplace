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
exports.registerConsoleCommands = registerConsoleCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
function registerConsoleCommands(program) {
    // Get console messages
    program
        .command('console')
        .description('Get console messages from the page')
        .option('-u, --url <url>', 'Navigate to URL before getting console messages')
        .option('-e, --errors-only', 'Show only error messages', false)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser();
        try {
            await browser.connect();
            if (options.url) {
                await actions.navigate(browser, options.url);
                await actions.waitForLoad(browser);
                // Wait a bit for console messages to appear
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            const result = await actions.getConsoleMessages(browser, options.errorsOnly);
            console.log(`\n=== Console Messages (Total: ${result.count}) ===`);
            console.log(`Errors: ${result.errorCount}, Warnings: ${result.warningCount}, Logs: ${result.logCount}\n`);
            if (result.messages.length === 0) {
                console.log('No console messages found.');
            }
            else {
                result.messages.forEach((msg) => {
                    const location = msg.url ? ` (${msg.url}:${msg.lineNumber || '?'})` : '';
                    console.log(`[${msg.level.toUpperCase()}]${location} ${msg.text}`);
                });
            }
            console.log('\nBrowser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=console.js.map