import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerCookiesCommands(program: Command) {
  // Get cookies command
  program
    .command('cookies')
    .description('Retrieve all cookies from the current page (or navigate to a URL first with -u)')
    .option('-u, --url <url>', 'URL to navigate to (optional, uses current page if not specified)')
    .option('--headless', 'Run in headless mode', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(options.headless);
      try {
        // Try to connect to existing browser first, launch new one if failed
        try {
          await browser.connect();
        } catch {
          await browser.launch();
        }
        // Only navigate if URL is provided
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.getCookies(browser);
        console.log(`Found ${result.count} cookies:`);
        console.log(JSON.stringify(result.cookies, null, 2));
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Set cookie
  program
    .command('set-cookie')
    .description('Set a cookie with specified name and value (supports domain, path, secure, and httpOnly options)')
    .requiredOption('-n, --name <name>', 'Cookie name')
    .requiredOption('-v, --value <value>', 'Cookie value')
    .option('-d, --domain <domain>', 'Cookie domain')
    .option('-p, --path <path>', 'Cookie path', '/')
    .option('--secure', 'Secure cookie', false)
    .option('--http-only', 'HTTP only cookie', false)
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const result = await actions.setCookie(
          browser,
          options.name,
          options.value,
          options.domain,
          options.path,
          options.secure,
          options.httpOnly
        );
        console.log('Cookie set:', result.cookie);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });

  // Delete cookies
  program
    .command('delete-cookies')
    .description('Delete cookies by name (deletes all cookies if no name is specified with -n)')
    .option('-n, --name <name>', 'Cookie name to delete (deletes all if not specified)')
    .option('-u, --url <url>', 'Navigate to URL first')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        if (options.url) {
          await actions.navigate(browser, options.url);
          await actions.waitForLoad(browser);
        }
        const result = await actions.deleteCookies(browser, options.name);
        console.log(result.message);
        console.log('Browser remains open. Use "close" command to close it.');
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
