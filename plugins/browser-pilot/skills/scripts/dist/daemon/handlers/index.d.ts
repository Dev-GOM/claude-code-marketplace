/**
 * Unified exports for all Browser Pilot Daemon handlers
 */
export type { HandlerContext } from './navigation-handlers';
export { handleNavigate, handleBack, handleForward, handleReload } from './navigation-handlers';
export { handleClick, handleFill, handleHover, handlePress, handleType } from './interaction-handlers';
export { handleScreenshot, handlePdf, handleSetViewport } from './capture-handlers';
export { handleExtract, handleContent, handleFind, handleEval } from './data-handlers';
export { handleQueryMap, handleGenerateMap, handleGetMapStatus } from './map-handlers';
export { handleScroll, handleWait, handleConsole, handleStatus } from './utility-handlers';
//# sourceMappingURL=index.d.ts.map