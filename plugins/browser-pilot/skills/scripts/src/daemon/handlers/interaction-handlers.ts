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
 * Selector query parameters for Smart Mode
 */
interface SelectorQueryParams {
  text: string;
  index?: number;
  type?: string;
  tag?: string;
  viewportOnly?: boolean;
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
 * Helper: Find selector with 3-stage fallback logic
 * Stage 1: Type-based search (with alias expansion)
 * Stage 2: Tag-based search
 * Stage 3: Map regeneration + retry (max 3 attempts)
 */
async function findSelectorWithRetry(
  context: HandlerContext,
  params: SelectorQueryParams
): Promise<string> {
  const { findSelector } = await import('../../cdp/map/query-map');
  const { SELECTOR_RETRY_CONFIG } = await import('../../cdp/actions/helpers');
  const { getOutputDir } = await import('../../cdp/config');
  const path = await import('path');

  const mapPath = path.join(getOutputDir(), SELECTOR_RETRY_CONFIG.MAP_FILENAME);
  logger.debug(`🔍 Smart Mode: querying map for text="${params.text}"`);

  let foundSelector: string | null = null;
  let attemptCount = 0;
  const maxAttempts = 3;
  const originalType = params.type;

  while (!foundSelector && attemptCount < maxAttempts) {
    attemptCount++;

    // Stage 1: Try with type (with alias expansion)
    if (params.type && !params.tag) {
      logger.debug(`[Attempt ${attemptCount}] Type-based search: "${params.type}"`);
      foundSelector = findSelector(mapPath, {
        text: params.text,
        index: params.index,
        type: params.type,
        viewportOnly: params.viewportOnly
      });

      if (foundSelector) {
        logger.debug(`✓ Found selector with type search: ${foundSelector}`);
        break;
      }

      // Stage 2: Fallback to tag-based search
      if (originalType) {
        const baseTag = originalType.split('-')[0];
        logger.debug(`[Attempt ${attemptCount}] Type failed, trying tag: "${baseTag}"`);

        foundSelector = findSelector(mapPath, {
          text: params.text,
          index: params.index,
          tag: baseTag,
          viewportOnly: params.viewportOnly
        });

        if (foundSelector) {
          logger.debug(`✓ Found selector with tag search: ${foundSelector}`);
          break;
        }
      }
    } else {
      // No type specified, just search
      foundSelector = findSelector(mapPath, {
        text: params.text,
        index: params.index,
        type: params.type,
        tag: params.tag,
        viewportOnly: params.viewportOnly
      });

      if (foundSelector) {
        logger.debug(`✓ Found selector: ${foundSelector}`);
        break;
      }
    }

    // Stage 3: Regenerate map and retry
    if (!foundSelector && context.mapManager && attemptCount < maxAttempts) {
      logger.warn(`[Attempt ${attemptCount}] Element not found, regenerating map...`);

      await context.mapManager.generateMap(context.browser, true);
      logger.debug('🔄 Map regenerated, retrying...');
    }
  }

  // Final check
  if (!foundSelector) {
    let errorMsg = `Element not found after ${attemptCount} attempt(s): "${params.text}"\n`;
    errorMsg += '\n💡 Troubleshooting:\n';
    errorMsg += `- Check text is exact: --text "${params.text}"\n`;
    if (params.type) {
      const baseTag = params.type.split('-')[0];
      errorMsg += `- Try tag search: --tag ${baseTag}\n`;
    }
    errorMsg += `- List available elements: node .browser-pilot/bp query --list-texts\n`;
    errorMsg += `- Remove filters: try searching without --type or --viewport-only\n`;

    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  return foundSelector;
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
    selector = await findSelectorWithRetry(context, {
      text: params.text as string,
      index: params.index as number | undefined,
      type: params.type as string | undefined,
      tag: params.tag as string | undefined,
      viewportOnly: params.viewportOnly as boolean | undefined
    });
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
    await context.mapManager.generateMapSerially(context.browser, false);
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
    selector = await findSelectorWithRetry(context, {
      text: params.text as string,
      index: params.index as number | undefined,
      type: params.type as string | undefined,
      tag: params.tag as string | undefined,
      viewportOnly: params.viewportOnly as boolean | undefined
    });
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
    await context.mapManager.generateMapSerially(context.browser, false);
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
