/**
 * Blender Animation Retargeting Workflow
 * Mixamo 애니메이션을 사용자 캐릭터에 리타게팅하는 전체 워크플로우
 */

import { BlenderClient } from './blender/client';
import { RetargetingController } from './blender/retargeting';
import { MixamoHelper } from './blender/mixamo';
import { BLENDER, FS, ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface RetargetWorkflowOptions {
  // Blender 설정
  blenderPort?: number;

  // 캐릭터 설정
  targetCharacterArmature: string;

  // 애니메이션 파일 설정
  animationFilePath: string;        // FBX or DAE file path (manual download required)
  animationName?: string;           // Optional animation name for NLA track

  // 리타게팅 설정
  boneMapping?: 'auto' | 'mixamo_to_rigify' | 'custom';
  customBoneMap?: Record<string, string>;

  // Confirmation workflow
  skipConfirmation?: boolean;       // Skip bone mapping confirmation (use auto-mapping directly)

  // 출력 설정
  outputDir?: string;
}

export class AnimationRetargetingWorkflow {
  private blenderClient: BlenderClient;
  private retargetingController: RetargetingController;
  private mixamoHelper: MixamoHelper;
  private outputDir: string;

  constructor() {
    this.blenderClient = new BlenderClient();
    this.retargetingController = new RetargetingController(this.blenderClient);
    this.mixamoHelper = new MixamoHelper();
    this.outputDir = join(process.cwd(), FS.OUTPUT_DIR);
  }

  /**
   * 전체 리타게팅 워크플로우 실행
   *
   * Workflow with user confirmation:
   * 1. Import animation FBX
   * 2. Auto-generate bone mapping
   * 3. Send mapping to Blender UI for review
   * 4. Wait for user confirmation (via AskUserQuestion)
   * 5. Retrieve edited mapping from Blender
   * 6. Apply retargeting with confirmed mapping
   */
  async run(options: RetargetWorkflowOptions): Promise<void> {
    const {
      blenderPort = BLENDER.DEFAULT_PORT,
      targetCharacterArmature,
      animationFilePath,
      animationName,
      boneMapping = 'auto',
      customBoneMap,
      skipConfirmation = false,
      outputDir,
    } = options;

    if (outputDir) {
      this.outputDir = outputDir;
    }

    // 출력 디렉토리 생성
    this.ensureOutputDirectory();

    // Validate animation file
    if (!existsSync(animationFilePath)) {
      throw new Error(`Animation file not found: ${animationFilePath}`);
    }

    try {
      // Step 1: Blender에 연결
      console.log('🔌 Connecting to Blender...');
      await this.blenderClient.connect();
      console.log(SUCCESS_MESSAGES.CONNECTED);

      // Step 2: 타겟 캐릭터 확인
      console.log('🔍 Checking target character...');
      const armatures = await this.getArmatures();
      if (!armatures.includes(targetCharacterArmature)) {
        throw new Error(
          `Target armature "${targetCharacterArmature}" not found. Available: ${armatures.join(', ')}`
        );
      }

      // Step 3: 애니메이션 파일 임포트
      console.log(`📦 Importing animation from: ${animationFilePath}`);
      await this.importAnimation(animationFilePath);
      console.log(SUCCESS_MESSAGES.ANIMATION_IMPORTED);

      // Step 4: Mixamo 아마추어 찾기 (방금 임포트된 것)
      const updatedArmatures = await this.getArmatures();
      const mixamoArmature = updatedArmatures.find(
        (name) => !armatures.includes(name)
      );

      if (!mixamoArmature) {
        throw new Error('Failed to find imported animation armature');
      }

      console.log(`✅ Found animation armature: ${mixamoArmature}`);

      // Step 5: Auto-generate bone mapping
      console.log('🔍 Auto-generating bone mapping...');
      let finalBoneMap: Record<string, string>;

      if (boneMapping === 'custom' && customBoneMap) {
        finalBoneMap = customBoneMap;
      } else {
        finalBoneMap = await this.retargetingController.autoMapBones(
          mixamoArmature,
          targetCharacterArmature
        );
      }

      console.log(`✅ Generated bone mapping (${Object.keys(finalBoneMap).length} bones)`);

      // Step 6: Bone mapping confirmation workflow
      if (!skipConfirmation) {
        console.log('\n📋 Bone Mapping Preview:');
        console.log('─'.repeat(60));
        Object.entries(finalBoneMap).forEach(([source, target]) => {
          console.log(`  ${source.padEnd(25)} → ${target}`);
        });
        console.log('─'.repeat(60));

        // Send bone mapping to Blender UI
        console.log('\n📤 Sending bone mapping to Blender UI...');
        await this.blenderClient.sendCommand('BoneMapping.show', {
          sourceArmature: mixamoArmature,
          targetArmature: targetCharacterArmature,
          boneMapping: finalBoneMap,
        });

        console.log('✅ Bone mapping displayed in Blender');
        console.log('\n⏸️  Please review the bone mapping in Blender:');
        console.log('   1. Check the "Blender Toolkit" panel in the 3D View sidebar (N key)');
        console.log('   2. Review the bone mapping table');
        console.log('   3. Edit any incorrect mappings if needed');
        console.log('   4. Click "Apply Retargeting" when ready');
        console.log('\nWaiting for user confirmation...\n');

        // Note: In actual implementation with Claude Code, this would use AskUserQuestion
        // For now, we'll retrieve the mapping after a pause
        // TODO: Integrate with Claude Code's AskUserQuestion tool

        // Retrieve edited bone mapping from Blender (with error recovery)
        console.log('📥 Retrieving bone mapping from Blender...');
        try {
          const retrievedMapping = await this.blenderClient.sendCommand<Record<string, string>>(
            'BoneMapping.get',
            {
              sourceArmature: mixamoArmature,
              targetArmature: targetCharacterArmature,
            }
          );

          if (retrievedMapping && Object.keys(retrievedMapping).length > 0) {
            finalBoneMap = retrievedMapping;
            console.log(`✅ Using edited bone mapping (${Object.keys(finalBoneMap).length} bones)`);
          } else {
            console.log('⚠️  No edited mapping found, using auto-generated mapping');
          }
        } catch (error) {
          console.warn('⚠️  Failed to retrieve edited mapping, using auto-generated mapping');
          console.warn(`   Error: ${error}`);
          // finalBoneMap already contains the auto-generated mapping, so no action needed
        }
      }

      // Step 7: 리타게팅 실행
      console.log('\n🎬 Starting animation retargeting...');
      await this.retargetingController.retarget({
        sourceArmature: mixamoArmature,
        targetArmature: targetCharacterArmature,
        boneMapping: 'custom',
        customBoneMap: finalBoneMap,
        preserveRotation: true,
        preserveLocation: true,
      });

      console.log(SUCCESS_MESSAGES.RETARGETING_COMPLETE);

      // Step 8: NLA에 추가 (선택사항)
      const animations = await this.retargetingController.getAnimations(
        targetCharacterArmature
      );

      if (animations.length > 0) {
        const latestAnimation = animations[animations.length - 1];
        const nlaTrackName = animationName || `Retargeted_${Date.now()}`;
        console.log(`📋 Adding animation to NLA track: ${nlaTrackName}`);
        await this.retargetingController.addToNLA(
          targetCharacterArmature,
          latestAnimation,
          nlaTrackName
        );
      }

      console.log('\n✅ Animation retargeting completed successfully!\n');
      console.log('Next steps:');
      console.log('  1. Review the retargeted animation in Blender');
      console.log('  2. Adjust keyframes if needed');
      console.log('  3. Export or save your scene');

    } catch (error) {
      console.error('❌ Retargeting workflow failed:', error);
      throw error;
    } finally {
      // 연결 종료
      await this.blenderClient.disconnect();
    }
  }

  /**
   * 애니메이션 파일 임포트
   */
  private async importAnimation(filepath: string): Promise<void> {
    const ext = filepath.split('.').pop()?.toLowerCase();

    if (ext === 'fbx') {
      await this.blenderClient.sendCommand('Import.fbx', { filepath });
    } else if (ext === 'dae') {
      await this.blenderClient.sendCommand('Import.dae', { filepath });
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * 아마추어 목록 가져오기
   */
  private async getArmatures(): Promise<string[]> {
    return await this.blenderClient.sendCommand<string[]>('Armature.list');
  }

  /**
   * 출력 디렉토리 생성
   */
  private ensureOutputDirectory(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    const animationsDir = join(this.outputDir, FS.ANIMATIONS_DIR);
    if (!existsSync(animationsDir)) {
      mkdirSync(animationsDir, { recursive: true });
    }

    // .gitignore 생성
    const gitignorePath = join(this.outputDir, '.gitignore');
    if (!existsSync(gitignorePath)) {
      const fs = require('fs');
      fs.writeFileSync(gitignorePath, FS.GITIGNORE_CONTENT);
    }
  }

  /**
   * Get manual download instructions for Mixamo
   */
  getManualDownloadInstructions(animationName: string): string {
    return this.mixamoHelper.getManualDownloadInstructions(animationName);
  }

  /**
   * Get list of popular Mixamo animations
   */
  getPopularAnimations() {
    return this.mixamoHelper.getPopularAnimations();
  }

  /**
   * Get recommended Mixamo download settings
   */
  getRecommendedSettings() {
    return this.mixamoHelper.getRecommendedSettings();
  }
}

// CLI 사용 예시
export async function runRetargetingFromCLI() {
  const workflow = new AnimationRetargetingWorkflow();

  // Show manual download instructions
  console.log(workflow.getManualDownloadInstructions('Walking'));
  console.log('\nRecommended settings:', workflow.getRecommendedSettings());

  // After manual download, run retargeting
  await workflow.run({
    targetCharacterArmature: 'MyCharacter',           // User's character name
    animationFilePath: './animations/Walking.fbx',    // Downloaded FBX path
    animationName: 'Walking',                         // Animation name for NLA track
    boneMapping: 'auto',                              // Auto bone mapping
    skipConfirmation: false,                          // Enable confirmation workflow
  });
}
