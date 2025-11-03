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
exports.registerDialogsCommands = registerDialogsCommands;
const browser_1 = require("../../cdp/browser");
const actions = __importStar(require("../../cdp/actions"));
function registerDialogsCommands(program) {
    // Dialog response command
    program
        .command('dialog')
        .description('Respond to JavaScript dialog (alert/confirm/prompt)')
        .option('-a, --accept', 'Accept dialog (default: true)', true)
        .option('-d, --dismiss', 'Dismiss dialog')
        .option('-t, --text <text>', 'Text for prompt dialog')
        .action(async (options) => {
        const browser = new browser_1.ChromeBrowser(false);
        try {
            await browser.connect();
            const accept = !options.dismiss;
            const result = await actions.respondToDialog(browser, accept, options.text);
            console.log('Dialog', result.accept ? 'accepted' : 'dismissed');
            if (result.promptText) {
                console.log('Prompt text:', result.promptText);
            }
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=dialogs.js.map