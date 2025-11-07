/**
 * Unified exports for all Browser Pilot Daemon handlers
 */

// Export handler context type
export type { HandlerContext } from './navigation-handlers';

// Navigation handlers
export {
  handleNavigate,
  handleBack,
  handleForward,
  handleReload
} from './navigation-handlers';

// Interaction handlers
export {
  handleClick,
  handleFill,
  handleHover,
  handlePress,
  handleType
} from './interaction-handlers';

// Capture handlers
export {
  handleScreenshot,
  handlePdf,
  handleSetViewport,
  handleGetViewport,
  handleGetScreenInfo
} from './capture-handlers';

// Data handlers
export {
  handleExtract,
  handleContent,
  handleFind,
  handleEval
} from './data-handlers';

// Map handlers
export {
  handleQueryMap,
  handleGenerateMap,
  handleGetMapStatus
} from './map-handlers';

// Utility handlers
export {
  handleScroll,
  handleWait,
  handleConsole,
  handleStatus
} from './utility-handlers';
