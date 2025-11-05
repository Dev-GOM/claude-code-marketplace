"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScrollCommands = registerScrollCommands;
const daemon_helper_1 = require("../daemon-helper");
function registerScrollCommands(program) {
    // Scroll command
    program
        .command('scroll')
        .description('Scroll page or element')
        .requiredOption('-x, --x <pixels>', 'Horizontal scroll position', parseInt)
        .requiredOption('-y, --y <pixels>', 'Vertical scroll position', parseInt)
        .option('-s, --selector <selector>', 'CSS selector to scroll (optional)')
        .action(async (options) => {
        try {
            const response = await (0, daemon_helper_1.executeViaDaemon)('scroll', {
                x: options.x,
                y: options.y,
                selector: options.selector
            });
            if (response.success) {
                const data = response.data;
                console.log('Scrolled to:', data.position);
                console.log('Browser will stay open. Use "daemon-stop" to close it.');
            }
            else {
                console.error('Scroll failed:', response.error);
            }
            process.exit(response.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=scroll.js.map