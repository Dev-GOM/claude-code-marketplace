/**
 * Network interception and mocking actions for Browser Pilot.
 */

import { ChromeBrowser } from '../browser';
import { ActionResult, ActionOptions, mergeOptions } from './helpers';
import { logger } from '../../utils/logger';

/**
 * Set up network request interception.
 */
export async function enableRequestInterception(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) logger.info(`🌐 Enabling network request interception...`);

  try {
    await browser.sendCommand('Fetch.enable', {
      patterns: [{ urlPattern: '*' }]
    });

    if (opts.verbose) logger.info(`✅ Request interception enabled`);

    return {
      success: true,
      note: 'Request interception enabled. Use interceptRequest() to handle requests.'
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Enable request interception failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
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

  if (opts.verbose) logger.info(`🌐 Disabling network request interception...`);

  try {
    await browser.sendCommand('Fetch.disable');

    if (opts.verbose) logger.info(`✅ Request interception disabled`);

    return {
      success: true
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Disable request interception failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
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

  if (opts.verbose) logger.info(`🌐 Mocking request: ${urlPattern} -> ${statusCode}`);

  try {
    // This is a simplified version - full implementation requires event handling
    await browser.sendCommand('Fetch.enable', {
      patterns: [{ urlPattern }]
    });

    if (opts.verbose) logger.info(`✅ Mock configured for: ${urlPattern}`);

    return {
      success: true,
      urlPattern,
      statusCode,
      note: 'Mock configured. Use Fetch.continueRequest or Fetch.fulfillRequest in event handler.'
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Mock request failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
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

  if (opts.verbose) logger.info(`🚫 Blocking requests matching: ${urlPattern}`);

  try {
    await browser.sendCommand('Network.enable');
    await browser.sendCommand('Network.setBlockedURLs', {
      urls: [urlPattern]
    });

    if (opts.verbose) logger.info(`✅ Requests blocked: ${urlPattern}`);

    return {
      success: true,
      urlPattern,
      blocked: true
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Block request failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
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

  if (opts.verbose) logger.info(`🌐 Unblocking all requests...`);

  try {
    await browser.sendCommand('Network.setBlockedURLs', {
      urls: []
    });

    if (opts.verbose) logger.info(`✅ All requests unblocked`);

    return {
      success: true,
      blocked: false
    };

  } catch (error: unknown) {
    if (opts.verbose) {
      logger.error(`❌ Unblock requests failed`);
      if (error instanceof Error) {
        logger.error(`   Error: ${error.message}`);
      } else {
        logger.error(`   Error: ${String(error)}`);
      }
    }
    throw error;
  }
}
