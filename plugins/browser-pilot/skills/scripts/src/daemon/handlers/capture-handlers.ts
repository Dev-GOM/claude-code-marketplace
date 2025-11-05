/**
 * Capture command handlers for Browser Pilot Daemon
 */

import { HandlerContext } from './navigation-handlers';
import * as actions from '../../cdp/actions';

/**
 * Handle screenshot command
 */
export async function handleScreenshot(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const filename = params.filename as string | undefined;
  return actions.screenshot(context.browser, filename || 'screenshot.png');
}

/**
 * Handle PDF generation command
 */
export async function handlePdf(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const filename = params.filename as string | undefined;
  const landscape = params.landscape as boolean | undefined;
  return actions.generatePdf(context.browser, filename || 'page.pdf', landscape || false);
}
