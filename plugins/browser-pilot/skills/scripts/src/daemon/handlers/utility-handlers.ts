/**
 * Utility command handlers for Browser Pilot Daemon
 */

import { HandlerContext } from './navigation-handlers';
import * as actions from '../../cdp/actions';
import { DaemonState } from '../protocol';

/**
 * Handle scroll command
 */
export async function handleScroll(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const x = params.x as number;
  const y = params.y as number;
  return actions.scroll(context.browser, { x, y });
}

/**
 * Handle wait command
 */
export async function handleWait(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const duration = params.duration as number | undefined;
  if (duration) {
    // Simple sleep implementation
    await new Promise(resolve => setTimeout(resolve, duration));
    return { success: true, duration };
  } else {
    return actions.waitForLoad(context.browser);
  }
}

/**
 * Handle console command
 */
export async function handleConsole(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const errorsOnly = params.errorsOnly as boolean | undefined;
  const result = await actions.getConsoleMessages(context.browser, errorsOnly);

  if (params.clear) {
    context.browser.clearConsoleMessages();
  }

  return result;
}

/**
 * Handle status command
 */
export async function handleStatus(
  context: HandlerContext,
  _params: Record<string, unknown>,
  startTime: number,
  lastActivity: number
): Promise<DaemonState> {
  const currentUrl = await context.browser.sendCommand<{ result: { value: string } }>('Runtime.evaluate', {
    expression: 'window.location.href',
    returnByValue: true
  });

  return {
    connected: true,
    currentUrl: currentUrl.result?.value || null,
    targetId: null, // CDP client doesn't expose targetId directly
    debugPort: context.browser.debugPort,
    consoleMessageCount: context.browser.getConsoleMessages().length,
    networkErrorCount: context.browser.getNetworkErrors().length,
    uptime: Date.now() - startTime,
    lastActivity: lastActivity
  };
}
