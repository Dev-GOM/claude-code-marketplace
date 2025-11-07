/**
 * Capture actions (screenshot, PDF) for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { ActionResult, ActionOptions, mergeOptions, ensureOutputPath } from './helpers';
import { logger } from '../../utils/logger';
import { FS } from '../../constants';

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

export interface ClipOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number;
}

/**
 * Take screenshot.
 * @param browser - ChromeBrowser instance
 * @param filename - Screenshot filename (automatically saved to .browser-pilot/screenshots/)
 * @param fullPage - Capture full page or viewport only
 * @param clip - Optional clip region (x, y, width, height, scale)
 * @param options - Action options
 */
export async function screenshot(
  browser: ChromeBrowser,
  filename: string,
  fullPage = true,
  clip?: ClipOptions,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  // Construct path within screenshots folder
  const screenshotPath = join(FS.SCREENSHOTS_DIR, filename);

  if (opts.verbose) logger.info(`📸 Taking screenshot: ${screenshotPath}`);

  // Enable Page domain
  await browser.sendCommand('Page.enable');

  let params: ScreenshotParams = {};

  // Clip region has priority over fullPage
  if (clip) {
    params = {
      clip: {
        x: clip.x,
        y: clip.y,
        width: clip.width,
        height: clip.height,
        scale: clip.scale || 1
      }
    };
    if (opts.verbose) {
      logger.info(`  Region: (${clip.x}, ${clip.y}) ${clip.width}x${clip.height} scale=${clip.scale || 1}`);
    }
  } else if (fullPage) {
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

  // Ensure output directory exists (creates .browser-pilot/screenshots/ if needed)
  const absolutePath = ensureOutputPath(screenshotPath);

  writeFileSync(absolutePath, imageData);

  if (opts.verbose) logger.info(`✅ Screenshot saved: ${absolutePath}`);

  return { success: true, path: absolutePath };
}

/**
 * Generate PDF from current page.
 * @param browser - ChromeBrowser instance
 * @param filename - PDF filename (automatically saved to .browser-pilot/pdfs/)
 * @param landscape - Use landscape orientation
 * @param printBackground - Print background graphics
 * @param options - Action options
 */
export async function generatePdf(
  browser: ChromeBrowser,
  filename: string,
  landscape = false,
  printBackground = true,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  // Construct path within pdfs folder
  const pdfPath = join(FS.PDFS_DIR, filename);

  if (opts.verbose) logger.info(`📄 Generating PDF: ${pdfPath}`);

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

  // Ensure output directory exists (creates .browser-pilot/pdfs/ if needed)
  const absolutePath = ensureOutputPath(pdfPath);
  writeFileSync(absolutePath, pdfData);

  if (opts.verbose) logger.info(`✅ PDF saved: ${absolutePath}`);

  return { success: true, path: absolutePath };
}
