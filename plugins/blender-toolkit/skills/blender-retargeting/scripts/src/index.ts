/**
 * Blender Animation Retargeting Workflow
 * Mixamo 애니메이션을 사용자 캐릭터에 리타게팅하는 전체 워크플로우
 */

import { BlenderClient } from './blender/client';
import { RetargetingController } from './blender/retargeting';
import { MixamoClient } from './blender/mixamo';
import { BLENDER, FS, ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface RetargetWorkflowOptions {
  // Blender 설정
  blenderPort?: number;

  // 캐릭터 설정
  targetCharacterArmature: string;

  // Mixamo 설정
  mixamoAnimation?: string;         // 검색할 애니메이션 이름
  mixamoAnimationId?: string;       // 직접 애니메이션 ID 지정
  mixamoFilePath?: string;          // 수동 다운로드한 FBX 경로

  // 리타게팅 설정
  boneMapping?: 'auto' | 'mixamo_to_rigify' | 'custom';
  customBoneMap?: Record<string, string>;

  // 출력 설정
  outputDir?: string;
}

export class AnimationRetargetingWorkflow {
  private blenderClient: BlenderClient;
  private retargetingController: RetargetingController;
  private mixamoClient: MixamoClient;
  private outputDir: string;

  constructor() {
    this.blenderClient = new BlenderClient();
    this.retargetingController = new RetargetingController(this.blenderClient);
    this.mixamoClient = new MixamoClient();
    this.outputDir = join(process.cwd(), FS.OUTPUT_DIR);
  }

  /**
   * 전체 리타게팅 워크플로우 실행
   */
  async run(options: RetargetWorkflowOptions): Promise<void> {
    const {
      blenderPort = BLENDER.DEFAULT_PORT,
      targetCharacterArmature,
      mixamoAnimation,
      mixamoAnimationId,
      mixamoFilePath,
      boneMapping = 'auto',
      customBoneMap,
      outputDir,
    } = options;

    if (outputDir) {
      this.outputDir = outputDir;
    }

    // 출력 디렉토리 생성
    this.ensureOutputDirectory();

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

      // Step 3: Mixamo 애니메이션 가져오기
      let animationPath: string;

      if (mixamoFilePath) {
        // 수동 다운로드한 파일 사용
        console.log(`📂 Using manually downloaded file: ${mixamoFilePath}`);
        animationPath = mixamoFilePath;
      } else if (mixamoAnimationId) {
        // Mixamo에서 다운로드
        console.log(`📥 Downloading animation from Mixamo (ID: ${mixamoAnimationId})...`);
        animationPath = await this.downloadMixamoAnimation(mixamoAnimationId);
      } else if (mixamoAnimation) {
        // 이름으로 검색 후 다운로드
        console.log(`🔍 Searching for "${mixamoAnimation}" on Mixamo...`);
        const results = await this.mixamoClient.searchAnimations(mixamoAnimation, 5);

        if (results.length === 0) {
          throw new Error(`No animations found for "${mixamoAnimation}"`);
        }

        console.log(`Found ${results.length} animations:`);
        results.forEach((anim, idx) => {
          console.log(`  ${idx + 1}. ${anim.name} (ID: ${anim.id})`);
        });

        // 첫 번째 결과 사용
        const selectedAnimation = results[0];
        console.log(`📥 Downloading "${selectedAnimation.name}"...`);
        animationPath = await this.downloadMixamoAnimation(selectedAnimation.id);
      } else {
        throw new Error(
          'Please provide either mixamoAnimation, mixamoAnimationId, or mixamoFilePath'
        );
      }

      // Step 4: Blender에 임포트
      console.log(`📦 Importing animation into Blender...`);
      await this.importAnimation(animationPath);
      console.log(SUCCESS_MESSAGES.ANIMATION_IMPORTED);

      // Step 5: Mixamo 아마추어 찾기 (방금 임포트된 것)
      const updatedArmatures = await this.getArmatures();
      const mixamoArmature = updatedArmatures.find(
        (name) => !armatures.includes(name)
      );

      if (!mixamoArmature) {
        throw new Error('Failed to find imported Mixamo armature');
      }

      console.log(`✅ Found Mixamo armature: ${mixamoArmature}`);

      // Step 6: 리타게팅 실행
      console.log('🎬 Starting animation retargeting...');
      await this.retargetingController.retarget({
        sourceArmature: mixamoArmature,
        targetArmature: targetCharacterArmature,
        boneMapping,
        customBoneMap,
        preserveRotation: true,
        preserveLocation: true,
      });

      console.log(SUCCESS_MESSAGES.RETARGETING_COMPLETE);

      // Step 7: NLA에 추가 (선택사항)
      const animations = await this.retargetingController.getAnimations(
        targetCharacterArmature
      );

      if (animations.length > 0) {
        const latestAnimation = animations[animations.length - 1];
        console.log(`📋 Adding animation to NLA track...`);
        await this.retargetingController.addToNLA(
          targetCharacterArmature,
          latestAnimation,
          `Mixamo_${Date.now()}`
        );
      }

      console.log('\n✅ Animation retargeting completed successfully!\n');
      console.log('Next steps:');
      console.log('  1. Review the animation in Blender');
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
   * Mixamo 애니메이션 다운로드
   */
  private async downloadMixamoAnimation(animationId: string): Promise<string> {
    const animationsDir = join(this.outputDir, FS.ANIMATIONS_DIR);

    if (!existsSync(animationsDir)) {
      mkdirSync(animationsDir, { recursive: true });
    }

    try {
      return await this.mixamoClient.downloadAnimation({
        animationId,
        format: 'fbx',
        skin: 'Without Skin',
        fps: 30,
        outputPath: animationsDir,
      });
    } catch (error) {
      // API 다운로드 실패 시 수동 다운로드 가이드 제공
      console.error('Failed to download from Mixamo API:', error);
      console.log('\n' + this.mixamoClient.getManualDownloadInstructions(animationId));
      throw new Error(ERROR_MESSAGES.MIXAMO_DOWNLOAD_FAILED);
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
   * Mixamo Bearer 토큰 설정
   */
  setMixamoBearerToken(token: string): void {
    this.mixamoClient.setBearerToken(token);
  }

  /**
   * 인기 애니메이션 목록 가져오기
   */
  getPopularAnimations() {
    return this.mixamoClient.getPopularAnimations();
  }
}

// CLI 사용 예시
export async function runRetargetingFromCLI() {
  const workflow = new AnimationRetargetingWorkflow();

  // 예시: 사용자 캐릭터에 Walking 애니메이션 리타게팅
  await workflow.run({
    targetCharacterArmature: 'MyCharacter',  // 사용자의 캐릭터 이름
    mixamoAnimation: 'Walking',               // Mixamo 애니메이션 검색어
    boneMapping: 'auto',                      // 자동 본 매핑
  });
}
