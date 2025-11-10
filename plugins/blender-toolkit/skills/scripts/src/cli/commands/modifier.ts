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

        const result: any = await client.sendCommand('Modifier.add', {
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

        const result: any = await client.sendCommand('Modifier.apply', {
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

  // List Modifiers
  program
    .command('list-modifiers')
    .description('List all modifiers on an object')
    .requiredOption('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Modifier.list', {
          objectName: options.name
        });

        console.log('📋 Modifiers:');
        if (result.length === 0) {
          console.log('   No modifiers found');
        } else {
          result.forEach((mod: any) => {
            console.log(`   - ${mod.name} (${mod.type})`);
            console.log(`     Viewport: ${mod.show_viewport}, Render: ${mod.show_render}`);
            if (mod.levels !== undefined) {
              console.log(`     Levels: ${mod.levels}, Render Levels: ${mod.render_levels}`);
            }
          });
        }

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to list modifiers:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Remove Modifier
  program
    .command('remove-modifier')
    .description('Remove a modifier from an object')
    .requiredOption('-n, --name <string>', 'Object name')
    .requiredOption('-m, --modifier <string>', 'Modifier name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Modifier.remove', {
          objectName: options.name,
          modifierName: options.modifier
        });

        console.log(`✅ ${result.message}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to remove modifier:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Toggle Modifier
  program
    .command('toggle-modifier')
    .description('Toggle modifier visibility')
    .requiredOption('-n, --name <string>', 'Object name')
    .requiredOption('-m, --modifier <string>', 'Modifier name')
    .option('--viewport <boolean>', 'Viewport visibility (true/false)')
    .option('--render <boolean>', 'Render visibility (true/false)')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const params: any = {
          objectName: options.name,
          modifierName: options.modifier
        };

        if (options.viewport !== undefined) {
          params.viewport = options.viewport === 'true';
        }
        if (options.render !== undefined) {
          params.render = options.render === 'true';
        }

        const result: any = await client.sendCommand('Modifier.toggle', params);

        console.log('✅ Modifier toggled:');
        console.log(`   Viewport: ${result.show_viewport}`);
        console.log(`   Render: ${result.show_render}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to toggle modifier:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Modify Modifier Properties
  program
    .command('modify-modifier')
    .description('Modify modifier properties')
    .requiredOption('-n, --name <string>', 'Object name')
    .requiredOption('-m, --modifier <string>', 'Modifier name')
    .option('--levels <number>', 'Subdivision levels', parseInt)
    .option('--render-levels <number>', 'Render levels', parseInt)
    .option('--width <number>', 'Bevel width', parseFloat)
    .option('--segments <number>', 'Bevel segments', parseInt)
    .option('--count <number>', 'Array count', parseInt)
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const properties: any = {};

        if (options.levels !== undefined) properties.levels = options.levels;
        if (options.renderLevels !== undefined) properties.render_levels = options.renderLevels;
        if (options.width !== undefined) properties.width = options.width;
        if (options.segments !== undefined) properties.segments = options.segments;
        if (options.count !== undefined) properties.count = options.count;

        const result: any = await client.sendCommand('Modifier.modify', {
          objectName: options.name,
          modifierName: options.modifier,
          properties
        });

        console.log('✅ Modifier properties updated:');
        console.log(`   Updated properties: ${result.updated_properties ? Object.keys(result.updated_properties).join(', ') : 'none'}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to modify modifier properties:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Get Modifier Info
  program
    .command('get-modifier-info')
    .description('Get detailed modifier information')
    .requiredOption('-n, --name <string>', 'Object name')
    .requiredOption('-m, --modifier <string>', 'Modifier name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Modifier.getInfo', {
          objectName: options.name,
          modifierName: options.modifier
        });

        console.log('📋 Modifier Info:');
        console.log(JSON.stringify(result, null, 2));

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to get modifier info:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Reorder Modifier
  program
    .command('reorder-modifier')
    .description('Reorder modifier in stack')
    .requiredOption('-n, --name <string>', 'Object name')
    .requiredOption('-m, --modifier <string>', 'Modifier name')
    .requiredOption('-d, --direction <string>', 'Direction (UP or DOWN)')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Modifier.reorder', {
          objectName: options.name,
          modifierName: options.modifier,
          direction: options.direction.toUpperCase()
        });

        console.log(`✅ Modifier reordered`);
        console.log(`   New order: ${result.new_order.join(' > ')}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to reorder modifier:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
