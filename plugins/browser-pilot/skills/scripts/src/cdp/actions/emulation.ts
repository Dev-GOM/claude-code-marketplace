/**
 * Emulation actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';
import { logger } from '../../utils/logger';

export interface ViewportOptions {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  mobile?: boolean;
}

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

/**
 * Set viewport size.
 * @param browser - ChromeBrowser instance
 * @param width - Viewport width in pixels
 * @param height - Viewport height in pixels
 * @param deviceScaleFactor - Device scale factor (default: 1)
 * @param mobile - Whether to emulate mobile device (default: false)
 * @param options - Action options
 */
export async function setViewportSize(
  browser: ChromeBrowser,
  width: number,
  height: number,
  deviceScaleFactor = 1,
  mobile = false,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) {
    logger.info(`📐 Setting viewport size: ${width}x${height} (scale: ${deviceScaleFactor}, mobile: ${mobile})`);
  }

  try {
    await browser.sendCommand('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile
    });

    if (opts.verbose) logger.info(`✅ Viewport size set to ${width}x${height}`);

    return {
      success: true,
      width,
      height,
      deviceScaleFactor,
      mobile
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Set viewport size failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    throw error;
  }
}
