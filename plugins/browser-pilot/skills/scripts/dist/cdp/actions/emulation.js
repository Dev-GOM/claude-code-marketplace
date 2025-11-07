"use strict";
/**
 * Emulation actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.emulateMedia = emulateMedia;
exports.setViewportSize = setViewportSize;
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
/**
 * Emulate media type or color scheme.
 */
async function emulateMedia(browser, mediaType, colorScheme, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose) {
        logger_1.logger.info(`🎨 Emulating media - type: ${mediaType || 'none'}, colorScheme: ${colorScheme || 'none'}`);
    }
    try {
        await browser.sendCommand('Emulation.setEmulatedMedia', {
            media: mediaType || '',
            features: colorScheme ? [{
                    name: 'prefers-color-scheme',
                    value: colorScheme
                }] : []
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ Media emulation set`);
        return {
            success: true,
            mediaType: mediaType || null,
            colorScheme: colorScheme || null
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Emulate media failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
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
async function setViewportSize(browser, width, height, deviceScaleFactor = 1, mobile = false, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose) {
        logger_1.logger.info(`📐 Setting viewport size: ${width}x${height} (scale: ${deviceScaleFactor}, mobile: ${mobile})`);
    }
    try {
        await browser.sendCommand('Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor,
            mobile
        });
        if (opts.verbose)
            logger_1.logger.info(`✅ Viewport size set to ${width}x${height}`);
        return {
            success: true,
            width,
            height,
            deviceScaleFactor,
            mobile
        };
    }
    catch (error) {
        if (opts.verbose) {
            logger_1.logger.error(`❌ Set viewport size failed`);
            if (error instanceof Error) {
                logger_1.logger.error(`   Error: ${error.message}`);
            }
            else {
                logger_1.logger.error(`   Error: ${String(error)}`);
            }
        }
        throw error;
    }
}
//# sourceMappingURL=emulation.js.map