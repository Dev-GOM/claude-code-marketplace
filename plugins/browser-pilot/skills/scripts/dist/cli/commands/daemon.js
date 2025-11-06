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
        .description('Start Browser Pilot daemon (persistent background browser)')
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
        .description('Stop Browser Pilot daemon and close browser')
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
        .description('Restart Browser Pilot daemon')
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
        .description('Check daemon status and browser info')
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
    // Query interaction map
    program
        .command('daemon-query-map')
        .description('Query interaction map by text, type, or ID')
        .option('-t, --text <text>', 'Search by text content')
        .option('-T, --type <type>', 'Filter by element type (button, link, input, etc)')
        .option('-i, --index <number>', 'Select nth match (1-based)', parseInt)
        .option('--id <id>', 'Direct ID lookup')
        .option('-v, --viewport-only', 'Only visible elements in viewport')
        .option('-q, --quiet', 'Suppress output')
        .action(async (options) => {
        const manager = new manager_1.DaemonManager();
        try {
            const params = {};
            if (options.text)
                params.text = options.text;
            if (options.type)
                params.type = options.type;
            if (options.index)
                params.index = options.index;
            if (options.id)
                params.id = options.id;
            if (options.viewportOnly)
                params.viewportOnly = true;
            await manager.queryMap(params, { verbose: !options.quiet });
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Generate interaction map
    program
        .command('daemon-generate-map')
        .description('Generate interaction map for current page (use -f to force)')
        .option('-f, --force', 'Force regeneration (ignore cache)')
        .option('-q, --quiet', 'Suppress output')
        .action(async (options) => {
        const manager = new manager_1.DaemonManager();
        try {
            const params = {};
            if (options.force)
                params.force = true;
            await manager.generateMap(params, { verbose: !options.quiet });
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
    // Get map status
    program
        .command('daemon-map-status')
        .description('Get interaction map status (URL, element count, cache)')
        .option('-q, --quiet', 'Suppress output')
        .action(async (options) => {
        const manager = new manager_1.DaemonManager();
        try {
            await manager.getMapStatus({ verbose: !options.quiet });
            process.exit(0);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=daemon.js.map