/**
 * Animation command
 *
 * Animation control commands for Animator and legacy Animation
 */

import { Command } from 'commander';
import * as logger from '@/utils/logger';
import * as config from '@/utils/config';
import { createUnityClient } from '@/unity/client';
import { COMMANDS } from '@/constants';
import { outputJson } from '@/utils/output-formatter';

/**
 * Register Animation command
 */
export function registerAnimationCommand(program: Command): void {
  const animCmd = program
    .command('animation')
    .alias('anim')
    .description('Animation control commands');

  // Play animation
  animCmd
    .command('play')
    .description('Play animation on a GameObject')
    .argument('<gameObject>', 'GameObject name or path')
    .option('--state <name>', 'State name to play (Animator)')
    .option('--clip <name>', 'Clip name to play (legacy Animation)')
    .option('--layer <n>', 'Layer index (default: 0)', '0')
    .option('--time <value>', 'Normalized start time (0-1)')
    .option('--speed <value>', 'Playback speed', '1')
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

        interface PlayResult {
          success: boolean;
          gameObject: string;
          type: string;
          stateName?: string;
          clipName?: string;
          message: string;
        }

        const params: Record<string, unknown> = {
          gameObject,
          layer: parseInt(options.layer, 10),
          speed: parseFloat(options.speed),
        };

        if (options.state) params.stateName = options.state;
        if (options.clip) params.clipName = options.clip;
        if (options.time) params.normalizedTime = parseFloat(options.time);

        const result = await client.sendRequest<PlayResult>(COMMANDS.ANIMATION_PLAY, params);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
          logger.info(`  Type: ${result.type}`);
          if (result.stateName) logger.info(`  State: ${result.stateName}`);
          if (result.clipName) logger.info(`  Clip: ${result.clipName}`);
        }
      } catch (error) {
        logger.error('Failed to play animation', error);
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

  // Stop animation
  animCmd
    .command('stop')
    .description('Stop animation on a GameObject')
    .argument('<gameObject>', 'GameObject name or path')
    .option('--clip <name>', 'Specific clip to stop (legacy Animation)')
    .option('--reset', 'Reset to default pose')
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

        interface StopResult {
          success: boolean;
          gameObject: string;
          type: string;
          message: string;
        }

        const result = await client.sendRequest<StopResult>(COMMANDS.ANIMATION_STOP, {
          gameObject,
          clipName: options.clip,
          resetToDefault: options.reset || false,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.message}`);
          logger.info(`  Type: ${result.type}`);
        }
      } catch (error) {
        logger.error('Failed to stop animation', error);
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

  // Get animation state
  animCmd
    .command('state')
    .alias('get-state')
    .description('Get current animation state')
    .argument('<gameObject>', 'GameObject name or path')
    .option('--layer <n>', 'Layer index (default: 0)', '0')
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

        interface AnimatorStateResult {
          success: boolean;
          gameObject: string;
          type: string;
          enabled: boolean;
          speed: number;
          layer: number;
          currentState: {
            clipName: string;
            normalizedTime: number;
            length: number;
            speed: number;
            isLooping: boolean;
          };
          isInTransition: boolean;
          layerCount: number;
          parameterCount: number;
        }

        interface AnimationStateResult {
          success: boolean;
          gameObject: string;
          type: string;
          isPlaying: boolean;
          clipCount: number;
          clips: Array<{
            name: string;
            length: number;
            normalizedTime: number;
            speed: number;
            weight: number;
            enabled: boolean;
            wrapMode: string;
          }>;
        }

        type StateResult = AnimatorStateResult | AnimationStateResult;

        const result = await client.sendRequest<StateResult>(COMMANDS.ANIMATION_GET_STATE, {
          gameObject,
          layer: parseInt(options.layer, 10),
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Animation state for ${result.gameObject}:`);
          logger.info(`  Type: ${result.type}`);

          if (result.type === 'Animator') {
            const r = result as AnimatorStateResult;
            logger.info(`  Enabled: ${r.enabled}`);
            logger.info(`  Speed: ${r.speed}`);
            logger.info(`  Layer: ${r.layer}/${r.layerCount}`);
            logger.info(`  In Transition: ${r.isInTransition}`);
            logger.info(`  Parameters: ${r.parameterCount}`);
            if (r.currentState) {
              logger.info(`  Current State:`);
              logger.info(`    Clip: ${r.currentState.clipName}`);
              logger.info(`    Time: ${(r.currentState.normalizedTime * 100).toFixed(1)}%`);
              logger.info(`    Length: ${r.currentState.length.toFixed(2)}s`);
              logger.info(`    Looping: ${r.currentState.isLooping}`);
            }
          } else {
            const r = result as AnimationStateResult;
            logger.info(`  Playing: ${r.isPlaying}`);
            logger.info(`  Clips: ${r.clipCount}`);
            for (const clip of r.clips) {
              logger.info(`    ● ${clip.name} (${clip.length.toFixed(2)}s, ${clip.wrapMode})`);
            }
          }
        }
      } catch (error) {
        logger.error('Failed to get animation state', error);
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

  // Get all parameters
  animCmd
    .command('params')
    .alias('get-params')
    .description('Get all Animator parameters')
    .argument('<gameObject>', 'GameObject name or path')
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

        interface ParametersResult {
          success: boolean;
          gameObject: string;
          count: number;
          parameters: Array<{
            name: string;
            type: string;
            value: unknown;
          }>;
        }

        const result = await client.sendRequest<ParametersResult>(COMMANDS.ANIMATION_GET_PARAMETERS, {
          gameObject,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.count} parameter(s) on ${result.gameObject}:`);
          for (const p of result.parameters) {
            const valueStr = p.value !== null ? `= ${p.value}` : '';
            logger.info(`  ● ${p.name} (${p.type}) ${valueStr}`);
          }
        }
      } catch (error) {
        logger.error('Failed to get parameters', error);
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

  // Get single parameter
  animCmd
    .command('get-param')
    .description('Get an Animator parameter value')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<parameter>', 'Parameter name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, parameter, options) => {
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

        interface ParameterResult {
          success: boolean;
          gameObject: string;
          parameterName: string;
          parameterType: string;
          value: unknown;
        }

        const result = await client.sendRequest<ParameterResult>(COMMANDS.ANIMATION_GET_PARAMETER, {
          gameObject,
          parameterName: parameter,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ ${result.parameterName} (${result.parameterType}): ${result.value}`);
        }
      } catch (error) {
        logger.error('Failed to get parameter', error);
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

  // Set parameter
  animCmd
    .command('set-param')
    .description('Set an Animator parameter value')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<parameter>', 'Parameter name')
    .argument('<value>', 'New value (float, int, bool)')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, parameter, value, options) => {
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

        interface SetParameterResult {
          success: boolean;
          gameObject: string;
          parameterName: string;
          parameterType: string;
          value: unknown;
        }

        // Parse value based on type
        let parsedValue: unknown = value;
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(parseFloat(value))) parsedValue = parseFloat(value);

        const result = await client.sendRequest<SetParameterResult>(COMMANDS.ANIMATION_SET_PARAMETER, {
          gameObject,
          parameterName: parameter,
          value: parsedValue,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Set ${result.parameterName} = ${result.value}`);
        }
      } catch (error) {
        logger.error('Failed to set parameter', error);
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

  // Set trigger
  animCmd
    .command('trigger')
    .alias('set-trigger')
    .description('Set an Animator trigger')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<trigger>', 'Trigger name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, trigger, options) => {
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

        interface TriggerResult {
          success: boolean;
          gameObject: string;
          triggerName: string;
          message: string;
        }

        const result = await client.sendRequest<TriggerResult>(COMMANDS.ANIMATION_SET_TRIGGER, {
          gameObject,
          triggerName: trigger,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Trigger '${result.triggerName}' set`);
        }
      } catch (error) {
        logger.error('Failed to set trigger', error);
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

  // Reset trigger
  animCmd
    .command('reset-trigger')
    .description('Reset an Animator trigger')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<trigger>', 'Trigger name')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, trigger, options) => {
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

        interface TriggerResult {
          success: boolean;
          gameObject: string;
          triggerName: string;
          message: string;
        }

        const result = await client.sendRequest<TriggerResult>(COMMANDS.ANIMATION_RESET_TRIGGER, {
          gameObject,
          triggerName: trigger,
        });

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ Trigger '${result.triggerName}' reset`);
        }
      } catch (error) {
        logger.error('Failed to reset trigger', error);
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

  // CrossFade
  animCmd
    .command('crossfade')
    .description('CrossFade to a state')
    .argument('<gameObject>', 'GameObject name or path')
    .argument('<state>', 'State name to transition to')
    .option('--duration <seconds>', 'Transition duration', '0.25')
    .option('--layer <n>', 'Layer index (default: 0)', '0')
    .option('--offset <value>', 'Normalized time offset')
    .option('--json', 'Output in JSON format')
    .option('--timeout <ms>', 'WebSocket connection timeout in milliseconds', '30000')
    .action(async (gameObject, state, options) => {
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

        interface CrossFadeResult {
          success: boolean;
          gameObject: string;
          stateName: string;
          transitionDuration: number;
          message: string;
        }

        const params: Record<string, unknown> = {
          gameObject,
          stateName: state,
          transitionDuration: parseFloat(options.duration),
          layer: parseInt(options.layer, 10),
        };

        if (options.offset) params.normalizedTimeOffset = parseFloat(options.offset);

        const result = await client.sendRequest<CrossFadeResult>(COMMANDS.ANIMATION_CROSSFADE, params);

        if (options.json) {
          outputJson(result);
        } else {
          logger.info(`✓ CrossFade to '${result.stateName}' (${result.transitionDuration}s)`);
        }
      } catch (error) {
        logger.error('Failed to crossfade', error);
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
