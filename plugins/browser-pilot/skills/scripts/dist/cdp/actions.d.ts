/**
 * Core CDP actions for browser automation.
 *
 * This file serves as the main index for all action modules.
 * Modularized for better organization and maintainability.
 */
export type { ActionResult } from './actions/helpers';
export { sleep, checkConsoleErrors, ensureOutputPath } from './actions/helpers';
export * from './actions/navigation';
export * from './actions/interaction';
export * from './actions/capture';
export * from './actions/data';
export * from './actions/cookies';
export * from './actions/tabs';
export * from './actions/forms';
export * from './actions/input';
export * from './actions/scroll';
export * from './actions/wait';
export * from './actions/debugging';
export * from './actions/emulation';
export * from './actions/dialogs';
export * from './actions/network';
//# sourceMappingURL=actions.d.ts.map