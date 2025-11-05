import { Command } from 'commander';
import { ChromeBrowser } from '../../cdp/browser';
import * as actions from '../../cdp/actions';

export function registerDialogsCommands(program: Command) {
  // Dialog response command
  program
    .command('dialog')
    .description('Respond to JavaScript dialogs (alert/confirm/prompt) by accepting, dismissing, or entering text for prompts')
    .option('-a, --accept', 'Accept dialog (default: true)', true)
    .option('-d, --dismiss', 'Dismiss dialog')
    .option('-t, --text <text>', 'Text for prompt dialog')
    .action(async (options) => {
      const browser = new ChromeBrowser(false);
      try {
        await browser.connect();
        const accept = !options.dismiss;
        const result = await actions.respondToDialog(browser, accept, options.text);
        console.log('Dialog', result.accept ? 'accepted' : 'dismissed');
        if (result.promptText) {
          console.log('Prompt text:', result.promptText);
        }
        process.exit(0);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    });
}
