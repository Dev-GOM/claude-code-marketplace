/**
 * Material command
 *
 * Material property manipulation commands
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Register Material command
 */
export function registerMaterialCommand(program: Command): void {
  const materialCmd = program
    .command('material')
    .description('Material property manipulation commands');

  // List materials on a GameObject
  materialCmd
    .command('list')
    .description('List all materials on a GameObject')
    .argument('<gameObject>', 'GameObject name or path')
    .option('--shared', 'Use shared materials instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface MaterialInfo {
          index: number;
          name: string;
          shader: string;
        }

        interface ListResult {
          success: boolean;
          gameObject: string;
          count: number;
          materials: MaterialInfo[];
        }

        const result = await client.sendRequest<ListResult>(COMMANDS.MATERIAL_LIST, {
          gameObject,
          useShared: options.shared || false,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.count} material(s) on ${result.gameObject}:`);
          for (const mat of result.materials) {
            logger.info(`  [${mat.index}] ${mat.name} (${mat.shader})`);
          }
        }
      } catch (error) {
        logger.error('Failed to list materials', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Get material property
  materialCmd
    .command('get')
    .description('Get a material property value')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<property>', 'Property name (e.g., _Metallic, _Smoothness)')
    .option('--index <n>', 'Material index (default: 0)', '0')
    .option('--shared', 'Use shared material instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, property, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface PropertyResult {
          success: boolean;
          gameObject: string;
          material: string;
          propertyName: string;
          propertyType: string;
          value: unknown;
        }

        const result = await client.sendRequest<PropertyResult>(COMMANDS.MATERIAL_GET_PROPERTY, {
          gameObject,
          propertyName: property,
          materialIndex: parseInt(options.index, 10),
          useShared: options.shared || false,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.material}.${result.propertyName} (${result.propertyType}):`);
          logger.info(`  Value: ${JSON.stringify(result.value)}`);
        }
      } catch (error) {
        logger.error('Failed to get material property', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Set material property
  materialCmd
    .command('set')
    .description('Set a material property value (float or int)')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<property>', 'Property name (e.g., _Metallic, _Smoothness)')
    .argument('<value>', 'New value (number)')
    .option('--index <n>', 'Material index (default: 0)', '0')
    .option('--shared', 'Use shared material instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, property, value, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface SetResult {
          success: boolean;
          gameObject: string;
          material: string;
          propertyName: string;
          propertyType: string;
          value: number;
        }

        const result = await client.sendRequest<SetResult>(COMMANDS.MATERIAL_SET_PROPERTY, {
          gameObject,
          propertyName: property,
          value: parseFloat(value),
          materialIndex: parseInt(options.index, 10),
          useShared: options.shared || false,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Set ${result.material}.${result.propertyName} = ${result.value}`);
        }
      } catch (error) {
        logger.error('Failed to set material property', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Get material color
  materialCmd
    .command('get-color')
    .alias('color')
    .description('Get a material color property')
    .argument('<gameObject>', 'GameObject name or path')
    .option('--property <name>', 'Color property name (default: _Color)', '_Color')
    .option('--index <n>', 'Material index (default: 0)', '0')
    .option('--shared', 'Use shared material instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface ColorResult {
          success: boolean;
          gameObject: string;
          material: string;
          propertyName: string;
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
            hex: string;
          };
        }

        const result = await client.sendRequest<ColorResult>(COMMANDS.MATERIAL_GET_COLOR, {
          gameObject,
          propertyName: options.property,
          materialIndex: parseInt(options.index, 10),
          useShared: options.shared || false,
        });

        if (options.json) {
          outputJson(result);
        } else {
          const c = result.color;
          logger.info(`✓ ${result.material}.${result.propertyName}:`);
          logger.info(`  RGBA: (${c.r.toFixed(3)}, ${c.g.toFixed(3)}, ${c.b.toFixed(3)}, ${c.a.toFixed(3)})`);
          logger.info(`  Hex:  #${c.hex}`);
        }
      } catch (error) {
        logger.error('Failed to get material color', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Set material color
  materialCmd
    .command('set-color')
    .description('Set a material color property')
    .argument('<gameObject>', 'GameObject name or path')
    .option('--property <name>', 'Color property name (default: _Color)', '_Color')
    .option('--r <value>', 'Red component (0-1)')
    .option('--g <value>', 'Green component (0-1)')
    .option('--b <value>', 'Blue component (0-1)')
    .option('--a <value>', 'Alpha component (0-1)', '1')
    .option('--hex <color>', 'Hex color (e.g., #FF0000 or FF0000)')
    .option('--index <n>', 'Material index (default: 0)', '0')
    .option('--shared', 'Use shared material instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        // Validate input
        if (!options.hex && options.r === undefined && options.g === undefined && options.b === undefined) {
          logger.error('Please provide either --hex or --r, --g, --b values');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface SetColorResult {
          success: boolean;
          gameObject: string;
          material: string;
          propertyName: string;
          color: {
            r: number;
            g: number;
            b: number;
            a: number;
            hex: string;
          };
        }

        const params: Record<string, unknown> = {
          gameObject,
          propertyName: options.property,
          materialIndex: parseInt(options.index, 10),
          useShared: options.shared || false,
        };

        if (options.hex) {
          params.hex = options.hex;
        } else {
          if (options.r !== undefined) params.r = parseFloat(options.r);
          if (options.g !== undefined) params.g = parseFloat(options.g);
          if (options.b !== undefined) params.b = parseFloat(options.b);
          if (options.a !== undefined) params.a = parseFloat(options.a);
        }

        const result = await client.sendRequest<SetColorResult>(COMMANDS.MATERIAL_SET_COLOR, params);

        if (options.json) {
          outputJson(result);
        } else {
          const c = result.color;
          logger.info(`✓ Set ${result.material}.${result.propertyName}:`);
          logger.info(`  RGBA: (${c.r.toFixed(3)}, ${c.g.toFixed(3)}, ${c.b.toFixed(3)}, ${c.a.toFixed(3)})`);
          logger.info(`  Hex:  #${c.hex}`);
        }
      } catch (error) {
        logger.error('Failed to set material color', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Get shader
  materialCmd
    .command('get-shader')
    .alias('shader')
    .description('Get the shader used by a material')
    .argument('<gameObject>', 'GameObject name or path')
    .option('--index <n>', 'Material index (default: 0)', '0')
    .option('--shared', 'Use shared material instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface ShaderResult {
          success: boolean;
          gameObject: string;
          material: string;
          shader: {
            name: string;
            propertyCount: number;
          } | null;
        }

        const result = await client.sendRequest<ShaderResult>(COMMANDS.MATERIAL_GET_SHADER, {
          gameObject,
          materialIndex: parseInt(options.index, 10),
          useShared: options.shared || false,
        });

        if (options.json) {
          outputJson(result);
        } else {
          if (result.shader) {
            logger.info(`✓ ${result.material} shader:`);
            logger.info(`  Name: ${result.shader.name}`);
            logger.info(`  Properties: ${result.shader.propertyCount}`);
          } else {
            logger.info(`✓ ${result.material} has no shader`);
          }
        }
      } catch (error) {
        logger.error('Failed to get shader', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Set shader
  materialCmd
    .command('set-shader')
    .description('Set the shader used by a material')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<shaderName>', 'Shader name (e.g., Standard, Unlit/Color)')
    .option('--index <n>', 'Material index (default: 0)', '0')
    .option('--shared', 'Use shared material instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, shaderName, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface SetShaderResult {
          success: boolean;
          gameObject: string;
          material: string;
          shader: string;
        }

        const result = await client.sendRequest<SetShaderResult>(COMMANDS.MATERIAL_SET_SHADER, {
          gameObject,
          shaderName,
          materialIndex: parseInt(options.index, 10),
          useShared: options.shared || false,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Set ${result.material} shader to: ${result.shader}`);
        }
      } catch (error) {
        logger.error('Failed to set shader', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Get texture
  materialCmd
    .command('get-texture')
    .alias('texture')
    .description('Get a material texture property')
    .argument('<gameObject>', 'GameObject name or path')
    .option('--property <name>', 'Texture property name (default: _MainTex)', '_MainTex')
    .option('--index <n>', 'Material index (default: 0)', '0')
    .option('--shared', 'Use shared material instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface TextureResult {
          success: boolean;
          gameObject: string;
          material: string;
          propertyName: string;
          texture: {
            name: string;
            type: string;
            width: number;
            height: number;
          } | null;
          scale: { x: number; y: number };
          offset: { x: number; y: number };
        }

        const result = await client.sendRequest<TextureResult>(COMMANDS.MATERIAL_GET_TEXTURE, {
          gameObject,
          propertyName: options.property,
          materialIndex: parseInt(options.index, 10),
          useShared: options.shared || false,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.material}.${result.propertyName}:`);
          if (result.texture) {
            logger.info(`  Texture: ${result.texture.name} (${result.texture.type})`);
            logger.info(`  Size: ${result.texture.width}x${result.texture.height}`);
          } else {
            logger.info('  Texture: None');
          }
          logger.info(`  Scale: (${result.scale.x}, ${result.scale.y})`);
          logger.info(`  Offset: (${result.offset.x}, ${result.offset.y})`);
        }
      } catch (error) {
        logger.error('Failed to get texture', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });

  // Set texture
  materialCmd
    .command('set-texture')
    .description('Set a material texture property')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<texturePath>', 'Texture asset path (e.g., Assets/Textures/MyTex.png)')
    .option('--property <name>', 'Texture property name (default: _MainTex)', '_MainTex')
    .option('--scale-x <value>', 'Texture scale X')
    .option('--scale-y <value>', 'Texture scale Y')
    .option('--offset-x <value>', 'Texture offset X')
    .option('--offset-y <value>', 'Texture offset Y')
    .option('--index <n>', 'Material index (default: 0)', '0')
    .option('--shared', 'Use shared material instead of instanced')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, texturePath, options) => {
      let client = null;
      try {
        const projectRoot = config.getProjectRoot();
        const port = program.opts().port || config.getUnityPort(projectRoot);

        if (!port) {
          logger.error('Unity server not running. Start Unity Editor with WebSocket server enabled.');
          process.exit(1);
        }

        client = createUnityClient(port);
        await client.connect();

        interface SetTextureResult {
          success: boolean;
          gameObject: string;
          material: string;
          propertyName: string;
          texture: string;
        }

        const params: Record<string, unknown> = {
          gameObject,
          texturePath,
          propertyName: options.property,
          materialIndex: parseInt(options.index, 10),
          useShared: options.shared || false,
        };

        if (options.scaleX !== undefined) params.scaleX = parseFloat(options.scaleX);
        if (options.scaleY !== undefined) params.scaleY = parseFloat(options.scaleY);
        if (options.offsetX !== undefined) params.offsetX = parseFloat(options.offsetX);
        if (options.offsetY !== undefined) params.offsetY = parseFloat(options.offsetY);

        const result = await client.sendRequest<SetTextureResult>(COMMANDS.MATERIAL_SET_TEXTURE, params);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Set ${result.material}.${result.propertyName} to: ${result.texture}`);
        }
      } catch (error) {
        logger.error('Failed to set texture', error);
        process.exit(1);
      } finally {
        if (client) {
          try {
            client.disconnect();
          } catch (disconnectError) {
            logger.debug(`Error during disconnect: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
          }
        }
      }
    });
}
