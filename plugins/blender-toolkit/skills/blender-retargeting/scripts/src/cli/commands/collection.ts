/**
 * Collection CLI Commands
 * 컬렉션 생성, 오브젝트 추가/제거 등의 CLI 명령
 */

import { Command } from 'commander';
import { BlenderClient } from '../../blender/client';

export function registerCollectionCommands(program: Command): void {
  const collectionGroup = program
    .command('collection')
    .description('Collection management commands');

  // Create collection
  collectionGroup
    .command('create')
    .description('Create a new collection')
    .requiredOption('--name <name>', 'Collection name')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Collection.create', {
          name: options.name
        });
        console.log('✅ Collection created:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // List collections
  collectionGroup
    .command('list')
    .description('List all collections')
    .action(async () => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Collection.list', {});
        console.log('📋 Collections:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Add object to collection
  collectionGroup
    .command('add-object')
    .description('Add object to collection')
    .requiredOption('--object <name>', 'Object name')
    .requiredOption('--collection <name>', 'Collection name')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Collection.addObject', {
          objectName: options.object,
          collectionName: options.collection
        });
        console.log('✅ Object added to collection:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Remove object from collection
  collectionGroup
    .command('remove-object')
    .description('Remove object from collection')
    .requiredOption('--object <name>', 'Object name')
    .requiredOption('--collection <name>', 'Collection name')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Collection.removeObject', {
          objectName: options.object,
          collectionName: options.collection
        });
        console.log('✅ Object removed from collection:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  // Delete collection
  collectionGroup
    .command('delete')
    .description('Delete a collection')
    .requiredOption('--name <name>', 'Collection name')
    .action(async (options) => {
      const client = new BlenderClient();
      try {
        await client.connect();
        const result = await client.sendCommand('Collection.delete', {
          name: options.name
        });
        console.log('✅ Collection deleted:', JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      } finally {
        client.close();
      }
    });
}
