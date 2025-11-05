/**
 * Emulation actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';
import { logger } from '../../utils/logger';

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
    logger.info(`🎨 Emulating media - type: ${mediaType || 'none'}, colorScheme: ${colorScheme || 'none'}`);
  }

  try {
    await browser.sendCommand('Emulation.setEmulatedMedia', {
      media: mediaType || '',
      features: colorScheme ? [{
        name: 'prefers-color-scheme',
        value: colorScheme
      }] : []
    });

    if (opts.verbose) logger.info(`✅ Media emulation set`);

    return {
      success: true,
      mediaType: mediaType || null,
      colorScheme: colorScheme || null
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Emulate media failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    throw error;
  }
}
