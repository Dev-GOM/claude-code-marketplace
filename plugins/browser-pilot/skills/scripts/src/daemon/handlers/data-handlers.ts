/**
 * Data extraction command handlers for Browser Pilot Daemon
 */

import { HandlerContext } from './navigation-handlers';
import * as actions from '../../cdp/actions';

/**
 * Handle extract command (text extraction)
 */
export async function handleExtract(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const selector = params.selector as string | undefined;

  // If selectors object provided, use extractData for multiple selectors
  if (params.selectors && typeof params.selectors === 'object') {
    return actions.extractData(context.browser, params.selectors as Record<string, string>);
  }

  // Otherwise use extractText for single selector
  return actions.extractText(context.browser, selector);
}

/**
 * Handle content command (get page HTML)
 */
export async function handleContent(
  context: HandlerContext,
  _params: Record<string, unknown>
): Promise<unknown> {
  return actions.getContent(context.browser);
}

/**
 * Handle find command (find element)
 */
export async function handleFind(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const selector = params.selector as string;
  return actions.findElement(context.browser, selector);
}

/**
 * Handle JavaScript evaluation command
 */
export async function handleEval(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const expression = params.expression as string;
  return actions.evaluate(context.browser, expression);
}
