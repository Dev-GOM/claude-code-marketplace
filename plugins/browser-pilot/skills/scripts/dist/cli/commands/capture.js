"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCaptureCommands = registerCaptureCommands;
const daemon_helper_1 = require("../daemon-helper");
function registerCaptureCommands(program) {
    // Screenshot command
    program
        .command('screenshot')
        .description('Capture screenshot of a webpage')
        .option('-u, --url <url>', 'URL to capture (optional, uses current page if not specified)')
        .option('-o, --output <path>', 'Output file path', 'screenshot.png')
        .option('--headless', 'Run in headless mode', false)
        .option('--full-page', 'Capture full page', true)
        .action(async (options) => {
        try {
            // Navigate if URL provided
            if (options.url) {
                await (0, daemon_helper_1.executeViaDaemon)('navigate', { url: options.url });
            }
            // Take screenshot
            const response = await (0, daemon_helper_1.executeViaDaemon)('screenshot', { filename: options.output });
            if (response.success) {
                const data = response.data;
                console.log('Screenshot saved:', data.path);
                console.log('Browser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('Screenshot failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Generate PDF command
    program
        .command('pdf')
        .description('Generate PDF from webpage')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .option('-o, --output <path>', 'Output file path', 'page.pdf')
        .option('--headless', 'Run in headless mode', false)
        .option('--landscape', 'Use landscape orientation', false)
        .action(async (options) => {
        try {
            // Navigate if URL provided
            if (options.url) {
                await (0, daemon_helper_1.executeViaDaemon)('navigate', { url: options.url });
            }
            // Generate PDF
            const response = await (0, daemon_helper_1.executeViaDaemon)('pdf', {
                filename: options.output,
                landscape: options.landscape
            });
            if (response.success) {
                const data = response.data;
                console.log('PDF saved:', data.path);
                console.log('Browser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('PDF generation failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=capture.js.map