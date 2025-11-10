/**
 * Modifier Commands
 * Blender 모디파이어 명령
 */

import { Command } from 'commander';
import { BlenderClient } from '../../blender/client';
import { logger } from '../../utils/logger';

const client = new BlenderClient();

export function registerModifierCommands(program: Command) {
  // Add Modifier
  program
    .command('add-modifier')
    .description('Add a modifier to an object')
    .requiredOption('-n, --name <string>', 'Object name')
    .requiredOption('-t, --type <string>', 'Modifier type (SUBSURF, MIRROR, ARRAY, BEVEL, etc.)')
    .option('--mod-name <string>', 'Modifier name')
    .option('--levels <number>', 'Subdivision levels (for SUBSURF)', parseInt)
    .option('--render-levels <number>', 'Render levels (for SUBSURF)', parseInt)
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const properties: any = {};

        if (options.levels !== undefined) {
          properties.levels = options.levels;
        }

        if (options.renderLevels !== undefined) {
          properties.render_levels = options.renderLevels;
        }

        const result = await client.sendCommand('Modifier.add', {
          objectName: options.name,
          modifierType: options.type,
          name: options.modName,
          properties
        });

        console.log('✅ Modifier added successfully:');
        console.log(`   Object: ${result.object}`);
        console.log(`   Modifier: ${result.modifier} (${result.type})`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to add modifier:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Apply Modifier
  program
    .command('apply-modifier')
    .description('Apply a modifier to an object')
    .requiredOption('-n, --name <string>', 'Object name')
    .requiredOption('-m, --modifier <string>', 'Modifier name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result = await client.sendCommand('Modifier.apply', {
          objectName: options.name,
          modifierName: options.modifier
        });

        console.log(`✅ ${result.message}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to apply modifier:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
