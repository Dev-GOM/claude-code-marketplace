/**
 * Emulation actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';

/**
 * Emulate media type or color scheme.
 */
export async function emulateMedia(
  browser: ChromeBrowser,
  mediaType?: 'screen' | 'print',
  colorScheme?: 'light' | 'dark' | 'no-preference',
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) {
    console.log(`🎨 Emulating media - type: ${mediaType || 'none'}, colorScheme: ${colorScheme || 'none'}`);
  }

  try {
    await browser.sendCommand('Emulation.setEmulatedMedia', {
      media: mediaType || '',
      features: colorScheme ? [{
        name: 'prefers-color-scheme',
        value: colorScheme
      }] : []
    });

    if (opts.verbose) console.log(`✅ Media emulation set`);

    return {
      success: true,
      mediaType: mediaType || null,
      colorScheme: colorScheme || null
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Emulate media failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}
