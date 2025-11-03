/**
 * Cookie management actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';

/**
 * Get all cookies.
 */
export async function getCookies(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log('🍪 Getting cookies...');
  const result = await browser.sendCommand('Network.getCookies');
  const cookies = result.cookies || [];
  if (opts.verbose) console.log(`✅ Retrieved ${cookies.length} cookie(s)`);
  return { success: true, cookies, count: cookies.length };
}

/**
 * Set a cookie.
 */
export async function setCookie(
  browser: ChromeBrowser,
  name: string,
  value: string,
  domain?: string,
  path = '/',
  secure = false,
  httpOnly = false,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🍪 Setting cookie: ${name}`);

  const cookieParams: any = {
    name,
    value,
    path,
    secure,
    httpOnly
  };

  if (domain) {
    cookieParams.domain = domain;
  }

  await browser.sendCommand('Network.setCookie', cookieParams);
  if (opts.verbose) console.log(`✅ Cookie set successfully`);
  return { success: true, name };
}

/**
 * Delete cookies.
 */
export async function deleteCookies(
  browser: ChromeBrowser,
  name?: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (name) {
    if (opts.verbose) console.log(`🍪 Deleting cookie: ${name}`);
    // Get all cookies to find the domain
    const result = await browser.sendCommand('Network.getCookies');
    const cookies = result.cookies || [];

    // Find matching cookies
    const matchingCookies = cookies.filter((c: any) => c.name === name);

    if (matchingCookies.length > 0) {
      for (const cookie of matchingCookies) {
        await browser.sendCommand('Network.deleteCookies', {
          name,
          domain: cookie.domain || ''
        });
      }
      if (opts.verbose) console.log(`✅ Deleted ${matchingCookies.length} cookie(s) with name '${name}'`);
    } else {
      if (opts.verbose) console.log(`⚠️  Warning: Cookie '${name}' not found`);
    }
  } else {
    if (opts.verbose) console.log('🍪 Deleting all cookies...');
    await browser.sendCommand('Network.clearBrowserCookies');
    if (opts.verbose) console.log(`✅ All cookies deleted`);
  }

  return { success: true };
}
