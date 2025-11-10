"use strict";
/**
 * Daemon management commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDaemonCommands = registerDaemonCommands;
const manager_1 = require("../../daemon/manager");
function registerDaemonCommands(program) {
    // Start daemon
    program
        .command('daemon-start')
        .description('Start Blender Toolkit daemon (persistent background service)')
        .option('-q, --quiet', 'Suppress output')
        .action(async (options) => {
        const manager = new manager_1.DaemonManager();
        try {
            await manager.start({ verbose: !options.quiet });
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Stop daemon
    program
        .command('daemon-stop')
        .description('Stop Blender Toolkit daemon')
        .option('-q, --quiet', 'Suppress output')
        .option('-f, --force', 'Force kill the daemon')
        .action(async (options) => {
        const manager = new manager_1.DaemonManager();
        try {
            await manager.stop({ verbose: !options.quiet, force: options.force });
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Restart daemon
    program
        .command('daemon-restart')
        .description('Restart Blender Toolkit daemon')
        .option('-q, --quiet', 'Suppress output')
        .action(async (options) => {
        const manager = new manager_1.DaemonManager();
        try {
            await manager.restart({ verbose: !options.quiet });
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Daemon status
    program
        .command('daemon-status')
        .description('Check daemon status and Blender connection info')
        .option('-q, --quiet', 'Suppress output')
        .action(async (options) => {
        const manager = new manager_1.DaemonManager();
        try {
            const state = await manager.getStatus({ verbose: !options.quiet });
            process.exit(state ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=daemon.js.map