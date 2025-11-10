/**
 * Animation Retargeting Controller
 * Mixamo 애니메이션을 사용자 캐릭터에 리타게팅
 */

import { BlenderClient } from './client';
import { RETARGETING, TIMING } from '../constants';

export interface RetargetOptions {
  sourceArmature: string;      // Mixamo 아마추어 이름
  targetArmature: string;       // 사용자 캐릭터 아마추어 이름
  boneMapping?: 'auto' | 'mixamo_to_rigify' | 'custom';
  customBoneMap?: Record<string, string>;
  preserveRotation?: boolean;
  preserveLocation?: boolean;
}

export interface BoneInfo {
  name: string;
  parent: string | null;
  children: string[];
}

export class RetargetingController {
  private client: BlenderClient;

  constructor(client: BlenderClient) {
    this.client = client;
  }

  /**
   * 아마추어의 본 목록 가져오기
   */
  async getBones(armatureName: string): Promise<BoneInfo[]> {
    return await this.client.sendCommand<BoneInfo[]>('Armature.getBones', {
      armatureName,
    });
  }

  /**
   * 자동 본 매핑 생성
   * Mixamo 본 이름과 사용자 캐릭터 본 이름을 매칭
   */
  async autoMapBones(
    sourceArmature: string,
    targetArmature: string
  ): Promise<Record<string, string>> {
    return await this.client.sendCommand<Record<string, string>>(
      'Retargeting.autoMapBones',
      {
        sourceArmature,
        targetArmature,
      }
    );
  }

  /**
   * 애니메이션 리타게팅 실행
   */
  async retarget(options: RetargetOptions): Promise<void> {
    const {
      sourceArmature,
      targetArmature,
      boneMapping = 'auto',
      customBoneMap,
      preserveRotation = true,
      preserveLocation = false,
    } = options;

    // 본 매핑 생성
    let boneMap: Record<string, string>;

    if (boneMapping === 'custom' && customBoneMap) {
      boneMap = customBoneMap;
    } else if (boneMapping === 'auto') {
      console.log('🔍 Auto-detecting bone mapping...');
      boneMap = await this.autoMapBones(sourceArmature, targetArmature);
      console.log(`✅ Mapped ${Object.keys(boneMap).length} bones`);
    } else {
      // 미리 정의된 프리셋 사용
      boneMap = await this.client.sendCommand<Record<string, string>>(
        'Retargeting.getPresetMapping',
        {
          preset: boneMapping,
        }
      );
    }

    // 본 매핑 검증
    if (!boneMap || Object.keys(boneMap).length === 0) {
      throw new Error('Bone mapping is empty. Cannot proceed with retargeting.');
    }

    // 리타게팅 실행
    console.log('🎬 Starting animation retargeting...');
    console.log(`   Mapping ${Object.keys(boneMap).length} bones...`);

    await this.client.sendCommand(
      'Retargeting.retargetAnimation',
      {
        sourceArmature,
        targetArmature,
        boneMap,
        preserveRotation,
        preserveLocation,
      },
      TIMING.RETARGET_TIMEOUT
    );

    console.log('✅ Animation retargeted successfully');
  }

  /**
   * NLA(Non-Linear Animation) 트랙에 애니메이션 추가
   */
  async addToNLA(
    armatureName: string,
    actionName: string,
    trackName?: string
  ): Promise<void> {
    await this.client.sendCommand('Animation.addToNLA', {
      armatureName,
      actionName,
      trackName: trackName || `Mixamo_${Date.now()}`,
    });
  }

  /**
   * 애니메이션 클립 목록 가져오기
   */
  async getAnimations(armatureName: string): Promise<string[]> {
    return await this.client.sendCommand<string[]>('Animation.list', {
      armatureName,
    });
  }

  /**
   * 애니메이션 미리보기 재생
   */
  async playAnimation(
    armatureName: string,
    actionName: string,
    loop: boolean = true
  ): Promise<void> {
    await this.client.sendCommand('Animation.play', {
      armatureName,
      actionName,
      loop,
    });
  }

  /**
   * 애니메이션 정지
   */
  async stopAnimation(): Promise<void> {
    await this.client.sendCommand('Animation.stop');
  }
}

// BlenderClient에 timeout 파라미터 추가를 위한 타입 확장
declare module './client' {
  interface BlenderClient {
    sendCommand<T = Record<string, unknown>>(
      method: string,
      params?: unknown,
      timeout?: number
    ): Promise<T>;
  }
}
