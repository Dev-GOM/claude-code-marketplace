"use strict";
/**
 * Core CDP actions for browser automation.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigate = navigate;
exports.waitForLoad = waitForLoad;
exports.click = click;
exports.fill = fill;
exports.screenshot = screenshot;
exports.evaluate = evaluate;
exports.extractText = extractText;
exports.generatePdf = generatePdf;
exports.getCookies = getCookies;
exports.setCookie = setCookie;
exports.deleteCookies = deleteCookies;
exports.newTab = newTab;
exports.listTabs = listTabs;
exports.switchTab = switchTab;
exports.closeTab = closeTab;
exports.hover = hover;
exports.focus = focus;
exports.blur = blur;
const fs_1 = require("fs");
const path_1 = require("path");
const fs_2 = require("fs");
const utils_1 = require("./utils");
// Re-export all extra functions
__exportStar(require("./actions-extra"), exports);
/**
 * Navigate to URL.
 */
async function navigate(browser, url) {
    console.log(`Navigating to: ${url}`);
    await browser.sendCommand('Page.navigate', { url });
    await sleep(1000); // Wait for page load
    return { success: true, url };
}
/**
 * Wait for page load complete.
 */
async function waitForLoad(browser, timeout = 30000) {
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
async function click(browser, selector) {
    console.log(`Clicking: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
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
async function fill(browser, selector, value) {
    console.log(`Filling ${selector} with: ${value}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const value = ${JSON.stringify(value)};
      ${(0, utils_1.getFindElementScript)()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
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
async function screenshot(browser, outputPath, fullPage = true) {
    console.log(`Taking screenshot: ${outputPath}`);
    // Enable Page domain
    await browser.sendCommand('Page.enable');
    let params = {};
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
    const dir = (0, path_1.dirname)(absolutePath);
    if (!(0, fs_2.existsSync)(dir)) {
        (0, fs_2.mkdirSync)(dir, { recursive: true });
    }
    (0, fs_1.writeFileSync)(absolutePath, imageData);
    return { success: true, path: absolutePath };
}
/**
 * Evaluate JavaScript.
 */
async function evaluate(browser, script) {
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
async function extractText(browser, selector) {
    const script = selector
        ? `(function() {
        const selector = ${JSON.stringify(selector)};
        ${(0, utils_1.getFindElementScript)()}
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
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Generate PDF from current page.
 */
async function generatePdf(browser, outputPath, landscape = false, printBackground = true) {
    console.log(`Generating PDF: ${outputPath}`);
    await browser.sendCommand('Page.enable');
    const params = {
        printBackground,
        landscape,
        paperWidth: 8.5, // inches
        paperHeight: 11.0,
        marginTop: 0.4,
        marginBottom: 0.4,
        marginLeft: 0.4,
        marginRight: 0.4
    };
    const result = await browser.sendCommand('Page.printToPDF', params);
    const pdfData = Buffer.from(result.data, 'base64');
    const absolutePath = ensureOutputPath(outputPath);
    (0, fs_1.writeFileSync)(absolutePath, pdfData);
    return { success: true, path: absolutePath };
}
/**
 * Get all cookies.
 */
async function getCookies(browser) {
    console.log('Getting cookies...');
    const result = await browser.sendCommand('Network.getCookies');
    const cookies = result.cookies || [];
    return { success: true, cookies, count: cookies.length };
}
/**
 * Set a cookie.
 */
async function setCookie(browser, name, value, domain, path = '/', secure = false, httpOnly = false) {
    console.log(`Setting cookie: ${name}`);
    const cookieParams = {
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
async function deleteCookies(browser, name) {
    if (name) {
        console.log(`Deleting cookie: ${name}`);
        // Get all cookies to find the domain
        const result = await browser.sendCommand('Network.getCookies');
        const cookies = result.cookies || [];
        // Find matching cookies
        const matchingCookies = cookies.filter((c) => c.name === name);
        if (matchingCookies.length > 0) {
            for (const cookie of matchingCookies) {
                await browser.sendCommand('Network.deleteCookies', {
                    name,
                    domain: cookie.domain || ''
                });
            }
        }
        else {
            console.log(`Warning: Cookie '${name}' not found`);
        }
    }
    else {
        console.log('Deleting all cookies...');
        await browser.sendCommand('Network.clearBrowserCookies');
    }
    return { success: true };
}
/**
 * Create new tab.
 */
async function newTab(browser, url = 'about:blank') {
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
async function listTabs(browser) {
    const debugPort = browser.debugPort;
    const response = await fetch(`http://localhost:${debugPort}/json`);
    const targets = await response.json();
    const pageTabs = targets
        .filter((t) => t.type === 'page')
        .map((t, index) => ({
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
async function switchTab(browser, targetId, index) {
    const debugPort = browser.debugPort;
    const response = await fetch(`http://localhost:${debugPort}/json`);
    const targets = await response.json();
    const pageTabs = targets.filter((t) => t.type === 'page');
    let target = null;
    if (targetId) {
        target = pageTabs.find((t) => t.id === targetId);
    }
    else if (index !== undefined) {
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
async function closeTab(browser, targetId, index) {
    const debugPort = browser.debugPort;
    const response = await fetch(`http://localhost:${debugPort}/json`);
    const targets = await response.json();
    const pageTabs = targets.filter((t) => t.type === 'page');
    let target = null;
    if (targetId) {
        target = pageTabs.find((t) => t.id === targetId);
    }
    else if (index !== undefined) {
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
async function hover(browser, selector) {
    console.log(`Hovering: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
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
async function focus(browser, selector) {
    console.log(`Focusing: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
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
async function blur(browser, selector) {
    console.log(`Blurring: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
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
function ensureOutputPath(path) {
    // Reject absolute paths
    if ((0, path_1.resolve)(path) === path) {
        throw new Error('Absolute paths are not allowed. Use relative paths only.');
    }
    // Relative path - save to project root/.browser-pilot/
    const projectRoot = (0, utils_1.findProjectRoot)();
    const outputDir = (0, path_1.resolve)(projectRoot, '.browser-pilot');
    const absolutePath = (0, path_1.resolve)(outputDir, path);
    // Prevent path traversal attacks
    if (!absolutePath.startsWith(outputDir)) {
        throw new Error('Path traversal detected. Files must be within .browser-pilot directory.');
    }
    // Ensure directory exists
    if (!(0, fs_2.existsSync)(outputDir)) {
        (0, fs_2.mkdirSync)(outputDir, { recursive: true });
    }
    return absolutePath;
}
//# sourceMappingURL=actions.js.map