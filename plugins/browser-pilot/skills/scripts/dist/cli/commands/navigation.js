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
exports.registerNavigationCommands = registerNavigationCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
function registerNavigationCommands(program) {
    // Navigate command
    program
        .command('navigate')
        .description('Navigate to a URL')
        .requiredOption('-u, --url <url>', 'URL to navigate to')
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
            const result = await actions.navigate(browser, options.url);
            await actions.waitForLoad(browser);
            console.log('Navigated to:', result.url);
            console.log('Browser will stay open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Go back command
    program
        .command('back')
        .description('Navigate back in history')
        .action(async () => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.goBack(browser);
            if (result.success) {
                console.log('Navigated back to:', result.url);
            }
            else {
                console.log(result.error);
            }
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Go forward command
    program
        .command('forward')
        .description('Navigate forward in history')
        .action(async () => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.goForward(browser);
            if (result.success) {
                console.log('Navigated forward to:', result.url);
            }
            else {
                console.log(result.error);
            }
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Reload command
    program
        .command('reload')
        .description('Reload the current page')
        .option('--hard', 'Hard reload (ignore cache)', false)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            try {
                await browser.connect();
            }
            catch {
                await browser.launch();
            }
            const result = await actions.reload(browser, options.hard);
            console.log('Page reloaded (hard:', result.hardReload, ')');
            console.log('Browser will stay open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=navigation.js.map