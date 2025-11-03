/**
 * Tab management actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';

/**
 * Create new tab.
 */
export async function newTab(
  browser: ChromeBrowser,
  url = 'about:blank',
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`📑 Opening new tab: ${url}`);
  const result = await browser.sendCommand('Target.createTarget', { url });
  if (opts.verbose) console.log(`✅ New tab created`);
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

  if (opts.verbose) console.log(`📑 Listing all tabs...`);
  const debugPort = browser.debugPort;
  const response = await fetch(`http://localhost:${debugPort}/json`);
  const targets = await response.json() as any[];

  const pageTabs = targets
    .filter((t: any) => t.type === 'page')
    .map((t: any, index: number) => ({
      index,
      targetId: t.id,
      url: t.url,
      title: t.title
    }));

  if (opts.verbose) console.log(`✅ Found ${pageTabs.length} tab(s)`);

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
      console.log(`📑 Switching to tab: ${targetId}`);
    } else if (index !== undefined) {
      console.log(`📑 Switching to tab index: ${index}`);
    }
  }
  const debugPort = browser.debugPort;
  const response = await fetch(`http://localhost:${debugPort}/json`);
  const targets = await response.json() as any[];

  const pageTabs = targets.filter((t: any) => t.type === 'page');
  let target: any = null;

  if (targetId) {
    target = pageTabs.find((t: any) => t.id === targetId);
  } else if (index !== undefined) {
    target = pageTabs[index];
  }

  if (!target) {
    if (opts.verbose) console.log(`❌ Target not found`);
    return { success: false, error: 'Target not found' };
  }

  await browser.sendCommand('Target.activateTarget', { targetId: target.id });

  if (opts.verbose) console.log(`✅ Switched to tab: ${target.title}`);

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
      console.log(`📑 Closing tab: ${targetId}`);
    } else if (index !== undefined) {
      console.log(`📑 Closing tab index: ${index}`);
    }
  }
  const debugPort = browser.debugPort;
  const response = await fetch(`http://localhost:${debugPort}/json`);
  const targets = await response.json() as any[];

  const pageTabs = targets.filter((t: any) => t.type === 'page');
  let target: any = null;

  if (targetId) {
    target = pageTabs.find((t: any) => t.id === targetId);
  } else if (index !== undefined) {
    target = pageTabs[index];
  }

  if (!target) {
    if (opts.verbose) console.log(`❌ Target not found`);
    return { success: false, error: 'Target not found' };
  }

  await browser.sendCommand('Target.closeTarget', { targetId: target.id });

  if (opts.verbose) console.log(`✅ Closed tab: ${target.title}`);

  return {
    success: true,
    targetId: target.id,
    message: `Closed tab: ${target.title}`
  };
}
