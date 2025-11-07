"use strict";
/**
 * Capture command handlers for Browser Pilot Daemon
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleScreenshot = handleScreenshot;
exports.handleSetViewport = handleSetViewport;
exports.handleGetViewport = handleGetViewport;
exports.handleGetScreenInfo = handleGetScreenInfo;
exports.handlePdf = handlePdf;
const actions = __importStar(require("../../cdp/actions"));
/**
 * Handle screenshot command
 */
async function handleScreenshot(context, params) {
    const filename = params.filename;
    const fullPage = params.fullPage !== false; // Default true
    // Parse clip options if provided
    let clip;
    if (params.clipX !== undefined && params.clipY !== undefined &&
        params.clipWidth !== undefined && params.clipHeight !== undefined) {
        clip = {
            x: params.clipX,
            y: params.clipY,
            width: params.clipWidth,
            height: params.clipHeight,
            scale: params.clipScale
        };
    }
    return actions.screenshot(context.browser, filename || 'screenshot.png', fullPage, clip);
}
/**
 * Handle set viewport size command
 */
async function handleSetViewport(context, params) {
    const width = params.width;
    const height = params.height;
    const deviceScaleFactor = params.deviceScaleFactor || 1;
    const mobile = params.mobile || false;
    if (!width || !height) {
        throw new Error('Width and height are required for viewport');
    }
    return actions.setViewportSize(context.browser, width, height, deviceScaleFactor, mobile);
}
/**
 * Handle get viewport command
 */
async function handleGetViewport(context, params) {
    return actions.getViewport(context.browser);
}
/**
 * Handle get screen info command
 */
async function handleGetScreenInfo(context, params) {
    return actions.getScreenInfo(context.browser);
}
/**
 * Handle PDF generation command
 */
async function handlePdf(context, params) {
    const filename = params.filename;
    const landscape = params.landscape;
    return actions.generatePdf(context.browser, filename || 'page.pdf', landscape || false);
}
//# sourceMappingURL=capture-handlers.js.map