#!/usr/bin/env node
"use strict";
/**
 * CDP Browser CLI - Chrome DevTools Protocol browser automation tool.
 */
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
const commander_1 = require("commander");
const browser_1 = require("./cdp/browser");
const actions = __importStar(require("./cdp/actions"));
const program = new commander_1.Command();
program
    .name('cdp-browser')
    .description('Chrome DevTools Protocol browser automation CLI')
    .version('1.0.0')
    .option('--project-root <path>', 'Project root directory (overrides auto-detection)');
// Screenshot command
program
    .command('screenshot')
    .description('Capture screenshot of a webpage')
    .requiredOption('-u, --url <url>', 'URL to capture')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
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
// Extract text command
program
    .command('extract')
    .description('Extract text from webpage')
    .requiredOption('-u, --url <url>', 'URL to extract from')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
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
// Click command
program
    .command('click')
    .description('Click an element on the page')
    .requiredOption('-u, --url <url>', 'URL to navigate to')
    .requiredOption('-s, --selector <selector>', 'CSS selector to click')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
        const result = await actions.click(browser, options.selector);
        console.log('Clicked:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Fill command
program
    .command('fill')
    .description('Fill an input field')
    .requiredOption('-u, --url <url>', 'URL to navigate to')
    .requiredOption('-s, --selector <selector>', 'CSS selector of input field')
    .requiredOption('-v, --value <value>', 'Value to fill')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
        const result = await actions.fill(browser, options.selector, options.value);
        console.log('Filled:', result.selector, 'with:', result.value);
        console.log('Browser will stay open. Use "close" command to close it.');
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
    .requiredOption('-u, --url <url>', 'URL to navigate to')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
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
// Generate PDF command
program
    .command('pdf')
    .description('Generate PDF from webpage')
    .requiredOption('-u, --url <url>', 'URL to generate PDF from')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
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
// Get cookies command
program
    .command('cookies')
    .description('Get all cookies from webpage')
    .requiredOption('-u, --url <url>', 'URL to get cookies from')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
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
// List tabs command
program
    .command('tabs')
    .description('List all open tabs')
    .action(async () => {
    const browser = new browser_1.ChromeBrowser(false);
    try {
        await browser.connect();
        const result = await actions.listTabs(browser);
        console.log(`Found ${result.count} tabs:`);
        result.tabs.forEach((tab) => {
            console.log(`[${tab.index}] ${tab.title} - ${tab.url}`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// New tab command
program
    .command('new-tab')
    .description('Open a new tab')
    .option('-u, --url <url>', 'URL to open', 'about:blank')
    .action(async (options) => {
    const browser = new browser_1.ChromeBrowser(false);
    try {
        await browser.connect();
        const result = await actions.newTab(browser, options.url);
        console.log('New tab opened:', result.targetId);
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Close tab command
program
    .command('close-tab')
    .description('Close a tab by index')
    .requiredOption('-i, --index <number>', 'Tab index to close', parseInt)
    .action(async (options) => {
    const browser = new browser_1.ChromeBrowser(false);
    try {
        await browser.connect();
        const result = await actions.closeTab(browser, undefined, options.index);
        console.log(result.message);
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Close browser command
program
    .command('close')
    .description('Close the browser')
    .action(async () => {
    const browser = new browser_1.ChromeBrowser(false);
    try {
        await browser.connect();
        await browser.close();
        console.log('✓ Browser closed');
        process.exit(0);
    }
    catch (error) {
        console.error('Error: Could not connect to browser. Is it running?');
        process.exit(1);
    }
});
// Hover command
program
    .command('hover')
    .description('Hover over an element')
    .requiredOption('-u, --url <url>', 'URL to navigate to')
    .requiredOption('-s, --selector <selector>', 'CSS selector to hover')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
        const result = await actions.hover(browser, options.selector);
        console.log('Hovered:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Press key command
program
    .command('press')
    .description('Press a keyboard key')
    .requiredOption('-k, --key <key>', 'Key to press (e.g., Enter, Tab, Escape)')
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
        const result = await actions.pressKey(browser, options.key);
        console.log('Pressed key:', result.key);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Type text command
program
    .command('type')
    .description('Type text character by character')
    .requiredOption('-t, --text <text>', 'Text to type')
    .option('-d, --delay <ms>', 'Delay between characters (ms)', parseInt, 0)
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
        const result = await actions.typeText(browser, options.text, options.delay);
        console.log('Typed:', result.text);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Upload file command
program
    .command('upload')
    .description('Upload file to input element')
    .requiredOption('-u, --url <url>', 'URL to navigate to')
    .requiredOption('-s, --selector <selector>', 'CSS selector of file input')
    .requiredOption('-f, --file <path>', 'File path to upload')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
        const result = await actions.uploadFile(browser, options.selector, options.file);
        console.log('Uploaded:', result.file);
        console.log('Browser will stay open. Use "close" command to close it.');
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
// Scroll command
program
    .command('scroll')
    .description('Scroll page or element')
    .requiredOption('-x, --x <pixels>', 'Horizontal scroll position', parseInt)
    .requiredOption('-y, --y <pixels>', 'Vertical scroll position', parseInt)
    .option('-s, --selector <selector>', 'CSS selector to scroll (optional)')
    .action(async (options) => {
    const browser = new browser_1.ChromeBrowser(false);
    try {
        await browser.connect();
        const result = await actions.scroll(browser, options.x, options.y, options.selector);
        console.log('Scrolled to:', result.position);
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
// Select option command
program
    .command('select')
    .description('Select option from dropdown')
    .requiredOption('-u, --url <url>', 'URL to navigate to')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
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
    .requiredOption('-u, --url <url>', 'URL to navigate to')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
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
    .requiredOption('-u, --url <url>', 'URL to navigate to')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
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
// Drag and drop command
program
    .command('drag')
    .description('Drag and drop element')
    .requiredOption('-u, --url <url>', 'URL to navigate to')
    .requiredOption('--from <selector>', 'Source element selector')
    .requiredOption('--to <selector>', 'Target element selector')
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
        await actions.navigate(browser, options.url);
        await actions.waitForLoad(browser);
        const result = await actions.dragAndDrop(browser, options.from, options.to);
        console.log('Dragged', result.sourceSelector, 'to', result.targetSelector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Emulate media command
program
    .command('emulate-media')
    .description('Emulate media type or color scheme')
    .option('-m, --media <type>', 'Media type: screen or print')
    .option('-c, --color-scheme <scheme>', 'Color scheme: light, dark, or no-preference')
    .action(async (options) => {
    const browser = new browser_1.ChromeBrowser(false);
    try {
        await browser.connect();
        const result = await actions.emulateMedia(browser, options.media, options.colorScheme);
        console.log('Emulated media:', result.mediaType || 'none', 'colorScheme:', result.colorScheme || 'none');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
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
// Block URL command
program
    .command('block-url')
    .description('Block network requests matching URL pattern')
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
    .description('Unblock all network requests')
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
// Get console messages
program
    .command('console')
    .description('Get console messages from the page')
    .option('-u, --url <url>', 'Navigate to URL before getting console messages')
    .option('-e, --errors-only', 'Show only error messages', false)
    .action(async (options) => {
    const browser = new browser_1.ChromeBrowser();
    try {
        await browser.connect();
        if (options.url) {
            await actions.navigate(browser, options.url);
            await actions.waitForLoad(browser);
            // Wait a bit for console messages to appear
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const result = await actions.getConsoleMessages(browser, options.errorsOnly);
        console.log(`\n=== Console Messages (Total: ${result.count}) ===`);
        console.log(`Errors: ${result.errorCount}, Warnings: ${result.warningCount}, Logs: ${result.logCount}\n`);
        if (result.messages.length === 0) {
            console.log('No console messages found.');
        }
        else {
            result.messages.forEach((msg) => {
                const location = msg.url ? ` (${msg.url}:${msg.lineNumber || '?'})` : '';
                console.log(`[${msg.level.toUpperCase()}]${location} ${msg.text}`);
            });
        }
        console.log('\nBrowser remains open. Use "close" command to close it.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Focus element
program
    .command('focus')
    .description('Focus on an element')
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
        const result = await actions.focus(browser, options.selector);
        console.log('Focused:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
// Blur element
program
    .command('blur')
    .description('Remove focus from an element')
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
        const result = await actions.blur(browser, options.selector);
        console.log('Blurred:', result.selector);
        console.log('Browser will stay open. Use "close" command to close it.');
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
// Switch tab
program
    .command('switch-tab')
    .description('Switch to a tab by index')
    .requiredOption('-i, --index <index>', 'Tab index', parseInt)
    .action(async (options) => {
    const browser = new browser_1.ChromeBrowser(false);
    try {
        await browser.connect();
        const result = await actions.switchTab(browser, options.index);
        console.log(result.message);
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
// Get accessibility snapshot
program
    .command('accessibility')
    .description('Get accessibility tree snapshot')
    .option('-u, --url <url>', 'Navigate to URL first')
    .action(async (options) => {
    const browser = new browser_1.ChromeBrowser(false);
    try {
        await browser.connect();
        if (options.url) {
            await actions.navigate(browser, options.url);
            await actions.waitForLoad(browser);
        }
        const result = await actions.getAccessibilitySnapshot(browser);
        console.log(`Accessibility nodes: ${result.nodeCount}`);
        console.log('First 50 nodes:', JSON.stringify(result.nodes, null, 2));
        console.log('Browser remains open. Use "close" command to close it.');
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
    .description('Enable network request interception')
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
    .description('Disable network request interception')
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
// Handle --project-root option before any command action
program.hook('preAction', (thisCommand, actionCommand) => {
    const opts = actionCommand.opts();
    if (opts.projectRoot) {
        process.env.CLAUDE_PROJECT_ROOT = opts.projectRoot;
    }
});
// Parse command line arguments
program.parse();
//# sourceMappingURL=cli.js.map