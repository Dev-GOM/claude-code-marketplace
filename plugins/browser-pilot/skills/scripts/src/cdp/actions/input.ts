/**
 * Keyboard input actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions, sleep, checkConsoleErrors } from './helpers';

/**
 * Press keyboard key.
 * Uses CDP Input.dispatchKeyEvent for proper React compatibility.
 * Supports special keys like 'Enter', 'Escape', 'Tab', etc.
 */
export async function pressKey(
  browser: ChromeBrowser,
  key: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`⌨️  Pressing key: ${key}`);

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

    if (opts.verbose) console.log(`✅ Key pressed: ${key}`);
    checkConsoleErrors(browser);

    return { success: true, key };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Press key failed: ${key}`);
      console.error(`   Error: ${error.message}`);
    }
    checkConsoleErrors(browser);
    throw error;
  }
}

/**
 * Type text character by character.
 * Uses CDP Input.insertText for proper React compatibility.
 * Supports delay between characters for typing simulation.
 */
export async function typeText(
  browser: ChromeBrowser,
  text: string,
  delay = 0,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) {
    console.log(`⌨️  Typing: "${text}"`);
    if (delay > 0) console.log(`   Delay: ${delay}ms per character`);
  }

  try {
    if (delay > 0) {
      // Type character by character with delay using CDP
      for (const char of text) {
        await browser.sendCommand('Input.insertText', {
          text: char
        });
        await sleep(delay);
      }
      if (opts.verbose) console.log(`✅ Typed ${text.length} characters with ${delay}ms delay`);
    } else {
      // Type all at once using CDP
      await browser.sendCommand('Input.insertText', {
        text: text
      });
      if (opts.verbose) console.log(`✅ Typed ${text.length} characters`);
    }

    checkConsoleErrors(browser);
    return { success: true, text };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Type text failed`);
      console.error(`   Error: ${error.message}`);
    }
    checkConsoleErrors(browser);
    throw error;
  }
}
