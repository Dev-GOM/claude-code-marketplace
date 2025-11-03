"use strict";
/**
 * Emulation actions for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.emulateMedia = emulateMedia;
const helpers_1 = require("./helpers");
/**
 * Emulate media type or color scheme.
 */
async function emulateMedia(browser, mediaType, colorScheme, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
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
        if (opts.verbose)
            console.log(`✅ Media emulation set`);
        return {
            success: true,
            mediaType: mediaType || null,
            colorScheme: colorScheme || null
        };
    }
    catch (error) {
        if (opts.verbose) {
            console.error(`❌ Emulate media failed`);
            console.error(`   Error: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=emulation.js.map