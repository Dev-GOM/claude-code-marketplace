/**
 * Tab management actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';
import { logger } from '../../utils/logger';
import { CDP } from '../../constants';

// Target interface (from CDP)
interface Target {
  id: string;
  type: string;
  url: string;
  title: string;
  webSocketDebuggerUrl?: string;
}

/**
 * Create new tab.
 */
export async function newTab(
  browser: ChromeBrowser,
  url = 'about:blank',
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`📑 Opening new tab: ${url}`);
  const result = await browser.sendCommand('Target.createTarget', { url });
  if (opts.verbose) logger.info(`✅ New tab created`);
  return {
    success: true,
    targetId: result.targetId,
    url
  };
}

/**
 * List all tabs.
 */
export async function listTabs(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`📑 Listing all tabs...`);
  const debugPort = browser.debugPort;
  const response = await fetch(`http://${CDP.LOCALHOST}:${debugPort}/json`);
  const targets = await response.json() as Target[];

  const pageTabs = targets
    .filter((t: Target) => t.type === 'page')
    .map((t: Target, index: number) => ({
      index,
      targetId: t.id,
      url: t.url,
      title: t.title
    }));

  if (opts.verbose) logger.info(`✅ Found ${pageTabs.length} tab(s)`);

  return {
    success: true,
    tabs: pageTabs,
    count: pageTabs.length
  };
}

/**
 * Switch to tab.
 */
export async function switchTab(
  browser: ChromeBrowser,
  targetId?: string,
  index?: number,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) {
    if (targetId) {
      logger.info(`📑 Switching to tab: ${targetId}`);
    } else if (index !== undefined) {
      logger.info(`📑 Switching to tab index: ${index}`);
    }
  }
  const debugPort = browser.debugPort;
  const response = await fetch(`http://${CDP.LOCALHOST}:${debugPort}/json`);
  const targets = await response.json() as Target[];

  const pageTabs = targets.filter((t: Target) => t.type === 'page');
  let target: Target | undefined = undefined;

  if (targetId) {
    target = pageTabs.find((t: Target) => t.id === targetId);
  } else if (index !== undefined) {
    target = pageTabs[index];
  }

  if (!target) {
    if (opts.verbose) logger.info(`❌ Target not found`);
    return { success: false, error: 'Target not found' };
  }

  await browser.sendCommand('Target.activateTarget', { targetId: target.id });

  if (opts.verbose) logger.info(`✅ Switched to tab: ${target.title}`);

  return {
    success: true,
    targetId: target.id,
    url: target.url,
    title: target.title
  };
}

/**
 * Close tab.
 */
export async function closeTab(
  browser: ChromeBrowser,
  targetId?: string,
  index?: number,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) {
    if (targetId) {
      logger.info(`📑 Closing tab: ${targetId}`);
    } else if (index !== undefined) {
      logger.info(`📑 Closing tab index: ${index}`);
    }
  }
  const debugPort = browser.debugPort;
  const response = await fetch(`http://${CDP.LOCALHOST}:${debugPort}/json`);
  const targets = await response.json() as Target[];

  const pageTabs = targets.filter((t: Target) => t.type === 'page');
  let target: Target | undefined = undefined;

  if (targetId) {
    target = pageTabs.find((t: Target) => t.id === targetId);
  } else if (index !== undefined) {
    target = pageTabs[index];
  }

  if (!target) {
    if (opts.verbose) logger.info(`❌ Target not found`);
    return { success: false, error: 'Target not found' };
  }

  await browser.sendCommand('Target.closeTarget', { targetId: target.id });

  if (opts.verbose) logger.info(`✅ Closed tab: ${target.title}`);

  return {
    success: true,
    targetId: target.id,
    message: `Closed tab: ${target.title}`
  };
}
