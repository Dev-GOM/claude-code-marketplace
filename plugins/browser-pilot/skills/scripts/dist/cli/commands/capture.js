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
exports.registerCaptureCommands = registerCaptureCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
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
        const browser = new browser_1.ChromeBrowser(options.headless);
        try {
            // Try to connect to existing browser first, launch new one if failed
            try {
                await browser.connect();
            }
            catch {
                await browser.launch();
            }
            if (options.url) {
                await actions.navigate(browser, options.url);
                await actions.waitForLoad(browser);
            }
            const result = await actions.screenshot(browser, options.output, options.fullPage);
            console.log('Screenshot saved:', result.path);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
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
        const browser = new browser_1.ChromeBrowser(options.headless);
        try {
            // Try to connect to existing browser first, launch new one if failed
            try {
                await browser.connect();
            }
            catch {
                await browser.launch();
            }
            // Only navigate if URL is provided
            if (options.url) {
                await actions.navigate(browser, options.url);
                await actions.waitForLoad(browser);
            }
            const result = await actions.generatePdf(browser, options.output, options.landscape);
            console.log('PDF saved:', result.path);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=capture.js.map