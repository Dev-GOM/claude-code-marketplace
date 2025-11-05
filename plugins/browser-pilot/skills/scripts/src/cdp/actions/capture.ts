/**
 * Capture actions (screenshot, PDF) for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { ActionResult, ActionOptions, mergeOptions, ensureOutputPath } from './helpers';
import { logger } from '../../utils/logger';

// CDP Types for Page domain
interface LayoutMetrics {
  contentSize: {
    width: number;
    height: number;
  };
}

interface ScreenshotParams {
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  };
}

interface ScreenshotResult {
  data: string;
}

interface PDFParams {
  printBackground: boolean;
  landscape: boolean;
  paperWidth: number;
  paperHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

interface PDFResult {
  data: string;
}

// PDF Constants
const PDF_PAPER_LETTER_WIDTH = 8.5;   // inches
const PDF_PAPER_LETTER_HEIGHT = 11.0; // inches
const PDF_DEFAULT_MARGIN = 0.4;       // inches

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

  if (opts.verbose) logger.info(`📸 Taking screenshot: ${outputPath}`);

  // Enable Page domain
  await browser.sendCommand('Page.enable');

  let params: ScreenshotParams = {};
  if (fullPage) {
    // Get page dimensions
    const metrics = await browser.sendCommand<LayoutMetrics>('Page.getLayoutMetrics');
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

  const result = await browser.sendCommand<ScreenshotResult>('Page.captureScreenshot', params);

  // Decode and save
  const imageData = Buffer.from(result.data, 'base64');

  // Ensure output directory exists
  const absolutePath = ensureOutputPath(outputPath);
  const dir = dirname(absolutePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(absolutePath, imageData);

  if (opts.verbose) logger.info(`✅ Screenshot saved: ${absolutePath}`);

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

  if (opts.verbose) logger.info(`📄 Generating PDF: ${outputPath}`);

  await browser.sendCommand('Page.enable');

  const params: PDFParams = {
    printBackground,
    landscape,
    paperWidth: PDF_PAPER_LETTER_WIDTH,
    paperHeight: PDF_PAPER_LETTER_HEIGHT,
    marginTop: PDF_DEFAULT_MARGIN,
    marginBottom: PDF_DEFAULT_MARGIN,
    marginLeft: PDF_DEFAULT_MARGIN,
    marginRight: PDF_DEFAULT_MARGIN
  };

  const result = await browser.sendCommand<PDFResult>('Page.printToPDF', params);
  const pdfData = Buffer.from(result.data, 'base64');

  const absolutePath = ensureOutputPath(outputPath);
  writeFileSync(absolutePath, pdfData);

  if (opts.verbose) logger.info(`✅ PDF saved: ${absolutePath}`);

  return { success: true, path: absolutePath };
}
