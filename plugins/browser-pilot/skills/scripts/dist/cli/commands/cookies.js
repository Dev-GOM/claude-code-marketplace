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
exports.registerCookiesCommands = registerCookiesCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
function registerCookiesCommands(program) {
    // Get cookies command
    program
        .command('cookies')
        .description('Get all cookies from webpage')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
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
            // Only navigate if URL is provided
            if (options.url) {
                await actions.navigate(browser, options.url);
                await actions.waitForLoad(browser);
            }
            const result = await actions.getCookies(browser);
            console.log(`Found ${result.count} cookies:`);
            console.log(JSON.stringify(result.cookies, null, 2));
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Set cookie
    program
        .command('set-cookie')
        .description('Set a cookie')
        .requiredOption('-n, --name <name>', 'Cookie name')
        .requiredOption('-v, --value <value>', 'Cookie value')
        .option('-d, --domain <domain>', 'Cookie domain')
        .option('-p, --path <path>', 'Cookie path', '/')
        .option('--secure', 'Secure cookie', false)
        .option('--http-only', 'HTTP only cookie', false)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.setCookie(browser, options.name, options.value, options.domain, options.path, options.secure, options.httpOnly);
            console.log('Cookie set:', result.cookie);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Delete cookies
    program
        .command('delete-cookies')
        .description('Delete cookies by name')
        .option('-n, --name <name>', 'Cookie name to delete (deletes all if not specified)')
        .option('-u, --url <url>', 'Navigate to URL first')
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            if (options.url) {
                await actions.navigate(browser, options.url);
                await actions.waitForLoad(browser);
            }
            const result = await actions.deleteCookies(browser, options.name);
            console.log(result.message);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=cookies.js.map