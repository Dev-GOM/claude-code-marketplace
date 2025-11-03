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
/**
 * Take screenshot.
 */
async function screenshot(browser, outputPath, fullPage = true, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`📸 Taking screenshot: ${outputPath}`);
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
        console.log(`✅ Screenshot saved: ${absolutePath}`);
    return { success: true, path: absolutePath };
}
/**
 * Generate PDF from current page.
 */
async function generatePdf(browser, outputPath, landscape = false, printBackground = true, options) {
    const opts = (0, helpers_1.mergeOptions)(options);
    if (opts.verbose)
        console.log(`📄 Generating PDF: ${outputPath}`);
    await browser.sendCommand('Page.enable');
    const params = {
        printBackground,
        landscape,
        paperWidth: 8.5, // inches
        paperHeight: 11.0,
        marginTop: 0.4,
        marginBottom: 0.4,
        marginLeft: 0.4,
        marginRight: 0.4
    };
    const result = await browser.sendCommand('Page.printToPDF', params);
    const pdfData = Buffer.from(result.data, 'base64');
    const absolutePath = (0, helpers_1.ensureOutputPath)(outputPath);
    (0, fs_1.writeFileSync)(absolutePath, pdfData);
    if (opts.verbose)
        console.log(`✅ PDF saved: ${absolutePath}`);
    return { success: true, path: absolutePath };
}
//# sourceMappingURL=capture.js.map