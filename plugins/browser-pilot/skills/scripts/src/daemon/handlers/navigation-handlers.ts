/**
 * Navigation command handlers for Browser Pilot Daemon
 */

import * as fs from 'fs';
import * as path from 'path';
import { ChromeBrowser } from '../../cdp/browser';
import { MapManager } from '../map-manager';
import * as actions from '../../cdp/actions';
import { logger } from '../../utils/logger';

/**
 * Handler context containing dependencies
 */
export interface HandlerContext {
  browser: ChromeBrowser;
  mapManager?: MapManager;
  outputDir: string;
}

/**
 * Helper: Get current URL from browser
 */
async function getCurrentUrl(browser: ChromeBrowser): Promise<string> {
  try {
    const result = await browser.sendCommand<{ result: { value: string } }>(
      'Runtime.evaluate',
      { expression: 'window.location.href', returnByValue: true }
    );
    return result.result?.value || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Helper: Save last visited URL to file
 */
export async function saveLastUrl(outputDir: string, url: string): Promise<void> {
  try {
    const lastUrlPath = path.join(outputDir, 'last-url.txt');
    await fs.promises.writeFile(lastUrlPath, url, 'utf-8');
    logger.debug(`💾 Saved last URL: ${url}`);
  } catch (error) {
    logger.warn(`Failed to save last URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper: Load last visited URL from file
 */
export async function loadLastUrl(outputDir: string): Promise<string | null> {
  try {
    const lastUrlPath = path.join(outputDir, 'last-url.txt');
    const url = await fs.promises.readFile(lastUrlPath, 'utf-8');
    const trimmedUrl = url.trim();
    logger.debug(`📂 Loaded last URL: ${trimmedUrl}`);
    return trimmedUrl || null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File not found is an expected case, no need to log a warning
      return null;
    }
    logger.warn(`Failed to load last URL: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Helper: Wait for map to be ready for a specific URL
 */
async function waitForMapReady(
  context: HandlerContext,
  expectedUrl: string,
  _timeout: number
): Promise<void> {
  logger.debug(`⏳ Waiting for map generation (URL: ${expectedUrl})...`);

  if (!context.mapManager) {
    logger.warn('MapManager not available, skipping map generation');
    return;
  }

  // Check if map exists and has correct URL
  const mapStatus = await context.mapManager.getMapStatus(expectedUrl);

  if (!mapStatus.exists || mapStatus.url !== expectedUrl) {
    // Map doesn't exist or has wrong URL - generate new map
    logger.debug(`🔨 Generating new map for: ${expectedUrl}`);
    await context.mapManager.generateMapSerially(context.browser, false);
    // Above await completes only when map generation is fully done
  }

  logger.debug(`✅ Map ready for: ${expectedUrl}`);
}

/**
 * Handle navigate command
 */
export async function handleNavigate(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const url = params.url as string;
  const result = await actions.navigate(context.browser, url);

  // Navigation always changes URL, wait for map
  logger.info(`🔄 Navigating to: ${url}`);
  await waitForMapReady(context, url, 10000);

  // Save last visited URL
  await saveLastUrl(context.outputDir, url);

  return result;
}

/**
 * Handle back command
 */
export async function handleBack(
  context: HandlerContext,
  _params: Record<string, unknown>
): Promise<unknown> {
  const result = await actions.goBack(context.browser);

  // Get new URL after navigation
  const newUrl = await getCurrentUrl(context.browser);
  logger.info(`🔄 Navigated back to: ${newUrl}`);
  await waitForMapReady(context, newUrl, 10000);

  // Save last visited URL
  if (newUrl !== 'unknown') {
    await saveLastUrl(context.outputDir, newUrl);
  }

  return result;
}

/**
 * Handle forward command
 */
export async function handleForward(
  context: HandlerContext,
  _params: Record<string, unknown>
): Promise<unknown> {
  const result = await actions.goForward(context.browser);

  // Get new URL after navigation
  const newUrl = await getCurrentUrl(context.browser);
  logger.info(`🔄 Navigated forward to: ${newUrl}`);
  await waitForMapReady(context, newUrl, 10000);

  // Save last visited URL
  if (newUrl !== 'unknown') {
    await saveLastUrl(context.outputDir, newUrl);
  }

  return result;
}

/**
 * Handle reload command
 */
export async function handleReload(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const hard = params.hard as boolean | undefined;

  // Get current URL before reload
  const currentUrl = await getCurrentUrl(context.browser);
  const result = await actions.reload(context.browser, hard || false);

  // Reload stays on same URL, wait for map
  logger.info(`🔄 Reloading page: ${currentUrl}`);
  await waitForMapReady(context, currentUrl, 10000);

  // Save last visited URL
  if (currentUrl !== 'unknown') {
    await saveLastUrl(context.outputDir, currentUrl);
  }

  return result;
}
