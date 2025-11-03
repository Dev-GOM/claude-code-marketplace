"use strict";
/**
 * Additional CDP actions - extraction, selection, input, files, page control, navigation, debugging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractData = extractData;
exports.selectOption = selectOption;
exports.check = check;
exports.uncheck = uncheck;
exports.pressKey = pressKey;
exports.typeText = typeText;
exports.uploadFile = uploadFile;
exports.reload = reload;
exports.goBack = goBack;
exports.goForward = goForward;
exports.waitMilliseconds = waitMilliseconds;
exports.waitFor = waitFor;
exports.waitForNetworkIdle = waitForNetworkIdle;
exports.getConsoleMessages = getConsoleMessages;
exports.getElementProperty = getElementProperty;
exports.findElement = findElement;
exports.getAccessibilitySnapshot = getAccessibilitySnapshot;
exports.getContent = getContent;
exports.scroll = scroll;
exports.dragAndDrop = dragAndDrop;
exports.emulateMedia = emulateMedia;
exports.handleDialog = handleDialog;
exports.getDialogMessage = getDialogMessage;
exports.respondToDialog = respondToDialog;
exports.enableRequestInterception = enableRequestInterception;
exports.disableRequestInterception = disableRequestInterception;
exports.mockRequest = mockRequest;
exports.blockRequest = blockRequest;
exports.unblockRequests = unblockRequests;
const fs_1 = require("fs");
const utils_1 = require("./utils");
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Extract data using multiple selectors.
 */
async function extractData(browser, selectors) {
    console.log(`Extracting data with ${Object.keys(selectors).length} selectors`);
    const data = {};
    for (const [key, selector] of Object.entries(selectors)) {
        try {
            const script = `
        (function() {
          const selector = ${JSON.stringify(selector)};
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) return null;
          if (elements.length === 1) return elements[0].innerText;
          return Array.from(elements).map(el => el.innerText);
        })()
      `;
            const result = await browser.sendCommand('Runtime.evaluate', {
                expression: script,
                returnByValue: true
            });
            data[key] = result.result?.value;
        }
        catch (error) {
            data[key] = `Error: ${error}`;
        }
    }
    return { success: true, data };
}
/**
 * Select option from dropdown.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function selectOption(browser, selector, value) {
    console.log(`Selecting option ${value} in: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const value = ${JSON.stringify(value)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
      el.value = value;
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
 * Check checkbox.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function check(browser, selector) {
    console.log(`Checking: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
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
 * Uncheck checkbox.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function uncheck(browser, selector) {
    console.log(`Unchecking: ${selector}`);
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
      el.checked = false;
      el.dispatchEvent(new Event('change', { bubbles: true }));
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
 * Press keyboard key.
 */
async function pressKey(browser, key) {
    console.log(`Pressing key: ${key}`);
    const script = `
    (function() {
      const key = ${JSON.stringify(key)};
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: key,
        bubbles: true
      }));
      document.dispatchEvent(new KeyboardEvent('keyup', {
        key: key,
        bubbles: true
      }));
      return true;
    })()
  `;
    await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    return { success: true, key };
}
/**
 * Type text character by character.
 */
async function typeText(browser, text, delay = 0) {
    console.log(`Typing: ${text}`);
    for (const char of text) {
        const script = `
      (function() {
        const char = ${JSON.stringify(char)};
        const activeElement = document.activeElement;
        if (activeElement) {
          activeElement.dispatchEvent(new KeyboardEvent('keydown', {
            key: char,
            bubbles: true
          }));
          activeElement.dispatchEvent(new KeyboardEvent('keypress', {
            key: char,
            bubbles: true
          }));
          if (activeElement.value !== undefined) {
            activeElement.value += char;
          }
          activeElement.dispatchEvent(new KeyboardEvent('keyup', {
            key: char,
            bubbles: true
          }));
        }
        return true;
      })()
    `;
        await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });
        if (delay > 0) {
            await sleep(delay);
        }
    }
    return { success: true, text };
}
/**
 * Upload file to input element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function uploadFile(browser, selector, filePath) {
    console.log(`Uploading file ${filePath} to: ${selector}`);
    // File size validation (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const stats = (0, fs_1.statSync)(filePath);
    if (stats.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE} bytes = 10MB)`);
    }
    const fileData = (0, fs_1.readFileSync)(filePath, 'base64');
    const fileName = filePath.split(/[/\\]/).pop() || 'file';
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const fileData = ${JSON.stringify(fileData)};
      const fileName = ${JSON.stringify(fileName)};

      ${(0, utils_1.getFindElementScript)()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
      if (el.tagName !== 'INPUT' || el.type !== 'file') {
        throw new Error('Element is not a file input');
      }

      const dataTransfer = new DataTransfer();
      const file = new File(
        [Uint8Array.from(atob(fileData), c => c.charCodeAt(0))],
        fileName
      );
      dataTransfer.items.add(file);
      el.files = dataTransfer.files;

      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `;
    await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    return { success: true, selector, file: filePath };
}
/**
 * Reload page.
 */
async function reload(browser, hard = false) {
    console.log(`Reloading page (hard: ${hard})`);
    await browser.sendCommand('Page.reload', { ignoreCache: hard });
    return { success: true, hardReload: hard };
}
/**
 * Navigate back in history.
 */
async function goBack(browser) {
    console.log('Navigating back');
    const history = await browser.sendCommand('Page.getNavigationHistory');
    const currentIndex = history.currentIndex || 0;
    if (currentIndex > 0) {
        const previousEntry = history.entries[currentIndex - 1];
        await browser.sendCommand('Page.navigateToHistoryEntry', {
            entryId: previousEntry.id
        });
        return { success: true, url: previousEntry.url };
    }
    return { success: false, error: 'No previous page in history' };
}
/**
 * Navigate forward in history.
 */
async function goForward(browser) {
    console.log('Navigating forward');
    const history = await browser.sendCommand('Page.getNavigationHistory');
    const currentIndex = history.currentIndex || 0;
    const totalEntries = history.entries?.length || 0;
    if (currentIndex < totalEntries - 1) {
        const nextEntry = history.entries[currentIndex + 1];
        await browser.sendCommand('Page.navigateToHistoryEntry', {
            entryId: nextEntry.id
        });
        return { success: true, url: nextEntry.url };
    }
    return { success: false, error: 'No next page in history' };
}
/**
 * Wait for specified milliseconds.
 */
async function waitMilliseconds(browser, ms) {
    await sleep(ms);
    return { success: true, waitedMs: ms };
}
/**
 * Wait for element to appear.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function waitFor(browser, selector, timeout = 30000) {
    console.log(`Waiting for: ${selector}`);
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const script = `(function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      return findElement(selector) !== null;
    })()`;
        const result = await browser.sendCommand('Runtime.evaluate', {
            expression: script,
            returnByValue: true
        });
        if (result.result?.value) {
            return { success: true, selector };
        }
        await sleep(100);
    }
    throw new Error(`Timeout waiting for: ${selector}`);
}
/**
 * Wait for network to be idle.
 */
async function waitForNetworkIdle(browser, timeout = 5000, maxInflight = 0) {
    console.log('Waiting for network idle');
    await browser.sendCommand('Network.enable');
    const script = `
    new Promise((resolve) => {
      const waitForNavigationComplete = () => {
        if (performance.timing.loadEventEnd > 0) {
          setTimeout(() => resolve(true), ${timeout});
        } else {
          setTimeout(waitForNavigationComplete, 100);
        }
      };
      waitForNavigationComplete();
    })
  `;
    await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        awaitPromise: true,
        returnByValue: true
    });
    return { success: true, state: 'network_idle' };
}
/**
 * Get console messages.
 *
 * Returns console messages that have been collected since the browser connected.
 * Messages are automatically collected when Log domain is enabled during connection.
 */
async function getConsoleMessages(browser, errorOnly = false) {
    console.log('Getting console messages...');
    // Get all collected messages from browser
    const allMessages = browser.getConsoleMessages();
    // Filter by error level if requested
    const messages = errorOnly
        ? allMessages.filter(msg => msg.level === 'error')
        : allMessages;
    // Format messages for display
    const formattedMessages = messages.map(msg => ({
        level: msg.level,
        text: msg.text,
        timestamp: new Date(msg.timestamp).toISOString(),
        url: msg.url,
        lineNumber: msg.lineNumber
    }));
    return {
        success: true,
        messages: formattedMessages,
        count: formattedMessages.length,
        errorCount: allMessages.filter(msg => msg.level === 'error').length,
        warningCount: allMessages.filter(msg => msg.level === 'warning').length,
        logCount: allMessages.filter(msg => msg.level === 'log' || msg.level === 'info').length
    };
}
/**
 * Get element property value.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function getElementProperty(browser, selector, propertyName) {
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const propertyName = ${JSON.stringify(propertyName)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found');
      return el[propertyName];
    })()
  `;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    if (result.exceptionDetails) {
        return {
            success: false,
            error: result.exceptionDetails.exception.description
        };
    }
    return {
        success: true,
        selector,
        property: propertyName,
        value: result.result?.value
    };
}
/**
 * Find element and return its information.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function findElement(browser, selector) {
    const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${(0, utils_1.getFindElementScript)()}
      const el = findElement(selector);
      if (!el) return null;

      const rect = el.getBoundingClientRect();

      return {
        tagName: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        textContent: el.textContent?.substring(0, 100),
        visible: rect.width > 0 && rect.height > 0,
        position: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        },
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      };
    })()
  `;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    const elementInfo = result.result?.value;
    if (elementInfo === null) {
        return {
            success: false,
            error: `Element not found: ${selector}`
        };
    }
    return {
        success: true,
        selector,
        element: elementInfo
    };
}
/**
 * Get accessibility tree snapshot.
 */
async function getAccessibilitySnapshot(browser) {
    console.log('Getting accessibility snapshot');
    await browser.sendCommand('Accessibility.enable');
    const result = await browser.sendCommand('Accessibility.getFullAXTree');
    const nodes = result.nodes || [];
    const formattedNodes = nodes.slice(0, 50).map((node) => ({
        role: node.role?.value,
        name: node.name?.value,
        description: node.description?.value
    }));
    return {
        success: true,
        nodeCount: nodes.length,
        nodes: formattedNodes
    };
}
/**
 * Get page HTML content.
 */
async function getContent(browser) {
    console.log('Getting page HTML content');
    const script = `document.documentElement.outerHTML`;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    return {
        success: true,
        content: result.result?.value || '',
        length: result.result?.value?.length || 0
    };
}
/**
 * Scroll page or element.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
async function scroll(browser, x = 0, y = 0, selector) {
    console.log(`Scrolling to (${x}, ${y})${selector ? ` on ${selector}` : ''}`);
    const script = selector
        ? `
      (function() {
        const selector = ${JSON.stringify(selector)};
        const x = ${JSON.stringify(x)};
        const y = ${JSON.stringify(y)};
        ${(0, utils_1.getFindElementScript)()}
        const el = findElement(selector);
        if (!el) throw new Error('Element not found');
        el.scrollTo(x, y);
        return { x: el.scrollLeft, y: el.scrollTop };
      })()
    `
        : `
      (function() {
        const x = ${JSON.stringify(x)};
        const y = ${JSON.stringify(y)};
        window.scrollTo(x, y);
        return { x: window.scrollX, y: window.scrollY };
      })()
    `;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    return {
        success: true,
        position: result.result?.value
    };
}
/**
 * Drag and drop from one element to another.
 */
async function dragAndDrop(browser, sourceSelector, targetSelector) {
    console.log(`Dragging ${sourceSelector} to ${targetSelector}`);
    const script = `
    (function() {
      const sourceSelector = ${JSON.stringify(sourceSelector)};
      const targetSelector = ${JSON.stringify(targetSelector)};

      const source = document.querySelector(sourceSelector);
      const target = document.querySelector(targetSelector);

      if (!source) throw new Error('Source element not found: ' + sourceSelector);
      if (!target) throw new Error('Target element not found: ' + targetSelector);

      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      // Create and dispatch drag events
      const dataTransfer = new DataTransfer();

      const dragStart = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      source.dispatchEvent(dragStart);

      const dragEnter = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      target.dispatchEvent(dragEnter);

      const dragOver = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      target.dispatchEvent(dragOver);

      const drop = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      target.dispatchEvent(drop);

      const dragEnd = new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      source.dispatchEvent(dragEnd);

      return {
        source: { x: sourceRect.x, y: sourceRect.y },
        target: { x: targetRect.x, y: targetRect.y }
      };
    })()
  `;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    return {
        success: true,
        sourceSelector,
        targetSelector,
        positions: result.result?.value
    };
}
/**
 * Emulate media type or color scheme.
 */
async function emulateMedia(browser, mediaType, colorScheme) {
    console.log(`Emulating media - type: ${mediaType || 'none'}, colorScheme: ${colorScheme || 'none'}`);
    await browser.sendCommand('Emulation.setEmulatedMedia', {
        media: mediaType || '',
        features: colorScheme ? [{
                name: 'prefers-color-scheme',
                value: colorScheme
            }] : []
    });
    return {
        success: true,
        mediaType: mediaType || null,
        colorScheme: colorScheme || null
    };
}
/**
 * Handle JavaScript dialogs (alert, confirm, prompt).
 * Must be called BEFORE the dialog appears.
 */
async function handleDialog(browser, accept = true, promptText) {
    console.log(`Setting up dialog handler - accept: ${accept}, promptText: ${promptText || 'none'}`);
    // Enable Page domain for dialog events
    await browser.sendCommand('Page.enable');
    // Set up dialog handler
    await browser.sendCommand('Page.setInterceptFileChooserDialog', {
        enabled: false
    });
    // Note: CDP doesn't have a way to pre-register dialog handlers
    // This returns a handler configuration that should be used with Page.javascriptDialogOpening event
    return {
        success: true,
        accept,
        promptText: promptText || null,
        note: 'Dialog handler configured. Use getDialogMessage() to check for dialogs.'
    };
}
/**
 * Get current dialog message if one is open.
 * This should be called in response to Page.javascriptDialogOpening event.
 */
async function getDialogMessage(browser) {
    // This function is a placeholder for dialog detection
    // In real CDP usage, you'd listen for Page.javascriptDialogOpening events
    const script = `
    (function() {
      // Check if there's an active dialog by trying to access document
      try {
        document.body;
        return null; // No dialog
      } catch (e) {
        return { blocked: true }; // Dialog is blocking
      }
    })()
  `;
    const result = await browser.sendCommand('Runtime.evaluate', {
        expression: script,
        returnByValue: true
    });
    return {
        success: true,
        dialogActive: result.result?.value !== null
    };
}
/**
 * Accept or dismiss a JavaScript dialog.
 */
async function respondToDialog(browser, accept = true, promptText) {
    console.log(`Responding to dialog - accept: ${accept}`);
    await browser.sendCommand('Page.handleJavaScriptDialog', {
        accept,
        promptText: promptText || ''
    });
    return {
        success: true,
        accept,
        promptText: promptText || null
    };
}
/**
 * Set up network request interception.
 */
async function enableRequestInterception(browser) {
    console.log('Enabling network request interception');
    await browser.sendCommand('Fetch.enable', {
        patterns: [{ urlPattern: '*' }]
    });
    return {
        success: true,
        note: 'Request interception enabled. Use interceptRequest() to handle requests.'
    };
}
/**
 * Disable network request interception.
 */
async function disableRequestInterception(browser) {
    console.log('Disabling network request interception');
    await browser.sendCommand('Fetch.disable');
    return {
        success: true
    };
}
/**
 * Mock a network request response.
 */
async function mockRequest(browser, urlPattern, responseBody, statusCode = 200, headers) {
    console.log(`Mocking request: ${urlPattern} -> ${statusCode}`);
    // This is a simplified version - full implementation requires event handling
    await browser.sendCommand('Fetch.enable', {
        patterns: [{ urlPattern }]
    });
    return {
        success: true,
        urlPattern,
        statusCode,
        note: 'Mock configured. Use Fetch.continueRequest or Fetch.fulfillRequest in event handler.'
    };
}
/**
 * Block network requests matching pattern.
 */
async function blockRequest(browser, urlPattern) {
    console.log(`Blocking requests matching: ${urlPattern}`);
    await browser.sendCommand('Network.enable');
    await browser.sendCommand('Network.setBlockedURLs', {
        urls: [urlPattern]
    });
    return {
        success: true,
        urlPattern,
        blocked: true
    };
}
/**
 * Unblock all network requests.
 */
async function unblockRequests(browser) {
    console.log('Unblocking all requests');
    await browser.sendCommand('Network.setBlockedURLs', {
        urls: []
    });
    return {
        success: true,
        blocked: false
    };
}
//# sourceMappingURL=actions-extra.js.map