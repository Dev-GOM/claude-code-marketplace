/**
 * Keyboard input actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions, sleep, checkErrors } from './helpers';
import { logger } from '../../utils/logger';

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

  if (opts.verbose) logger.info(`⌨️  Pressing key: ${key}`);

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

    if (opts.verbose) logger.info(`✅ Key pressed: ${key}`);
    checkErrors(browser, opts.logLevel);

    return { success: true, key };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Press key failed: ${key}`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    checkErrors(browser, opts.logLevel);
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
    logger.info(`⌨️  Typing: "${text}"`);
    if (delay > 0) logger.info(`   Delay: ${delay}ms per character`);
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
      if (opts.verbose) logger.info(`✅ Typed ${text.length} characters with ${delay}ms delay`);
    } else {
      // Type all at once using CDP
      await browser.sendCommand('Input.insertText', {
        text: text
      });
      if (opts.verbose) logger.info(`✅ Typed ${text.length} characters`);
    }

    checkErrors(browser, opts.logLevel);
    return { success: true, text };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Type text failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    checkErrors(browser, opts.logLevel);
    throw error;
  }
}
