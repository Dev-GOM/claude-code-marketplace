/**
 * Cookie management actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';
import { logger } from '../../utils/logger';

// CDP Types for Network.Cookie
interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  size?: number;
  httpOnly?: boolean;
  secure?: boolean;
  session?: boolean;
  sameSite?: string;
}

interface GetCookiesResult {
  cookies: Cookie[];
}

interface SetCookieParams {
  name: string;
  value: string;
  domain?: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  expires?: number;
  sameSite?: string;
}

/**
 * Get all cookies.
 */
export async function getCookies(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info('🍪 Getting cookies...');
  const result = await browser.sendCommand<GetCookiesResult>('Network.getCookies');
  const cookies = result.cookies || [];
  if (opts.verbose) logger.info(`✅ Retrieved ${cookies.length} cookie(s)`);
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

  if (opts.verbose) logger.info(`🍪 Setting cookie: ${name}`);

  const cookieParams: SetCookieParams = {
    name,
    value,
    path,
    secure,
    httpOnly,
    ...(domain && { domain })
  };

  await browser.sendCommand('Network.setCookie', cookieParams);
  if (opts.verbose) logger.info(`✅ Cookie set successfully`);
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
    if (opts.verbose) logger.info(`🍪 Deleting cookie: ${name}`);
    // Get all cookies to find the domain
    const result = await browser.sendCommand<GetCookiesResult>('Network.getCookies');
    const cookies = result.cookies || [];

    // Find matching cookies
    const matchingCookies = cookies.filter((c: Cookie) => c.name === name);

    if (matchingCookies.length > 0) {
      for (const cookie of matchingCookies) {
        await browser.sendCommand('Network.deleteCookies', {
          name,
          domain: cookie.domain || ''
        });
      }
      if (opts.verbose) logger.info(`✅ Deleted ${matchingCookies.length} cookie(s) with name '${name}'`);
    } else {
      if (opts.verbose) logger.warn(`⚠️  Warning: Cookie '${name}' not found`);
    }
  } else {
    if (opts.verbose) logger.info('🍪 Deleting all cookies...');
    await browser.sendCommand('Network.clearBrowserCookies');
    if (opts.verbose) logger.info(`✅ All cookies deleted`);
  }

  return { success: true };
}
