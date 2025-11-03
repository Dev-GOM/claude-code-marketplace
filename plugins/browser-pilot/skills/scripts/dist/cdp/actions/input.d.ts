/**
 * Keyboard input actions for Browser Pilot.
 */
import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions } from './helpers';
/**
 * Press keyboard key.
 * Uses CDP Input.dispatchKeyEvent for proper React compatibility.
 * Supports special keys like 'Enter', 'Escape', 'Tab', etc.
 */
export declare function pressKey(browser: ChromeBrowser, key: string, options?: ActionOptions): Promise<ActionResult>;
/**
 * Type text character by character.
 * Uses CDP Input.insertText for proper React compatibility.
 * Supports delay between characters for typing simulation.
 */
export declare function typeText(browser: ChromeBrowser, text: string, delay?: number, options?: ActionOptions): Promise<ActionResult>;
//# sourceMappingURL=input.d.ts.map