"use strict";
/**
 * Emulation actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.emulateMedia = emulateMedia;
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
//# sourceMappingURL=emulation.js.map