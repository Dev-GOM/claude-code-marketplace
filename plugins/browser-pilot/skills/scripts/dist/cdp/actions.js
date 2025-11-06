"use strict";
/**
 * Core CDP actions for browser automation.
 *
 * This file serves as the main index for all action modules.
 * Modularized for better organization and maintainability.
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureOutputPath = exports.checkConsoleErrors = exports.sleep = void 0;
// Re-export helper functions (excluding ActionResult to avoid conflict)
var helpers_1 = require("./actions/helpers");
Object.defineProperty(exports, "sleep", { enumerable: true, get: function () { return helpers_1.sleep; } });
Object.defineProperty(exports, "checkConsoleErrors", { enumerable: true, get: function () { return helpers_1.checkConsoleErrors; } });
Object.defineProperty(exports, "ensureOutputPath", { enumerable: true, get: function () { return helpers_1.ensureOutputPath; } });
// Re-export modular actions
__exportStar(require("./actions/navigation"), exports);
__exportStar(require("./actions/interaction"), exports);
__exportStar(require("./actions/capture"), exports);
__exportStar(require("./actions/data"), exports);
__exportStar(require("./actions/cookies"), exports);
__exportStar(require("./actions/tabs"), exports);
__exportStar(require("./actions/forms"), exports);
__exportStar(require("./actions/input"), exports);
__exportStar(require("./actions/scroll"), exports);
__exportStar(require("./actions/wait"), exports);
__exportStar(require("./actions/debugging"), exports);
__exportStar(require("./actions/emulation"), exports);
__exportStar(require("./actions/dialogs"), exports);
__exportStar(require("./actions/network"), exports);
//# sourceMappingURL=actions.js.map