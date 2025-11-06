"use strict";
/**
 * Utility command handlers for Browser Pilot Daemon
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
exports.handleScroll = handleScroll;
exports.handleWait = handleWait;
exports.handleConsole = handleConsole;
exports.handleStatus = handleStatus;
const actions = __importStar(require("../../cdp/actions"));
/**
 * Handle scroll command
 */
async function handleScroll(context, params) {
    const x = params.x;
    const y = params.y;
    return actions.scroll(context.browser, { x, y });
}
/**
 * Handle wait command
 */
async function handleWait(context, params) {
    const duration = params.duration;
    if (duration) {
        // Simple sleep implementation
        await new Promise(resolve => setTimeout(resolve, duration));
        return { success: true, duration };
    }
    else {
        return actions.waitForLoad(context.browser);
    }
}
/**
 * Handle console command
 */
async function handleConsole(context, params) {
    const errorsOnly = params.errorsOnly;
    const result = await actions.getConsoleMessages(context.browser, errorsOnly);
    if (params.clear) {
        context.browser.clearConsoleMessages();
    }
    return result;
}
/**
 * Handle status command
 */
async function handleStatus(context, _params, startTime, lastActivity) {
    const currentUrl = await context.browser.sendCommand('Runtime.evaluate', {
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
//# sourceMappingURL=utility-handlers.js.map