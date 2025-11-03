/**
 * Debugging actions for Browser Pilot.
 */

import { ChromeBrowser, FormattedConsoleMessage } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, checkConsoleErrors } from './helpers';

/**
 * Get console messages.
 *
 * Returns console messages that have been collected since the browser connected.
 * Messages are automatically collected when Log domain is enabled during connection.
 */
export async function getConsoleMessages(
  browser: ChromeBrowser,
  errorOnly = false,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log('📋 Getting console messages...');

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

  const errorCount = allMessages.filter(msg => msg.level === 'error').length;
  const warningCount = allMessages.filter(msg => msg.level === 'warning').length;

  if (opts.verbose) {
    console.log(`✅ Retrieved ${formattedMessages.length} message(s) (${errorCount} errors, ${warningCount} warnings)`);
  }

  return {
    success: true,
    messages: formattedMessages,
    count: formattedMessages.length,
    errorCount,
    warningCount,
    logCount: allMessages.filter(msg => msg.level === 'log' || msg.level === 'info').length
  };
}

/**
 * Get accessibility tree snapshot.
 */
export async function getAccessibilitySnapshot(
  browser: ChromeBrowser,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log('♿ Getting accessibility snapshot...');

  try {
    await browser.sendCommand('Accessibility.enable');
    const result = await browser.sendCommand('Accessibility.getFullAXTree');

    const nodes = result.nodes || [];

    const formattedNodes = nodes.slice(0, 50).map((node: any) => ({
      role: node.role?.value,
      name: node.name?.value,
      description: node.description?.value
    }));

    if (opts.verbose) console.log(`✅ Retrieved ${nodes.length} accessibility nodes (showing first 50)`);

    return {
      success: true,
      nodeCount: nodes.length,
      nodes: formattedNodes
    };

  } catch (error: any) {
    if (opts.verbose) {
      console.error(`❌ Get accessibility snapshot failed`);
      console.error(`   Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Find element and return its information.
 * Supports both CSS selectors and XPath (when selector starts with '//').
 */
export async function findElement(
  browser: ChromeBrowser,
  selector: string,
  options?: ActionOptions
): Promise<ActionResult> {
  const opts = mergeOptions(options);

  if (opts.verbose) console.log(`🔍 Finding element: ${selector}`);
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
    if (opts.verbose) console.log(`❌ Element not found: ${selector}`);
    return {
      success: false,
      error: `Element not found: ${selector}`
    };
  }

  if (opts.verbose) console.log(`✅ Found <${elementInfo.tagName}> element`);
  checkConsoleErrors(browser);

  return {
    success: true,
    selector,
    element: elementInfo
  };
}
