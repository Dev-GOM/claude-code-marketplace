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
exports.registerWaitCommands = registerWaitCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
function registerWaitCommands(program) {
    // Wait for element command
    program
        .command('wait')
        .description('Wait for element to appear')
        .requiredOption('-s, --selector <selector>', 'CSS selector to wait for')
        .option('-t, --timeout <ms>', 'Timeout in milliseconds', parseInt, 30000)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.waitFor(browser, options.selector, options.timeout);
            console.log('Element found:', result.selector);
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Wait milliseconds
    program
        .command('sleep')
        .description('Wait for specified milliseconds')
        .requiredOption('-t, --time <ms>', 'Milliseconds to wait', parseInt)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.waitMilliseconds(browser, options.time);
            console.log(`Waited ${result.waitedMs}ms`);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Wait for network idle
    program
        .command('wait-idle')
        .description('Wait for network to be idle')
        .option('-t, --timeout <ms>', 'Timeout in milliseconds', parseInt, 5000)
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const result = await actions.waitForNetworkIdle(browser, options.timeout);
            console.log('Network is idle:', result.state);
            console.log('Browser remains open. Use "close" command to close it.');
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=wait.js.map