import { Command } from 'commander';
import { executeViaDaemon } from '../daemon-helper';

export function registerNavigationCommands(program: Command) {
  // Navigate command
  program
    .command('navigate')
    .description('Navigate to a URL (requires -u/--url)')
    .requiredOption('-u, --url <url>', 'URL to navigate to')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      try {
        const response = await executeViaDaemon('navigate', { url: options.url });

        if (response.success) {
          console.log('Navigated to:', options.url);
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Navigation failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Go back command
  program
    .command('back')
    .description('Navigate back in browser history')
    .action(async () => {
      try {
        const response = await executeViaDaemon('back', {});

        if (response.success) {
          const data = response.data as { success: boolean; url?: string; error?: string };
          if (data.success) {
            console.log('Navigated back to:', data.url);
          } else {
            console.log(data.error);
          }
        } else {
          console.error('Back navigation failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Go forward command
  program
    .command('forward')
    .description('Navigate forward in history')
    .action(async () => {
      try {
        const response = await executeViaDaemon('forward', {});

        if (response.success) {
          const data = response.data as { success: boolean; url?: string; error?: string };
          if (data.success) {
            console.log('Navigated forward to:', data.url);
          } else {
            console.log(data.error);
          }
        } else {
          console.error('Forward navigation failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Reload command
  program
    .command('reload')
    .description('Reload the current page')
    .option('--hard', 'Hard reload (ignore cache)', false)
    .action(async (options) => {
      try {
        const response = await executeViaDaemon('reload', { hard: options.hard });

        if (response.success) {
          const data = response.data as { success: boolean; hardReload: boolean };
          console.log('Page reloaded (hard:', data.hardReload, ')');
          console.log('Browser will stay open. Use "daemon-stop" to close it.');
        } else {
          console.error('Reload failed:', response.error);
        }

        process.exit(response.success ? 0 : 1);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
