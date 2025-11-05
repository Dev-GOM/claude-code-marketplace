/**
 * Debugging actions for Browser Pilot.
 */

import { ChromeBrowser, FormattedConsoleMessage } from '../browser';
import { getFindElementScript } from '../utils';
import { ActionResult, ActionOptions, mergeOptions, checkErrors, RuntimeEvaluateResult } from './helpers';
import { logger } from '../../utils/logger';

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

  if (opts.verbose) logger.info('📋 Getting console messages...');

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
    logger.info(`✅ Retrieved ${formattedMessages.length} message(s) (${errorCount} errors, ${warningCount} warnings)`);
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

  if (opts.verbose) logger.info('♿ Getting accessibility snapshot...');

  try {
    await browser.sendCommand('Accessibility.enable');
    const result = await browser.sendCommand<{ nodes: unknown[] }>('Accessibility.getFullAXTree');

    const nodes = result.nodes || [];

    const formattedNodes = nodes.slice(0, 50).map((node: unknown) => {
      const n = node as { role?: { value?: string }; name?: { value?: string }; description?: { value?: string } };
      return {
        role: n.role?.value,
        name: n.name?.value,
        description: n.description?.value
      };
    });

    if (opts.verbose) logger.info(`✅ Retrieved ${nodes.length} accessibility nodes (showing first 50)`);

    return {
      success: true,
      nodeCount: nodes.length,
      nodes: formattedNodes
    };

  } catch (error) {
    if (opts.verbose) {
      logger.error(`❌ Get accessibility snapshot failed`, error);
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

  if (opts.verbose) logger.info(`🔍 Finding element: ${selector}`);
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

  const result = await browser.sendCommand<RuntimeEvaluateResult>('Runtime.evaluate', {
    expression: script,
    returnByValue: true
  });

  const elementInfo = result.result?.value as { tagName?: string; id?: string; className?: string; attributes?: Record<string, string> } | null | undefined;

  if (!elementInfo) {
    if (opts.verbose) logger.info(`❌ Element not found: ${selector}`);
    return {
      success: false,
      error: `Element not found: ${selector}`
    };
  }

  if (opts.verbose) logger.info(`✅ Found <${elementInfo.tagName}> element`);
  checkErrors(browser, opts.logLevel);

  return {
    success: true,
    selector,
    element: elementInfo
  };
}
