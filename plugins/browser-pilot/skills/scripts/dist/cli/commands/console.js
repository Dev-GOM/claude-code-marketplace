"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConsoleCommands = registerConsoleCommands;
const daemon_helper_1 = require("../daemon-helper");
const constants_1 = require("../../constants");
function registerConsoleCommands(program) {
    // Get console messages
    program
        .command('console')
        .description('Retrieve console messages from the page (use --errors-only to filter error messages only)')
        .option('-u, --url <url>', 'Navigate to URL before getting console messages')
        .option('-e, --errors-only', 'Show only error messages', false)
        .action(async (options) => {
        try {
            // Navigate if URL provided
            if (options.url) {
                await (0, daemon_helper_1.executeViaDaemon)('navigate', { url: options.url });
                // Wait a bit for console messages to appear
                await new Promise(resolve => setTimeout(resolve, constants_1.TIMING.ACTION_DELAY_NAVIGATION));
            }
            // Get console messages
            const response = await (0, daemon_helper_1.executeViaDaemon)('console', { errorsOnly: options.errorsOnly });
            if (response.success) {
                const result = response.data;
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
                console.log('\nBrowser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('Console retrieval failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=console.js.map