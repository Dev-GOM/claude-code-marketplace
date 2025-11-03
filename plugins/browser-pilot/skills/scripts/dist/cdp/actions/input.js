"use strict";
/**
 * Keyboard input actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pressKey = pressKey;
exports.typeText = typeText;
const helpers_1 = require("./helpers");
/**
 * Press keyboard key.
 * Uses CDP Input.dispatchKeyEvent for proper React compatibility.
 * Supports special keys like 'Enter', 'Escape', 'Tab', etc.
 */
async function pressKey(browser, key, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`⌨️  Pressing key: ${key}`);
    try {
        // Send keyDown event
        await browser.sendCommand('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: key
        });
        // Send keyUp event
        await browser.sendCommand('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: key
        });
        if (opts.verbose)
            console.log(`✅ Key pressed: ${key}`);
        (0, helpers_1.checkConsoleErrors)(browser);
        return { success: true, key };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Press key failed: ${key}`);
            console.error(`   Error: ${error.message}`);
        }
        (0, helpers_1.checkConsoleErrors)(browser);
        throw error;
    }
}
/**
 * Type text character by character.
 * Uses CDP Input.insertText for proper React compatibility.
 * Supports delay between characters for typing simulation.
 */
async function typeText(browser, text, delay = 0, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose) {
        console.log(`⌨️  Typing: "${text}"`);
        if (delay > 0)
            console.log(`   Delay: ${delay}ms per character`);
    }
    try {
        if (delay > 0) {
            // Type character by character with delay using CDP
            for (const char of text) {
                await browser.sendCommand('Input.insertText', {
                    text: char
                });
                await (0, helpers_1.sleep)(delay);
            }
            if (opts.verbose)
                console.log(`✅ Typed ${text.length} characters with ${delay}ms delay`);
        }
        else {
            // Type all at once using CDP
            await browser.sendCommand('Input.insertText', {
                text: text
            });
            if (opts.verbose)
                console.log(`✅ Typed ${text.length} characters`);
        }
        (0, helpers_1.checkConsoleErrors)(browser);
        return { success: true, text };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Type text failed`);
            console.error(`   Error: ${error.message}`);
        }
        (0, helpers_1.checkConsoleErrors)(browser);
        throw error;
    }
}
//# sourceMappingURL=input.js.map