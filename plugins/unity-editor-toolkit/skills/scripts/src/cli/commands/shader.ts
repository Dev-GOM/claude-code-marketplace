/**
 * Shader CLI commands
 *
 * Commands for managing shaders in Unity.
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Register Shader command
 */
export function registerShaderCommand(program: Command): void {
  const shaderCmd = program.command('shader').description('Shader management commands');

  // shader list
  shaderCmd
    .command('list')
    .description('List all shaders in the project')
    .option('-f, --filter <pattern>', 'Filter shaders by name pattern')
    .option('-b, --builtin', 'Include built-in shaders', false)
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (options) => {
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

        interface ShaderInfo {
          name: string;
          path: string;
          isBuiltin: boolean;
          propertyCount: number;
          renderQueue: number;
        }

        interface ListResult {
          success: boolean;
          count: number;
          shaders: ShaderInfo[];
        }

        const result = await client.sendRequest<ListResult>(COMMANDS.SHADER_LIST, {
          filter: options.filter,
          includeBuiltin: options.builtin,
        });

        if (options.json) {
          outputJson(result);
        } else if (result.success) {
          if (result.shaders.length === 0) {
            logger.info('No shaders found.');
          } else {
            logger.info(`\nShaders (${result.count}):\n`);
            logger.info('Name'.padEnd(50) + 'Properties'.padEnd(12) + 'Queue'.padEnd(8) + 'Type');
            logger.info('-'.repeat(85));

            result.shaders.forEach((s) => {
              const type = s.isBuiltin ? 'Built-in' : 'Project';
              logger.info(
                s.name.padEnd(50) +
                  s.propertyCount.toString().padEnd(12) +
                  s.renderQueue.toString().padEnd(8) +
                  type
              );
            });
          }
        } else {
          logger.error('Failed to list shaders');
        }

        client.disconnect();
      } catch (error) {
        logger.error('Command failed', error);
        if (client) client.disconnect();
        process.exit(1);
      }
    });

  // shader find
  shaderCmd
    .command('find <name>')
    .description('Find a shader by name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (name, options) => {
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

        interface ShaderProperty {
          name: string;
          type: string;
          description: string;
        }

        interface FindResult {
          success: boolean;
          message?: string;
          shader?: {
            name: string;
            path: string;
            isBuiltin: boolean;
            propertyCount: number;
            renderQueue: number;
            properties: ShaderProperty[];
          };
        }

        const result = await client.sendRequest<FindResult>(COMMANDS.SHADER_FIND, { name });

        if (options.json) {
          outputJson(result);
        } else if (result.success && result.shader) {
          const s = result.shader;
          logger.info('\nShader Info:');
          logger.info(`  Name: ${s.name}`);
          logger.info(`  Path: ${s.path}`);
          logger.info(`  Type: ${s.isBuiltin ? 'Built-in' : 'Project'}`);
          logger.info(`  Render Queue: ${s.renderQueue}`);
          logger.info(`  Properties: ${s.propertyCount}`);

          if (s.properties && s.properties.length > 0) {
            logger.info('\n  Properties:');
            s.properties.forEach((p) => {
              logger.info(`    - ${p.name} (${p.type}): ${p.description || 'No description'}`);
            });
          }
        } else {
          logger.error(`Shader not found: ${name}`);
        }

        client.disconnect();
      } catch (error) {
        logger.error('Command failed', error);
        if (client) client.disconnect();
        process.exit(1);
      }
    });

  // shader properties
  shaderCmd
    .command('properties <shaderName>')
    .description('Get all properties of a shader')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (shaderName, options) => {
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

        interface ShaderProperty {
          index: number;
          name: string;
          type: string;
          description: string;
          flags?: string;
          defaultValue?: unknown;
          range?: { min: number; max: number };
        }

        interface PropertiesResult {
          success: boolean;
          shaderName: string;
          propertyCount: number;
          properties: ShaderProperty[];
        }

        const result = await client.sendRequest<PropertiesResult>(COMMANDS.SHADER_GET_PROPERTIES, {
          name: shaderName,
        });

        if (options.json) {
          outputJson(result);
        } else if (result.success) {
          logger.info(`\nShader: ${result.shaderName}`);
          logger.info(`Properties (${result.propertyCount}):\n`);

          if (result.properties.length === 0) {
            logger.info('No properties found.');
          } else {
            logger.info('Name'.padEnd(30) + 'Type'.padEnd(12) + 'Description');
            logger.info('-'.repeat(80));

            result.properties.forEach((p) => {
              let info = p.description || '';

              if (p.range) {
                info += ` [${p.range.min} - ${p.range.max}]`;
              }

              logger.info(p.name.padEnd(30) + p.type.padEnd(12) + info);
            });
          }
        } else {
          logger.error(`Failed to get properties for shader: ${shaderName}`);
        }

        client.disconnect();
      } catch (error) {
        logger.error('Command failed', error);
        if (client) client.disconnect();
        process.exit(1);
      }
    });

  // shader keywords
  shaderCmd
    .command('keywords')
    .description('Get shader keywords')
    .option('-g, --global', 'Get global keywords instead of shader-specific', false)
    .option('-s, --shader <name>', 'Shader name (required if not --global)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (options) => {
      if (!options.global && !options.shader) {
        logger.error('Error: Either --global or --shader <name> must be specified');
        process.exit(1);
      }

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

        interface ShaderKeyword {
          name: string;
          type: string;
          isValid: boolean;
        }

        interface KeywordsResult {
          success: boolean;
          global?: boolean;
          shaderName?: string;
          count: number;
          keywords: ShaderKeyword[];
        }

        const result = await client.sendRequest<KeywordsResult>(COMMANDS.SHADER_GET_KEYWORDS, {
          global: options.global,
          shaderName: options.shader,
        });

        if (options.json) {
          outputJson(result);
        } else if (result.success) {
          const source = result.global ? 'Global' : `Shader: ${result.shaderName}`;
          logger.info(`\n${source} Keywords (${result.count}):\n`);

          if (result.keywords.length === 0) {
            logger.info('No keywords found.');
          } else {
            logger.info('Name'.padEnd(40) + 'Type'.padEnd(20) + 'Valid');
            logger.info('-'.repeat(65));

            result.keywords.forEach((k) => {
              logger.info(k.name.padEnd(40) + k.type.padEnd(20) + (k.isValid ? 'Yes' : 'No'));
            });
          }
        } else {
          logger.error('Failed to get keywords');
        }

        client.disconnect();
      } catch (error) {
        logger.error('Command failed', error);
        if (client) client.disconnect();
        process.exit(1);
      }
    });

  // shader keyword-enable
  shaderCmd
    .command('keyword-enable <keyword>')
    .description('Enable a global shader keyword')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (keyword, options) => {
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

        interface KeywordResult {
          success: boolean;
          keyword: string;
          enabled: boolean;
        }

        const result = await client.sendRequest<KeywordResult>(COMMANDS.SHADER_ENABLE_KEYWORD, {
          keyword,
        });

        if (options.json) {
          outputJson(result);
        } else if (result.success) {
          logger.info(`Keyword "${result.keyword}" enabled successfully`);
        } else {
          logger.error(`Failed to enable keyword: ${keyword}`);
        }

        client.disconnect();
      } catch (error) {
        logger.error('Command failed', error);
        if (client) client.disconnect();
        process.exit(1);
      }
    });

  // shader keyword-disable
  shaderCmd
    .command('keyword-disable <keyword>')
    .description('Disable a global shader keyword')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (keyword, options) => {
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

        interface KeywordResult {
          success: boolean;
          keyword: string;
          enabled: boolean;
        }

        const result = await client.sendRequest<KeywordResult>(COMMANDS.SHADER_DISABLE_KEYWORD, {
          keyword,
        });

        if (options.json) {
          outputJson(result);
        } else if (result.success) {
          logger.info(`Keyword "${result.keyword}" disabled successfully`);
        } else {
          logger.error(`Failed to disable keyword: ${keyword}`);
        }

        client.disconnect();
      } catch (error) {
        logger.error('Command failed', error);
        if (client) client.disconnect();
        process.exit(1);
      }
    });

  // shader keyword-status
  shaderCmd
    .command('keyword-status <keyword>')
    .description('Check if a global shader keyword is enabled')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (keyword, options) => {
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

        interface KeywordResult {
          success: boolean;
          keyword: string;
          enabled: boolean;
        }

        const result = await client.sendRequest<KeywordResult>(COMMANDS.SHADER_IS_KEYWORD_ENABLED, {
          keyword,
        });

        if (options.json) {
          outputJson(result);
        } else if (result.success) {
          logger.info(`Keyword "${result.keyword}" is ${result.enabled ? 'enabled' : 'disabled'}`);
        } else {
          logger.error(`Failed to check keyword status: ${keyword}`);
        }

        client.disconnect();
      } catch (error) {
        logger.error('Command failed', error);
        if (client) client.disconnect();
        process.exit(1);
      }
    });
}
