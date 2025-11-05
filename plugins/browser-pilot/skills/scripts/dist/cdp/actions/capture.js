"use strict";
/**
 * Capture actions (screenshot, PDF) for Browser Pilot.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenshot = screenshot;
exports.generatePdf = generatePdf;
const fs_1 = require("fs");
const path_1 = require("path");
const fs_2 = require("fs");
const helpers_1 = require("./helpers");
const logger_1 = require("../../utils/logger");
// PDF Constants
const PDF_PAPER_LETTER_WIDTH = 8.5; // inches
const PDF_PAPER_LETTER_HEIGHT = 11.0; // inches
const PDF_DEFAULT_MARGIN = 0.4; // inches
/**
 * Take screenshot.
 */
async function screenshot(browser, outputPath, fullPage = true, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`📸 Taking screenshot: ${outputPath}`);
    // Enable Page domain
    await browser.sendCommand('Page.enable');
    let params = {};
    if (fullPage) {
        // Get page dimensions
        const metrics = await browser.sendCommand('Page.getLayoutMetrics');
        const contentSize = metrics.contentSize;
        params = {
            clip: {
                x: 0,
                y: 0,
                width: contentSize.width,
                height: contentSize.height,
                scale: 1
            }
        };
    }
    const result = await browser.sendCommand('Page.captureScreenshot', params);
    // Decode and save
    const imageData = Buffer.from(result.data, 'base64');
    // Ensure output directory exists
    const absolutePath = (0, helpers_1.ensureOutputPath)(outputPath);
    const dir = (0, path_1.dirname)(absolutePath);
    if (!(0, fs_2.existsSync)(dir)) {
        (0, fs_2.mkdirSync)(dir, { recursive: true });
    }
    (0, fs_1.writeFileSync)(absolutePath, imageData);
    if (opts.verbose)
        logger_1.logger.info(`✅ Screenshot saved: ${absolutePath}`);
    return { success: true, path: absolutePath };
}
/**
 * Generate PDF from current page.
 */
async function generatePdf(browser, outputPath, landscape = false, printBackground = true, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        logger_1.logger.info(`📄 Generating PDF: ${outputPath}`);
    await browser.sendCommand('Page.enable');
    const params = {
        printBackground,
        landscape,
        paperWidth: PDF_PAPER_LETTER_WIDTH,
        paperHeight: PDF_PAPER_LETTER_HEIGHT,
        marginTop: PDF_DEFAULT_MARGIN,
        marginBottom: PDF_DEFAULT_MARGIN,
        marginLeft: PDF_DEFAULT_MARGIN,
        marginRight: PDF_DEFAULT_MARGIN
    };
    const result = await browser.sendCommand('Page.printToPDF', params);
    const pdfData = Buffer.from(result.data, 'base64');
    const absolutePath = (0, helpers_1.ensureOutputPath)(outputPath);
    (0, fs_1.writeFileSync)(absolutePath, pdfData);
    if (opts.verbose)
        logger_1.logger.info(`✅ PDF saved: ${absolutePath}`);
    return { success: true, path: absolutePath };
}
//# sourceMappingURL=capture.js.map