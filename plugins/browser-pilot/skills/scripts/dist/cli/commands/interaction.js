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
exports.registerInteractionCommands = registerInteractionCommands;
const daemon_helper_1 = require("../daemon-helper");
const selector_helper_1 = require("./selector-helper");
const config_1 = require("../../cdp/config");
const helpers_1 = require("../../cdp/actions/helpers");
const path = __importStar(require("path"));
function registerInteractionCommands(program) {
    // Click command
    program
        .command('click')
        .description('Click an element (use -s for selector or --text for smart mode)')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .option('-s, --selector <selector>', 'CSS selector to click (direct mode)')
        .option('--text <text>', 'Text content to search for (smart mode)')
        .option('--index <number>', 'Select nth match (1-based, for duplicate text)', parseInt)
        .option('--type <type>', 'Element type filter (e.g., button, input)')
        .option('--viewport-only', 'Only search visible elements', false)
        .option('--verify', 'Verify action success', false)
        .option('--headless', 'Run in headless mode', false)
        .action(async (options) => {
        try {
            if (options.url) {
                await (0, daemon_helper_1.executeViaDaemon)('navigate', { url: options.url, waitForLoad: true });
            }
            let selector = options.selector;
            // Smart mode: query map if text option provided
            if (options.text && !selector) {
                console.log(`🔍 Searching for: "${options.text}"${options.index ? ` (match #${options.index})` : ''}`);
                console.log(`📁 Map path: ${path.join((0, config_1.getOutputDir)(), helpers_1.SELECTOR_RETRY_CONFIG.MAP_FILENAME)}`);
                selector = await (0, selector_helper_1.findSelectorWithRetry)({
                    text: options.text,
                    index: options.index,
                    type: options.type,
                    viewportOnly: options.viewportOnly
                }, 'element');
                if (!selector) {
                    console.error('   Try using --selector for direct mode');
                    process.exit(1);
                }
                console.log(`✓ Found element with selector: ${selector}`);
            }
            // Validate selector
            if (!selector) {
                console.error('❌ No selector provided. Use either:');
                console.error('   --selector <selector>  (direct mode)');
                console.error('   --text <text>          (smart mode)');
                process.exit(1);
            }
            const response = await (0, daemon_helper_1.executeViaDaemon)('click', {
                selector,
                verify: options.verify
            });
            if (response.success) {
                console.log('✓ Clicked:', selector);
                console.log('Browser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('❌ Click failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Fill command
    program
        .command('fill')
        .description('Fill an input field (requires -v/--value)')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .option('-s, --selector <selector>', 'CSS selector of input field (direct mode)')
        .option('--label <label>', 'Label or placeholder text to search for (smart mode)')
        .option('--type <type>', 'Input type filter (e.g., input-text, input-password)', 'input')
        .option('--viewport-only', 'Only search visible elements', false)
        .requiredOption('-v, --value <value>', 'Value to fill')
        .option('--verify', 'Verify action success', false)
        .option('--headless', 'Run in headless mode', false)
        .action(async (options) => {
        try {
            if (options.url) {
                await (0, daemon_helper_1.executeViaDaemon)('navigate', { url: options.url, waitForLoad: true });
            }
            let selector = options.selector;
            // Smart mode: query map if label option provided
            if (options.label && !selector) {
                console.log(`🔍 Searching for input: "${options.label}"`);
                selector = await (0, selector_helper_1.findSelectorWithRetry)({
                    text: options.label,
                    type: options.type,
                    viewportOnly: options.viewportOnly
                }, 'input field');
                if (!selector) {
                    console.error('   Try using --selector for direct mode');
                    process.exit(1);
                }
                console.log(`✓ Found input field with selector: ${selector}`);
            }
            // Validate selector
            if (!selector) {
                console.error('❌ No selector provided. Use either:');
                console.error('   --selector <selector>  (direct mode)');
                console.error('   --label <label>        (smart mode)');
                process.exit(1);
            }
            const response = await (0, daemon_helper_1.executeViaDaemon)('fill', {
                selector,
                value: options.value,
                verify: options.verify
            });
            if (response.success) {
                console.log('✓ Filled:', selector, 'with:', options.value);
                console.log('Browser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('❌ Fill failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Hover command
    program
        .command('hover')
        .description('Hover over an element (requires -s/--selector)')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .requiredOption('-s, --selector <selector>', 'CSS selector to hover')
        .option('--headless', 'Run in headless mode', false)
        .action(async (options) => {
        try {
            if (options.url) {
                await (0, daemon_helper_1.executeViaDaemon)('navigate', { url: options.url, waitForLoad: true });
            }
            const response = await (0, daemon_helper_1.executeViaDaemon)('hover', { selector: options.selector });
            if (response.success) {
                console.log('✓ Hovered over:', options.selector);
                console.log('Browser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('❌ Hover failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Press key command
    program
        .command('press')
        .description('Press a keyboard key (requires -k/--key, e.g., Enter, Tab, Escape)')
        .requiredOption('-k, --key <key>', 'Key to press (e.g., Enter, Tab, Escape)')
        .option('--headless', 'Run in headless mode', false)
        .action(async (options) => {
        try {
            const response = await (0, daemon_helper_1.executeViaDaemon)('press', { key: options.key });
            if (response.success) {
                console.log('✓ Pressed key:', options.key);
                console.log('Browser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('❌ Press failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Type text command
    program
        .command('type')
        .description('Type text character by character (requires -t/--text)')
        .requiredOption('-t, --text <text>', 'Text to type')
        .option('-d, --delay <ms>', 'Delay between characters (ms)', parseInt, 0)
        .option('--headless', 'Run in headless mode', false)
        .action(async (options) => {
        try {
            const response = await (0, daemon_helper_1.executeViaDaemon)('type', {
                text: options.text,
                delay: options.delay
            });
            if (response.success) {
                console.log('✓ Typed text:', options.text);
                console.log('Browser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('❌ Type failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Upload file command (not implemented in server yet, skip for now)
    program
        .command('upload')
        .description('Upload file to input element (requires -s/--selector and -f/--file)')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .requiredOption('-s, --selector <selector>', 'CSS selector of file input')
        .requiredOption('-f, --file <path>', 'File path to upload')
        .option('--headless', 'Run in headless mode', false)
        .action(async () => {
        console.error('Upload command not yet implemented in daemon mode');
        process.exit(1);
    });
    // Drag and drop command (not implemented in server yet, skip for now)
    program
        .command('drag')
        .description('Drag and drop element (requires --from and --to selectors)')
        .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
        .requiredOption('--from <selector>', 'Source element selector')
        .requiredOption('--to <selector>', 'Target element selector')
        .option('--headless', 'Run in headless mode', false)
        .action(async () => {
        console.error('Drag command not yet implemented in daemon mode');
        process.exit(1);
    });
}
//# sourceMappingURL=interaction.js.map