/**
 * Core CDP actions for browser automation.
 */

import { ChromeBrowser } from './browser';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { findProjectRoot, getFindElementScript } from './utils';

// Re-export all extra functions
export * from './actions-extra';

export interface ActionResult {
  success: boolean;
  [key: string]: any;
}

/**
 * Navigate to URL.
 */
export async function navigate(browser: ChromeBrowser, url: string): Promise<ActionResult> {
  console.log(`Navigating to: ${url}`);
  await browser.sendCommand('Page.navigate', { url });
  await sleep(1000); // Wait for page load
  return { success: true, url };
}

/**
 * Wait for page load complete.
 */
export async function waitForLoad(browser: ChromeBrowser, timeout = 30000): Promise<ActionResult> {
  const script = `
    new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkReady = () => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else if (Date.now() - startTime > ${timeout}) {
          reject(new Error('Timeout waiting for page load'));
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    })
  `;

  await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    awaitPromise: true,
    returnByValue: true
  });

  return { success: true, state: 'complete' };
}

/**
 * Click element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//button[text()='Click'])[2] selects the 2nd button.
 */
export async function click(browser: ChromeBrowser, selector: string): Promise<ActionResult> {
  console.log(`Clicking: ${selector}`);

  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.click();
      return true;
    })()
  `;

  await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  return { success: true, selector };
}

/**
 * Fill input field.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 * XPath supports indexing: (//input[@type='text'])[2] selects the 2nd input.
 */
export async function fill(browser: ChromeBrowser, selector: string, value: string): Promise<ActionResult> {
  console.log(`Filling ${selector} with: ${value}`);

  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const value = ${JSON.stringify(value)};
      ${getFindElementScript()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `;

  await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  return { success: true, selector, value };
}

/**
 * Take screenshot.
 */
export async function screenshot(
  browser: ChromeBrowser,
  outputPath: string,
  fullPage = true
): Promise<ActionResult> {
  console.log(`Taking screenshot: ${outputPath}`);

  // Enable Page domain
  await browser.sendCommand('Page.enable');

  let params: any = {};
  if (fullPage) {
    // Get page dimensions
    const metrics = await browser.sendCommand('Page.getLayoutMetrics');
    const contentSize = metrics.contentSize;

    params = {
      clip: {
        x: 0,
        y: 0,
        width: contentSize.width,
        height: contentSize.height,
        scale: 1
      }
    };
  }

  const result = await browser.sendCommand('Page.captureScreenshot', params);

  // Decode and save
  const imageData = Buffer.from(result.data, 'base64');

  // Ensure output directory exists
  const absolutePath = ensureOutputPath(outputPath);
  const dir = dirname(absolutePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(absolutePath, imageData);

  return { success: true, path: absolutePath };
}

/**
 * Evaluate JavaScript.
 */
export async function evaluate(browser: ChromeBrowser, script: string): Promise<ActionResult> {
  const result = await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  return { success: true, result: result.result?.value };
}

/**
 * Extract text from element or body.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function extractText(browser: ChromeBrowser, selector?: string): Promise<ActionResult> {
  const script = selector
    ? `(function() {
        const selector = ${JSON.stringify(selector)};
        ${getFindElementScript()}
        return findElement(selector)?.textContent || '';
      })()`
    : `document.body.textContent || ''`;

  const result = await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  return { success: true, text: result.result?.value };
}

/**
 * Helper: Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate PDF from current page.
 */
export async function generatePdf(
  browser: ChromeBrowser,
  outputPath: string,
  landscape = false,
  printBackground = true
): Promise<ActionResult> {
  console.log(`Generating PDF: ${outputPath}`);

  await browser.sendCommand('Page.enable');

  const params = {
    printBackground,
    landscape,
    paperWidth: 8.5,  // inches
    paperHeight: 11.0,
    marginTop: 0.4,
    marginBottom: 0.4,
    marginLeft: 0.4,
    marginRight: 0.4
  };

  const result = await browser.sendCommand('Page.printToPDF', params);
  const pdfData = Buffer.from(result.data, 'base64');

  const absolutePath = ensureOutputPath(outputPath);
  writeFileSync(absolutePath, pdfData);

  return { success: true, path: absolutePath };
}

/**
 * Get all cookies.
 */
export async function getCookies(browser: ChromeBrowser): Promise<ActionResult> {
  console.log('Getting cookies...');
  const result = await browser.sendCommand('Network.getCookies');
  const cookies = result.cookies || [];
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
  httpOnly = false
): Promise<ActionResult> {
  console.log(`Setting cookie: ${name}`);

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
  return { success: true, name };
}

/**
 * Delete cookies.
 */
export async function deleteCookies(
  browser: ChromeBrowser,
  name?: string
): Promise<ActionResult> {
  if (name) {
    console.log(`Deleting cookie: ${name}`);
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
    } else {
      console.log(`Warning: Cookie '${name}' not found`);
    }
  } else {
    console.log('Deleting all cookies...');
    await browser.sendCommand('Network.clearBrowserCookies');
  }

  return { success: true };
}

/**
 * Create new tab.
 */
export async function newTab(
  browser: ChromeBrowser,
  url = 'about:blank'
): Promise<ActionResult> {
  console.log(`Opening new tab: ${url}`);
  const result = await browser.sendCommand('Target.createTarget', { url });
  return {
    success: true,
    targetId: result.targetId,
    url
  };
}

/**
 * List all tabs.
 */
export async function listTabs(browser: ChromeBrowser): Promise<ActionResult> {
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
  index?: number
): Promise<ActionResult> {
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
    return { success: false, error: 'Target not found' };
  }

  await browser.sendCommand('Target.activateTarget', { targetId: target.id });

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
  index?: number
): Promise<ActionResult> {
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
    return { success: false, error: 'Target not found' };
  }

  await browser.sendCommand('Target.closeTarget', { targetId: target.id });

  return {
    success: true,
    targetId: target.id,
    message: `Closed tab: ${target.title}`
  };
}

/**
 * Hover over element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function hover(
  browser: ChromeBrowser,
  selector: string
): Promise<ActionResult> {
  console.log(`Hovering: ${selector}`);
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      return true;
    })()
  `;
  await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });
  return { success: true, selector };
}

/**
 * Focus element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function focus(
  browser: ChromeBrowser,
  selector: string
): Promise<ActionResult> {
  console.log(`Focusing: ${selector}`);
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.focus();
      return true;
    })()
  `;
  await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });
  return { success: true, selector };
}

/**
 * Blur element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function blur(
  browser: ChromeBrowser,
  selector: string
): Promise<ActionResult> {
  console.log(`Blurring: ${selector}`);
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
      el.blur();
      return true;
    })()
  `;
  await browser.sendCommand('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });
  return { success: true, selector };
}

// findProjectRoot() is now imported from './utils'

/**
 * Helper: Ensure output path (convert relative to .browser-pilot/).
 * Security: Prevents path traversal attacks and rejects absolute paths.
 */
function ensureOutputPath(path: string): string {
  // Reject absolute paths
  if (resolve(path) === path) {
    throw new Error('Absolute paths are not allowed. Use relative paths only.');
  }

  // Relative path - save to project root/.browser-pilot/
  const projectRoot = findProjectRoot();
  const outputDir = resolve(projectRoot, '.browser-pilot');
  const absolutePath = resolve(outputDir, path);

  // Prevent path traversal attacks
  if (!absolutePath.startsWith(outputDir)) {
    throw new Error('Path traversal detected. Files must be within .browser-pilot directory.');
  }

  // Ensure directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  return absolutePath;
}
