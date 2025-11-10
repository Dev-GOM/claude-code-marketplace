/**
 * Object Commands
 * Blender 오브젝트 조작 명령
 */

import { Command } from 'commander';
import { BlenderClient } from '../../blender/client';
import { logger } from '../../utils/logger';

const client = new BlenderClient();

export function registerObjectCommands(program: Command) {
  // List Objects
  program
    .command('list-objects')
    .description('List all objects in the scene')
    .option('-t, --type <string>', 'Filter by object type (MESH, ARMATURE, CAMERA, LIGHT)')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const objects: any = await client.sendCommand('Object.list', {
          type: options.type
        });

        if (objects.length === 0) {
          console.log('No objects found in the scene.');
        } else {
          console.log(`✅ Found ${objects.length} object(s):\n`);

          objects.forEach((obj: any) => {
            console.log(`📦 ${obj.name} (${obj.type})`);
            console.log(`   Location: [${obj.location.map((n: number) => n.toFixed(2)).join(', ')}]`);
            console.log(`   Rotation: [${obj.rotation.map((n: number) => n.toFixed(2)).join(', ')}]`);
            console.log(`   Scale: [${obj.scale.map((n: number) => n.toFixed(2)).join(', ')}]`);
            console.log('');
          });
        }

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to list objects:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Transform Object
  program
    .command('transform')
    .description('Transform an object (move, rotate, scale)')
    .requiredOption('-n, --name <string>', 'Object name')
    .option('--loc-x <number>', 'X location', parseFloat)
    .option('--loc-y <number>', 'Y location', parseFloat)
    .option('--loc-z <number>', 'Z location', parseFloat)
    .option('--rot-x <number>', 'X rotation (radians)', parseFloat)
    .option('--rot-y <number>', 'Y rotation (radians)', parseFloat)
    .option('--rot-z <number>', 'Z rotation (radians)', parseFloat)
    .option('--scale-x <number>', 'X scale', parseFloat)
    .option('--scale-y <number>', 'Y scale', parseFloat)
    .option('--scale-z <number>', 'Z scale', parseFloat)
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const params: any = { name: options.name };

        if (options.locX !== undefined || options.locY !== undefined || options.locZ !== undefined) {
          params.location = [
            options.locX ?? 0,
            options.locY ?? 0,
            options.locZ ?? 0
          ];
        }

        if (options.rotX !== undefined || options.rotY !== undefined || options.rotZ !== undefined) {
          params.rotation = [
            options.rotX ?? 0,
            options.rotY ?? 0,
            options.rotZ ?? 0
          ];
        }

        if (options.scaleX !== undefined || options.scaleY !== undefined || options.scaleZ !== undefined) {
          params.scale = [
            options.scaleX ?? 1,
            options.scaleY ?? 1,
            options.scaleZ ?? 1
          ];
        }

        const result: any = await client.sendCommand('Object.transform', params);

        console.log('✅ Object transformed successfully:');
        console.log(`   Name: ${result.name}`);
        console.log(`   Location: [${result.location.map((n: number) => n.toFixed(3)).join(', ')}]`);
        console.log(`   Rotation: [${result.rotation.map((n: number) => n.toFixed(3)).join(', ')}]`);
        console.log(`   Scale: [${result.scale.map((n: number) => n.toFixed(3)).join(', ')}]`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to transform object:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Duplicate Object
  program
    .command('duplicate')
    .description('Duplicate an object')
    .requiredOption('-n, --name <string>', 'Source object name')
    .option('--new-name <string>', 'New object name')
    .option('-x, --x <number>', 'X position for duplicate', parseFloat)
    .option('-y, --y <number>', 'Y position for duplicate', parseFloat)
    .option('-z, --z <number>', 'Z position for duplicate', parseFloat)
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const params: any = { name: options.name };

        if (options.newName) {
          params.newName = options.newName;
        }

        if (options.x !== undefined || options.y !== undefined || options.z !== undefined) {
          params.location = [
            options.x ?? 0,
            options.y ?? 0,
            options.z ?? 0
          ];
        }

        const result: any = await client.sendCommand('Object.duplicate', params);

        console.log('✅ Object duplicated successfully:');
        console.log(`   New Name: ${result.name}`);
        console.log(`   Type: ${result.type}`);
        console.log(`   Location: [${result.location.map((n: number) => n.toFixed(3)).join(', ')}]`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to duplicate object:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Delete Object
  program
    .command('delete')
    .description('Delete an object')
    .requiredOption('-n, --name <string>', 'Object name')
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .action(async (options) => {
      try {
        await client.connect(options.port);

        const result: any = await client.sendCommand('Object.delete', {
          name: options.name
        });

        console.log(`✅ ${result.message}`);

        await client.disconnect();
      } catch (error) {
        logger.error('Failed to delete object:', error);
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
