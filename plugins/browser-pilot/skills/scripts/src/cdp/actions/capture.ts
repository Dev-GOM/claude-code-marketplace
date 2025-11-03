/**
 * Capture actions (screenshot, PDF) for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { ActionResult, ActionOptions, mergeOptions, ensureOutputPath } from './helpers';

/**
 * Take screenshot.
 */
export async function screenshot(
  browser: ChromeBrowser,
  outputPath: string,
  fullPage = true,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`📸 Taking screenshot: ${outputPath}`);

  // Enable Page domain
  await browser.sendCommand('Page.enable');

  let params: any = {};
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
  const absolutePath = ensureOutputPath(outputPath);
  const dir = dirname(absolutePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(absolutePath, imageData);

  if (opts.verbose) console.log(`✅ Screenshot saved: ${absolutePath}`);

  return { success: true, path: absolutePath };
}

/**
 * Generate PDF from current page.
 */
export async function generatePdf(
  browser: ChromeBrowser,
  outputPath: string,
  landscape = false,
  printBackground = true,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`📄 Generating PDF: ${outputPath}`);

  await browser.sendCommand('Page.enable');

  const params = {
    printBackground,
    landscape,
    paperWidth: 8.5,  // inches
    paperHeight: 11.0,
    marginTop: 0.4,
    marginBottom: 0.4,
    marginLeft: 0.4,
    marginRight: 0.4
  };

  const result = await browser.sendCommand('Page.printToPDF', params);
  const pdfData = Buffer.from(result.data, 'base64');

  const absolutePath = ensureOutputPath(outputPath);
  writeFileSync(absolutePath, pdfData);

  if (opts.verbose) console.log(`✅ PDF saved: ${absolutePath}`);

  return { success: true, path: absolutePath };
}
