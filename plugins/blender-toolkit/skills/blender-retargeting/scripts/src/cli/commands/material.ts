/**
 * Material CLI Commands
 * 머티리얼 생성, 할당, 속성 설정 등의 CLI 명령
 */

import { Command } from 'commander';
import { BlenderClient } from '../../blender/client';

export function registerMaterialCommands(program: Command): void {
  const materialGroup = program
    .command('material')
    .description('Material creation and management commands');

  // Create material
  materialGroup
    .command('create')
    .description('Create a new material')
    .requiredOption('--name <name>', 'Material name')
    .option('--no-nodes', 'Disable node-based material (default: enabled)')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.create', {
          name: options.name,
          useNodes: options.nodes
        });
        console.log('✅ Material created:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // List materials
  materialGroup
    .command('list')
    .description('List all materials')
    .action(async () => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.list', {});
        console.log('📋 Materials:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Delete material
  materialGroup
    .command('delete')
    .description('Delete a material')
    .requiredOption('--name <name>', 'Material name')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.delete', {
          name: options.name
        });
        console.log('✅ Material deleted:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Assign material to object
  materialGroup
    .command('assign')
    .description('Assign material to object')
    .requiredOption('--object <name>', 'Object name')
    .requiredOption('--material <name>', 'Material name')
    .option('--slot <index>', 'Material slot index', '0')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.assign', {
          objectName: options.object,
          materialName: options.material,
          slotIndex: parseInt(options.slot)
        });
        console.log('✅ Material assigned:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // List object materials
  materialGroup
    .command('list-object')
    .description('List materials of an object')
    .requiredOption('--object <name>', 'Object name')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.listObjectMaterials', {
          objectName: options.object
        });
        console.log('📋 Object materials:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Set base color
  materialGroup
    .command('set-color')
    .description('Set material base color')
    .requiredOption('--material <name>', 'Material name')
    .requiredOption('--r <value>', 'Red (0-1)', parseFloat)
    .requiredOption('--g <value>', 'Green (0-1)', parseFloat)
    .requiredOption('--b <value>', 'Blue (0-1)', parseFloat)
    .option('--a <value>', 'Alpha (0-1)', parseFloat, 1.0)
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.setBaseColor', {
          materialName: options.material,
          color: [options.r, options.g, options.b, options.a]
        });
        console.log('✅ Base color set:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Set metallic
  materialGroup
    .command('set-metallic')
    .description('Set material metallic value')
    .requiredOption('--material <name>', 'Material name')
    .requiredOption('--value <value>', 'Metallic value (0-1)', parseFloat)
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.setMetallic', {
          materialName: options.material,
          metallic: options.value
        });
        console.log('✅ Metallic set:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Set roughness
  materialGroup
    .command('set-roughness')
    .description('Set material roughness value')
    .requiredOption('--material <name>', 'Material name')
    .requiredOption('--value <value>', 'Roughness value (0-1)', parseFloat)
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.setRoughness', {
          materialName: options.material,
          roughness: options.value
        });
        console.log('✅ Roughness set:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Set emission
  materialGroup
    .command('set-emission')
    .description('Set material emission')
    .requiredOption('--material <name>', 'Material name')
    .requiredOption('--r <value>', 'Red (0-1)', parseFloat)
    .requiredOption('--g <value>', 'Green (0-1)', parseFloat)
    .requiredOption('--b <value>', 'Blue (0-1)', parseFloat)
    .option('--strength <value>', 'Emission strength', parseFloat, 1.0)
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.setEmission', {
          materialName: options.material,
          color: [options.r, options.g, options.b, 1.0],
          strength: options.strength
        });
        console.log('✅ Emission set:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Get material properties
  materialGroup
    .command('get-properties')
    .description('Get material properties')
    .requiredOption('--material <name>', 'Material name')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Material.getProperties', {
          materialName: options.material
        });
        console.log('📋 Material properties:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });
}
