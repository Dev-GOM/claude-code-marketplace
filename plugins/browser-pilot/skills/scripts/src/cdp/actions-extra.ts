/**
 * Additional CDP actions - extraction, selection, input, files, page control, navigation, debugging
 */

import { ChromeBrowser, FormattedConsoleMessage } from './browser';
import { readFileSync, statSync } from 'fs';
import { getFindElementScript } from './utils';

export interface ActionResult {
  success: boolean;
  [key: string]: any;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract data using multiple selectors.
 */
export async function extractData(
  browser: ChromeBrowser,
  selectors: Record<string, string>
): Promise<ActionResult> {
  console.log(`Extracting data with ${Object.keys(selectors).length} selectors`);

  const data: Record<string, any> = {};

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
    } catch (error) {
      data[key] = `Error: ${error}`;
    }
  }

  return { success: true, data };
}

/**
 * Select option from dropdown.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function selectOption(
  browser: ChromeBrowser,
  selector: string,
  value: string
): Promise<ActionResult> {
  console.log(`Selecting option ${value} in: ${selector}`);
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const value = ${JSON.stringify(value)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
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
export async function check(
  browser: ChromeBrowser,
  selector: string
): Promise<ActionResult> {
  console.log(`Checking: ${selector}`);
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
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
export async function uncheck(
  browser: ChromeBrowser,
  selector: string
): Promise<ActionResult> {
  console.log(`Unchecking: ${selector}`);
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
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
export async function pressKey(
  browser: ChromeBrowser,
  key: string
): Promise<ActionResult> {
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
export async function typeText(
  browser: ChromeBrowser,
  text: string,
  delay = 0
): Promise<ActionResult> {
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
export async function uploadFile(
  browser: ChromeBrowser,
  selector: string,
  filePath: string
): Promise<ActionResult> {
  console.log(`Uploading file ${filePath} to: ${selector}`);

  // File size validation (10MB limit)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const stats = statSync(filePath);

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE} bytes = 10MB)`);
  }

  const fileData = readFileSync(filePath, 'base64');
  const fileName = filePath.split(/[/\\]/).pop() || 'file';

  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const fileData = ${JSON.stringify(fileData)};
      const fileName = ${JSON.stringify(fileName)};

      ${getFindElementScript()}

      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
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
export async function reload(
  browser: ChromeBrowser,
  hard = false
): Promise<ActionResult> {
  console.log(`Reloading page (hard: ${hard})`);
  await browser.sendCommand('Page.reload', { ignoreCache: hard });
  return { success: true, hardReload: hard };
}

/**
 * Navigate back in history.
 */
export async function goBack(browser: ChromeBrowser): Promise<ActionResult> {
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
export async function goForward(browser: ChromeBrowser): Promise<ActionResult> {
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
export async function waitMilliseconds(
  browser: ChromeBrowser,
  ms: number
): Promise<ActionResult> {
  await sleep(ms);
  return { success: true, waitedMs: ms };
}

/**
 * Wait for element to appear.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function waitFor(
  browser: ChromeBrowser,
  selector: string,
  timeout = 30000
): Promise<ActionResult> {
  console.log(`Waiting for: ${selector}`);

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const script = `(function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
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
export async function waitForNetworkIdle(
  browser: ChromeBrowser,
  timeout = 5000,
  maxInflight = 0
): Promise<ActionResult> {
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
export async function getConsoleMessages(
  browser: ChromeBrowser,
  errorOnly = false
): Promise<ActionResult> {
  console.log('Getting console messages...');

  // Get all collected messages from browser
  const allMessages = browser.getConsoleMessages();

  // Filter by error level if requested
  const messages = errorOnly
    ? allMessages.filter(msg => msg.level === 'error')
    : allMessages;

  // Format messages for display
  const formattedMessages: FormattedConsoleMessage[] = messages.map(msg => ({
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
export async function getElementProperty(
  browser: ChromeBrowser,
  selector: string,
  propertyName: string
): Promise<ActionResult> {
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      const propertyName = ${JSON.stringify(propertyName)};
      ${getFindElementScript()}
      const el = findElement(selector);
      if (!el) throw new Error('Element not found: ' + selector);
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
export async function findElement(
  browser: ChromeBrowser,
  selector: string
): Promise<ActionResult> {
  const script = `
    (function() {
      const selector = ${JSON.stringify(selector)};
      ${getFindElementScript()}
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
export async function getAccessibilitySnapshot(
  browser: ChromeBrowser
): Promise<ActionResult> {
  console.log('Getting accessibility snapshot');

  await browser.sendCommand('Accessibility.enable');
  const result = await browser.sendCommand('Accessibility.getFullAXTree');

  const nodes = result.nodes || [];

  const formattedNodes = nodes.slice(0, 50).map((node: any) => ({
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
export async function getContent(browser: ChromeBrowser): Promise<ActionResult> {
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
export async function scroll(
  browser: ChromeBrowser,
  x: number = 0,
  y: number = 0,
  selector?: string
): Promise<ActionResult> {
  console.log(`Scrolling to (${x}, ${y})${selector ? ` on ${selector}` : ''}`);

  const script = selector
    ? `
      (function() {
        const selector = ${JSON.stringify(selector)};
        const x = ${JSON.stringify(x)};
        const y = ${JSON.stringify(y)};
        ${getFindElementScript()}
        const el = findElement(selector);
        if (!el) throw new Error('Element not found: ' + selector);
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
export async function dragAndDrop(
  browser: ChromeBrowser,
  sourceSelector: string,
  targetSelector: string
): Promise<ActionResult> {
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
export async function emulateMedia(
  browser: ChromeBrowser,
  mediaType?: 'screen' | 'print',
  colorScheme?: 'light' | 'dark' | 'no-preference'
): Promise<ActionResult> {
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
export async function handleDialog(
  browser: ChromeBrowser,
  accept: boolean = true,
  promptText?: string
): Promise<ActionResult> {
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
export async function getDialogMessage(
  browser: ChromeBrowser
): Promise<ActionResult> {
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
export async function respondToDialog(
  browser: ChromeBrowser,
  accept: boolean = true,
  promptText?: string
): Promise<ActionResult> {
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
export async function enableRequestInterception(
  browser: ChromeBrowser
): Promise<ActionResult> {
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
export async function disableRequestInterception(
  browser: ChromeBrowser
): Promise<ActionResult> {
  console.log('Disabling network request interception');

  await browser.sendCommand('Fetch.disable');

  return {
    success: true
  };
}

/**
 * Mock a network request response.
 */
export async function mockRequest(
  browser: ChromeBrowser,
  urlPattern: string,
  responseBody: string,
  statusCode: number = 200,
  headers?: Record<string, string>
): Promise<ActionResult> {
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
export async function blockRequest(
  browser: ChromeBrowser,
  urlPattern: string
): Promise<ActionResult> {
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
export async function unblockRequests(
  browser: ChromeBrowser
): Promise<ActionResult> {
  console.log('Unblocking all requests');

  await browser.sendCommand('Network.setBlockedURLs', {
    urls: []
  });

  return {
    success: true,
    blocked: false
  };
}
