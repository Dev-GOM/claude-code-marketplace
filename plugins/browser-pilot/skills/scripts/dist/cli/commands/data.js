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
exports.registerDataCommands = registerDataCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
function registerDataCommands(program) {
    // Extract text command
    program
        .command('extract')
        .description('Extract text from webpage')
        .option('-u, --url <url>', 'URL to extract from (optional, uses current page if not specified)')
        .option('-s, --selector <selector>', 'CSS selector (optional)')
        .option('--headless', 'Run in headless mode', false)
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
            const result = await actions.extractText(browser, options.selector);
            console.log('Extracted text:', result.text);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Evaluate command
    program
        .command('eval')
        .description('Execute JavaScript on the page')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .requiredOption('-e, --expression <script>', 'JavaScript expression to evaluate')
        .option('--headless', 'Run in headless mode', false)
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
            const result = await actions.evaluate(browser, options.expression);
            console.log('Result:', result.result);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Get content command
    program
        .command('content')
        .description('Get page HTML content')
        .action(async () => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.getContent(browser);
            console.log('HTML content length:', result.length);
            console.log(result.content);
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Extract data
    program
        .command('extract-data')
        .description('Extract data using multiple selectors')
        .requiredOption('-s, --selectors <json>', 'JSON object of key-selector pairs')
        .option('-u, --url <url>', 'Navigate to URL first')
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            if (options.url) {
                await actions.navigate(browser, options.url);
                await actions.waitForLoad(browser);
            }
            const selectors = JSON.parse(options.selectors);
            const result = await actions.extractData(browser, selectors);
            console.log('Extracted data:', JSON.stringify(result.data, null, 2));
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Find element
    program
        .command('find')
        .description('Find element and return its information')
        .requiredOption('-s, --selector <selector>', 'CSS selector')
        .option('-u, --url <url>', 'Navigate to URL first')
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            if (options.url) {
                await actions.navigate(browser, options.url);
                await actions.waitForLoad(browser);
            }
            const result = await actions.findElement(browser, options.selector);
            console.log('Element info:', JSON.stringify(result.element, null, 2));
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Get element property
    program
        .command('get-property')
        .description('Get element property value')
        .requiredOption('-s, --selector <selector>', 'CSS selector')
        .requiredOption('-p, --property <property>', 'Property name')
        .option('-u, --url <url>', 'Navigate to URL first')
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            if (options.url) {
                await actions.navigate(browser, options.url);
                await actions.waitForLoad(browser);
            }
            const result = await actions.getElementProperty(browser, options.selector, options.property);
            console.log(`${options.property}:`, result.value);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=data.js.map