/**
 * Network interception and mocking actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';

/**
 * Set up network request interception.
 */
export async function enableRequestInterception(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🌐 Enabling network request interception...`);

  try {
    await browser.sendCommand('Fetch.enable', {
      patterns: [{ urlPattern: '*' }]
    });

    if (opts.verbose) console.log(`✅ Request interception enabled`);

    return {
      success: true,
      note: 'Request interception enabled. Use interceptRequest() to handle requests.'
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Enable request interception failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Disable network request interception.
 */
export async function disableRequestInterception(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🌐 Disabling network request interception...`);

  try {
    await browser.sendCommand('Fetch.disable');

    if (opts.verbose) console.log(`✅ Request interception disabled`);

    return {
      success: true
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Disable request interception failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Mock a network request response.
 */
export async function mockRequest(
  browser: ChromeBrowser,
  urlPattern: string,
  responseBody: string,
  statusCode: number = 200,
  headers?: Record<string, string>,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🌐 Mocking request: ${urlPattern} -> ${statusCode}`);

  try {
    // This is a simplified version - full implementation requires event handling
    await browser.sendCommand('Fetch.enable', {
      patterns: [{ urlPattern }]
    });

    if (opts.verbose) console.log(`✅ Mock configured for: ${urlPattern}`);

    return {
      success: true,
      urlPattern,
      statusCode,
      note: 'Mock configured. Use Fetch.continueRequest or Fetch.fulfillRequest in event handler.'
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Mock request failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Block network requests matching pattern.
 */
export async function blockRequest(
  browser: ChromeBrowser,
  urlPattern: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🚫 Blocking requests matching: ${urlPattern}`);

  try {
    await browser.sendCommand('Network.enable');
    await browser.sendCommand('Network.setBlockedURLs', {
      urls: [urlPattern]
    });

    if (opts.verbose) console.log(`✅ Requests blocked: ${urlPattern}`);

    return {
      success: true,
      urlPattern,
      blocked: true
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Block request failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Unblock all network requests.
 */
export async function unblockRequests(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🌐 Unblocking all requests...`);

  try {
    await browser.sendCommand('Network.setBlockedURLs', {
      urls: []
    });

    if (opts.verbose) console.log(`✅ All requests unblocked`);

    return {
      success: true,
      blocked: false
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Unblock requests failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}
