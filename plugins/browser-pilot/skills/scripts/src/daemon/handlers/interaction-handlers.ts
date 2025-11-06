/**
 * Interaction command handlers for Browser Pilot Daemon
 */

import { ChromeBrowser } from '../../cdp/browser';
import { HandlerContext } from './navigation-handlers';
import * as actions from '../../cdp/actions';
import { logger } from '../../utils/logger';

/**
 * Page change tracker for monitoring action effects
 */
interface PageChangeTracker {
  urlBefore: string;
  urlAfter: string | null;
  navigationDetected: boolean;
  domChangeDetected: boolean;
  networkActive: boolean;
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
 * Helper: Execute action with automatic state tracking
 */
async function executeActionWithTracking<T>(
  browser: ChromeBrowser,
  actionFn: () => Promise<T>
): Promise<{ result: T; tracker: PageChangeTracker }> {
  // Capture state before action
  const urlBefore = await getCurrentUrl(browser);

  const pageChangeTracker: PageChangeTracker = {
    urlBefore,
    urlAfter: null,
    navigationDetected: false,
    domChangeDetected: false,
    networkActive: false
  };

  try {
    // Execute action
    const result = await actionFn();

    // Capture state after action
    const urlAfter = await getCurrentUrl(browser);
    pageChangeTracker.urlAfter = urlAfter;
    pageChangeTracker.navigationDetected = urlBefore !== urlAfter;

    return { result, tracker: pageChangeTracker };
  } finally {
    // Cleanup if needed
  }
}

/**
 * Handle click command with smart mode support
 */
export async function handleClick(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  let selector = params.selector as string | undefined;

  // Smart Mode: if text provided, query map
  if (params.text && !selector) {
    const { findSelector } = await import('../../cdp/map/query-map');
    const { SELECTOR_RETRY_CONFIG } = await import('../../cdp/actions/helpers');
    const { getOutputDir } = await import('../../cdp/config');
    const path = await import('path');

    const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    logger.debug(`🔍 Smart Mode: querying map at ${mapPath} for text="${params.text}"`);

    let foundSelector = findSelector(mapPath, {
      text: params.text as string,
      index: params.index as number | undefined,
      type: params.type as string | undefined,
      viewportOnly: params.viewportOnly as boolean | undefined
    });

    // Fallback: regenerate map if element not found
    if (!foundSelector) {
      logger.warn(`⚠️  Element not found in map, regenerating map and retrying...`);

      if (context.mapManager) {
        await context.mapManager.generateMap(context.browser, true);
        logger.debug(`🔄 Map regenerated, retrying selector search...`);

        foundSelector = findSelector(mapPath, {
          text: params.text as string,
          index: params.index as number | undefined,
          type: params.type as string | undefined,
          viewportOnly: params.viewportOnly as boolean | undefined
        });
      }

      if (!foundSelector) {
        logger.error(`❌ Element still not found after map regeneration: "${params.text}"`);
        throw new Error(`Element not found in map: "${params.text}"`);
      }

      logger.debug(`✓ Found selector after map regeneration: ${foundSelector}`);
    } else {
      logger.debug(`✓ Found selector: ${foundSelector}`);
    }

    selector = foundSelector;
  }

  if (!selector) {
    throw new Error('No selector provided');
  }

  // Execute with tracking
  const { result, tracker } = await executeActionWithTracking(
    context.browser,
    () => actions.click(context.browser, selector)
  );

  // Always regenerate map after click (DOM may have changed, URL may or may not change)
  logger.debug(`🔄 Regenerating map after click (URL: ${tracker.urlBefore} → ${tracker.urlAfter})`);
  if (context.mapManager) {
    await context.mapManager.generateMapDebounced(context.browser, false);
  }

  return result;
}

/**
 * Handle fill command with smart mode support
 */
export async function handleFill(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  let selector = params.selector as string | undefined;
  const value = params.value as string;

  // Smart Mode: if text provided, query map
  if (params.text && !selector) {
    const { findSelector } = await import('../../cdp/map/query-map');
    const { SELECTOR_RETRY_CONFIG } = await import('../../cdp/actions/helpers');
    const { getOutputDir } = await import('../../cdp/config');
    const path = await import('path');

    const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
    logger.debug(`🔍 Smart Mode: querying map at ${mapPath} for text="${params.text}"`);

    let foundSelector = findSelector(mapPath, {
      text: params.text as string,
      index: params.index as number | undefined,
      type: params.type as string | undefined,
      viewportOnly: params.viewportOnly as boolean | undefined
    });

    // Fallback: regenerate map if element not found
    if (!foundSelector) {
      logger.warn(`⚠️  Element not found in map, regenerating map and retrying...`);

      if (context.mapManager) {
        await context.mapManager.generateMap(context.browser, true);
        logger.debug(`🔄 Map regenerated, retrying selector search...`);

        foundSelector = findSelector(mapPath, {
          text: params.text as string,
          index: params.index as number | undefined,
          type: params.type as string | undefined,
          viewportOnly: params.viewportOnly as boolean | undefined
        });
      }

      if (!foundSelector) {
        logger.error(`❌ Element still not found after map regeneration: "${params.text}"`);
        throw new Error(`Element not found in map: "${params.text}"`);
      }

      logger.debug(`✓ Found selector after map regeneration: ${foundSelector}`);
    } else {
      logger.debug(`✓ Found selector: ${foundSelector}`);
    }

    selector = foundSelector;
  }

  if (!selector) {
    throw new Error('No selector provided');
  }

  // Execute with tracking
  const { result, tracker } = await executeActionWithTracking(
    context.browser,
    () => actions.fill(context.browser, selector, value)
  );

  // Always regenerate map after fill (DOM may have changed, URL may or may not change)
  logger.debug(`🔄 Regenerating map after fill (URL: ${tracker.urlBefore} → ${tracker.urlAfter})`);
  if (context.mapManager) {
    await context.mapManager.generateMapDebounced(context.browser, false);
  }

  return result;
}

/**
 * Handle hover command
 */
export async function handleHover(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const selector = params.selector as string;
  return actions.hover(context.browser, selector);
}

/**
 * Handle press (keyboard key) command
 */
export async function handlePress(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const key = params.key as string;
  return actions.pressKey(context.browser, key);
}

/**
 * Handle type (text input) command
 */
export async function handleType(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const text = params.text as string;
  const delay = params.delay as number | undefined;
  return actions.typeText(context.browser, text, delay);
}
