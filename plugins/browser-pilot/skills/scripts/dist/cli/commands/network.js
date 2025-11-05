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
exports.registerNetworkCommands = registerNetworkCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
function registerNetworkCommands(program) {
    // Block URL command
    program
        .command('block-url')
        .description('Block network requests matching a URL pattern (e.g., "*.jpg", "*ads*", "*analytics*")')
        .requiredOption('-p, --pattern <pattern>', 'URL pattern to block (e.g., "*.jpg", "*ads*")')
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.blockRequest(browser, options.pattern);
            console.log('Blocked URL pattern:', result.urlPattern);
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Unblock URLs command
    program
        .command('unblock-urls')
        .description('Remove all network request blocks and allow all URLs to load')
        .action(async () => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            await actions.unblockRequests(browser);
            console.log('All URL blocks removed');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Enable request interception
    program
        .command('enable-interception')
        .description('Enable network request interception for monitoring and modifying HTTP requests')
        .action(async () => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.enableRequestInterception(browser);
            console.log('Request interception enabled');
            console.log('Note:', result.note);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Disable request interception
    program
        .command('disable-interception')
        .description('Disable network request interception and return to normal browsing mode')
        .action(async () => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            await actions.disableRequestInterception(browser);
            console.log('Request interception disabled');
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=network.js.map