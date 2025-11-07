"use strict";
/**
 * Unified exports for all Browser Pilot Daemon handlers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStatus = exports.handleConsole = exports.handleWait = exports.handleScroll = exports.handleGetMapStatus = exports.handleGenerateMap = exports.handleQueryMap = exports.handleEval = exports.handleFind = exports.handleContent = exports.handleExtract = exports.handleGetScreenInfo = exports.handleGetViewport = exports.handleSetViewport = exports.handlePdf = exports.handleScreenshot = exports.handleType = exports.handlePress = exports.handleHover = exports.handleFill = exports.handleClick = exports.handleReload = exports.handleForward = exports.handleBack = exports.handleNavigate = void 0;
// Navigation handlers
var navigation_handlers_1 = require("./navigation-handlers");
Object.defineProperty(exports, "handleNavigate", { enumerable: true, get: function () { return navigation_handlers_1.handleNavigate; } });
Object.defineProperty(exports, "handleBack", { enumerable: true, get: function () { return navigation_handlers_1.handleBack; } });
Object.defineProperty(exports, "handleForward", { enumerable: true, get: function () { return navigation_handlers_1.handleForward; } });
Object.defineProperty(exports, "handleReload", { enumerable: true, get: function () { return navigation_handlers_1.handleReload; } });
// Interaction handlers
var interaction_handlers_1 = require("./interaction-handlers");
Object.defineProperty(exports, "handleClick", { enumerable: true, get: function () { return interaction_handlers_1.handleClick; } });
Object.defineProperty(exports, "handleFill", { enumerable: true, get: function () { return interaction_handlers_1.handleFill; } });
Object.defineProperty(exports, "handleHover", { enumerable: true, get: function () { return interaction_handlers_1.handleHover; } });
Object.defineProperty(exports, "handlePress", { enumerable: true, get: function () { return interaction_handlers_1.handlePress; } });
Object.defineProperty(exports, "handleType", { enumerable: true, get: function () { return interaction_handlers_1.handleType; } });
// Capture handlers
var capture_handlers_1 = require("./capture-handlers");
Object.defineProperty(exports, "handleScreenshot", { enumerable: true, get: function () { return capture_handlers_1.handleScreenshot; } });
Object.defineProperty(exports, "handlePdf", { enumerable: true, get: function () { return capture_handlers_1.handlePdf; } });
Object.defineProperty(exports, "handleSetViewport", { enumerable: true, get: function () { return capture_handlers_1.handleSetViewport; } });
Object.defineProperty(exports, "handleGetViewport", { enumerable: true, get: function () { return capture_handlers_1.handleGetViewport; } });
Object.defineProperty(exports, "handleGetScreenInfo", { enumerable: true, get: function () { return capture_handlers_1.handleGetScreenInfo; } });
// Data handlers
var data_handlers_1 = require("./data-handlers");
Object.defineProperty(exports, "handleExtract", { enumerable: true, get: function () { return data_handlers_1.handleExtract; } });
Object.defineProperty(exports, "handleContent", { enumerable: true, get: function () { return data_handlers_1.handleContent; } });
Object.defineProperty(exports, "handleFind", { enumerable: true, get: function () { return data_handlers_1.handleFind; } });
Object.defineProperty(exports, "handleEval", { enumerable: true, get: function () { return data_handlers_1.handleEval; } });
// Map handlers
var map_handlers_1 = require("./map-handlers");
Object.defineProperty(exports, "handleQueryMap", { enumerable: true, get: function () { return map_handlers_1.handleQueryMap; } });
Object.defineProperty(exports, "handleGenerateMap", { enumerable: true, get: function () { return map_handlers_1.handleGenerateMap; } });
Object.defineProperty(exports, "handleGetMapStatus", { enumerable: true, get: function () { return map_handlers_1.handleGetMapStatus; } });
// Utility handlers
var utility_handlers_1 = require("./utility-handlers");
Object.defineProperty(exports, "handleScroll", { enumerable: true, get: function () { return utility_handlers_1.handleScroll; } });
Object.defineProperty(exports, "handleWait", { enumerable: true, get: function () { return utility_handlers_1.handleWait; } });
Object.defineProperty(exports, "handleConsole", { enumerable: true, get: function () { return utility_handlers_1.handleConsole; } });
Object.defineProperty(exports, "handleStatus", { enumerable: true, get: function () { return utility_handlers_1.handleStatus; } });
//# sourceMappingURL=index.js.map