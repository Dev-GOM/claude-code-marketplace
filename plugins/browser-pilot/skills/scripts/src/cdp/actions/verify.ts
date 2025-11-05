/**
 * Verification utilities for browser actions
 */

import { ChromeBrowser } from '../browser';
import { TIMING as GLOBAL_TIMING } from '../../constants';

// Timing constants for verification operations
const TIMING = {
  DEFAULT_VERIFY_TIMEOUT: GLOBAL_TIMING.ACTION_DELAY_NAVIGATION,
  DOM_CHANGE_CHECK_DELAY: GLOBAL_TIMING.NETWORK_IDLE_TIMEOUT,
  NAVIGATION_CHECK_DELAY: GLOBAL_TIMING.NETWORK_IDLE_TIMEOUT,
  MIN_DOM_CHANGE_THRESHOLD: 10,     // Minimum change in DOM size to consider significant
} as const;

export interface VerifyOptions {
  checkDOMChange?: boolean;    // Check for DOM mutations
  checkNavigation?: boolean;    // Check for page navigation
  timeout?: number;             // Wait timeout in ms (default: 1000)
}

export interface VerificationResult {
  success: boolean;
  reason?: string;
  domChanged?: boolean;
  navigated?: boolean;
}

/**
 * Check if an element exists in the DOM
 */
export async function elementExists(
  browser: ChromeBrowser,
  selector: string
): Promise<boolean> {
  try {
    const result = await browser.sendCommand('Runtime.evaluate', {
      expression: `
        (function() {
          const selector = ${JSON.stringify(selector)};
          let element = null;

          // Try XPath first
          if (selector.startsWith('//')) {
            const xpathResult = document.evaluate(
              selector,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            );
            element = xpathResult.singleNodeValue;
          }
          // Try CSS selector
          else {
            element = document.querySelector(selector);
          }

          return element !== null;
        })()
      `,
      returnByValue: true
    }) as { result?: { value?: boolean } };

    return result?.result?.value === true;
  } catch (_error: unknown) {
    return false;
  }
}

/**
 * Wait for DOM changes (using MutationObserver simulation)
 */
export async function waitForDOMChange(
  browser: ChromeBrowser,
  timeout: number = TIMING.DEFAULT_VERIFY_TIMEOUT
): Promise<boolean> {
  try {
    // Get initial DOM snapshot
    const initialSnapshot = await browser.sendCommand('Runtime.evaluate', {
      expression: 'document.body.innerHTML.length',
      returnByValue: true
    }) as { result?: { value?: number } };
    const initialLength = initialSnapshot?.result?.value || 0;

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, Math.min(timeout, TIMING.DOM_CHANGE_CHECK_DELAY)));

    // Get new DOM snapshot
    const finalSnapshot = await browser.sendCommand('Runtime.evaluate', {
      expression: 'document.body.innerHTML.length',
      returnByValue: true
    }) as { result?: { value?: number } };
    const finalLength = finalSnapshot?.result?.value || 0;

    // Check if DOM changed significantly
    return Math.abs(finalLength - initialLength) > TIMING.MIN_DOM_CHANGE_THRESHOLD;
  } catch (_error: unknown) {
    return false;
  }
}

/**
 * Check for page navigation
 */
export async function checkNavigation(
  browser: ChromeBrowser,
  initialURL: string,
  timeout: number = TIMING.DEFAULT_VERIFY_TIMEOUT
): Promise<boolean> {
  try {
    // Wait a bit for navigation to complete
    await new Promise(resolve => setTimeout(resolve, Math.min(timeout, TIMING.NAVIGATION_CHECK_DELAY)));

    // Get current URL
    const urlResult = await browser.sendCommand('Target.getTargetInfo', {
      targetId: (browser as unknown as { targetId: string }).targetId
    }) as { targetInfo: { url: string } };
    const currentURL = urlResult.targetInfo.url;

    return currentURL !== initialURL;
  } catch (_error: unknown) {
    return false;
  }
}

/**
 * Verify that an action was successful
 */
export async function verifyAction(
  browser: ChromeBrowser,
  options: VerifyOptions = {}
): Promise<VerificationResult> {
  const {
    checkDOMChange = true,
    checkNavigation: shouldCheckNavigation = true,
    timeout = TIMING.DEFAULT_VERIFY_TIMEOUT
  } = options;

  const result: VerificationResult = {
    success: false
  };

  try {
    // Get initial URL
    let initialURL = '';
    if (shouldCheckNavigation) {
      const urlResult = await browser.sendCommand('Target.getTargetInfo', {
        targetId: (browser as unknown as { targetId: string }).targetId
      }) as { targetInfo: { url: string } };
      initialURL = urlResult.targetInfo.url;
    }

    // Check for DOM changes
    if (checkDOMChange) {
      result.domChanged = await waitForDOMChange(browser, timeout);
    }

    // Check for navigation
    if (shouldCheckNavigation) {
      result.navigated = await checkNavigation(browser, initialURL, timeout);
    }

    // Success if either DOM changed or navigation occurred
    result.success = !!(result.domChanged || result.navigated);

    if (!result.success) {
      result.reason = 'No DOM changes or navigation detected';
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      reason: `Verification failed: ${errorMessage}`
    };
  }
}

/**
 * Verify element interactivity before action
 */
export async function verifyElementInteractive(
  browser: ChromeBrowser,
  selector: string
): Promise<{ interactive: boolean; reason?: string }> {
  try {
    const result = await browser.sendCommand('Runtime.evaluate', {
      expression: `
        (function() {
          const selector = ${JSON.stringify(selector)};
          let element = null;

          // Try XPath first
          if (selector.startsWith('//')) {
            const xpathResult = document.evaluate(
              selector,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            );
            element = xpathResult.singleNodeValue;
          }
          // Try CSS selector
          else {
            element = document.querySelector(selector);
          }

          if (!element) {
            return { interactive: false, reason: 'Element not found' };
          }

          // Check visibility
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return { interactive: false, reason: 'Element not visible' };
          }

          // Check if disabled
          if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
            return { interactive: false, reason: 'Element is disabled' };
          }

          // Check if element is in viewport
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            return { interactive: false, reason: 'Element has no size' };
          }

          return { interactive: true };
        })()
      `,
      returnByValue: true
    }) as { result?: { value?: { interactive: boolean; reason?: string } } };

    const value = result?.result?.value;
    if (value && typeof value === 'object') {
      return value;
    }

    return { interactive: false, reason: 'Verification failed' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { interactive: false, reason: errorMessage };
  }
}
