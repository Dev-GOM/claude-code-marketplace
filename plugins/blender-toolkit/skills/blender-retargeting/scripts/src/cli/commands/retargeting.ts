/**
 * Retargeting Commands
 * Blender 애니메이션 리타게팅 명령
 */

import { Command } from 'commander';
import { AnimationRetargetingWorkflow } from '../../index';
import { logger } from '../../utils/logger';

export function registerRetargetingCommands(program: Command) {
  // Retarget Animation
  program
    .command('retarget')
    .description('Retarget animation from Mixamo to your character')
    .requiredOption('-t, --target <string>', 'Target character armature name')
    .requiredOption('-f, --file <string>', 'Animation file path (FBX or DAE)')
    .option('-n, --name <string>', 'Animation name for NLA track')
    .option('-m, --mapping <string>', 'Bone mapping mode (auto, mixamo_to_rigify, custom)', 'auto')
    .option('--skip-confirmation', 'Skip bone mapping confirmation', false)
    .option('-p, --port <number>', 'Blender WebSocket port', parseInt, 9400)
    .option('-o, --output <string>', 'Output directory')
    .action(async (options) => {
      try {
        const workflow = new AnimationRetargetingWorkflow();

        console.log('🎬 Starting animation retargeting workflow...\n');

        await workflow.run({
          blenderPort: options.port,
          targetCharacterArmature: options.target,
          animationFilePath: options.file,
          animationName: options.name,
          boneMapping: options.mapping,
          skipConfirmation: options.skipConfirmation,
          outputDir: options.output
        });

        console.log('\n✅ Animation retargeting completed successfully!');
      } catch (error) {
        logger.error('Retargeting failed:', error);
        console.error('\n❌ Retargeting failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Show Mixamo download instructions
  program
    .command('mixamo-help')
    .description('Show Mixamo download instructions and popular animations')
    .argument('[animation-name]', 'Animation name (optional)')
    .action((animationName) => {
      const workflow = new AnimationRetargetingWorkflow();

      if (animationName) {
        console.log(workflow.getManualDownloadInstructions(animationName));
      } else {
        console.log('📚 Popular Mixamo Animations:\n');

        const popularAnimations = workflow.getPopularAnimations();
        Object.entries(popularAnimations).forEach(([category, animations]) => {
          console.log(`\n${category}:`);
          (animations as unknown as string[]).forEach((anim) => {
            console.log(`  • ${anim}`);
          });
        });

        console.log('\n\n📥 Download Instructions:\n');
        console.log(workflow.getManualDownloadInstructions('Walking'));
      }

      console.log('\n⚙️  Recommended Settings:\n');
      const settings = workflow.getRecommendedSettings();
      Object.entries(settings).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
}
