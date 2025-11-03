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
exports.registerFormsCommands = registerFormsCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
function registerFormsCommands(program) {
    // Select option command
    program
        .command('select')
        .description('Select option from dropdown')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .requiredOption('-s, --selector <selector>', 'CSS selector of select element')
        .requiredOption('-v, --value <value>', 'Option value to select')
        .option('--headless', 'Run in headless mode', false)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(options.headless);
        try {
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
            const result = await actions.selectOption(browser, options.selector, options.value);
            console.log('Selected:', result.value, 'in', result.selector);
            console.log('Browser will stay open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Check checkbox command
    program
        .command('check')
        .description('Check a checkbox')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .requiredOption('-s, --selector <selector>', 'CSS selector of checkbox')
        .option('--headless', 'Run in headless mode', false)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(options.headless);
        try {
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
            const result = await actions.check(browser, options.selector);
            console.log('Checked:', result.selector);
            console.log('Browser will stay open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Uncheck checkbox command
    program
        .command('uncheck')
        .description('Uncheck a checkbox')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .requiredOption('-s, --selector <selector>', 'CSS selector of checkbox')
        .option('--headless', 'Run in headless mode', false)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(options.headless);
        try {
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
            const result = await actions.uncheck(browser, options.selector);
            console.log('Unchecked:', result.selector);
            console.log('Browser will stay open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=forms.js.map