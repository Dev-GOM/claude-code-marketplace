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
  const fullPage = params.fullPage !== false; // Default true

  // Parse clip options if provided
  let clip: actions.ClipOptions | undefined;
  if (params.clipX !== undefined && params.clipY !== undefined &&
      params.clipWidth !== undefined && params.clipHeight !== undefined) {
    clip = {
      x: params.clipX as number,
      y: params.clipY as number,
      width: params.clipWidth as number,
      height: params.clipHeight as number,
      scale: params.clipScale as number | undefined
    };
  }

  return actions.screenshot(context.browser, filename || 'screenshot.png', fullPage, clip);
}

/**
 * Handle set viewport size command
 */
export async function handleSetViewport(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  const width = params.width as number;
  const height = params.height as number;
  const deviceScaleFactor = (params.deviceScaleFactor as number) || 1;
  const mobile = (params.mobile as boolean) || false;

  if (!width || !height) {
    throw new Error('Width and height are required for viewport');
  }

  return actions.setViewportSize(context.browser, width, height, deviceScaleFactor, mobile);
}

/**
 * Handle get viewport command
 */
export async function handleGetViewport(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  return actions.getViewport(context.browser);
}

/**
 * Handle get screen info command
 */
export async function handleGetScreenInfo(
  context: HandlerContext,
  params: Record<string, unknown>
): Promise<unknown> {
  return actions.getScreenInfo(context.browser);
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
