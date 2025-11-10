/**
 * Animation Retargeting Controller
 * Mixamo 애니메이션을 사용자 캐릭터에 리타게팅
 */
import { BlenderClient } from './client';
export interface RetargetOptions {
    sourceArmature: string;
    targetArmature: string;
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
export declare class RetargetingController {
    private client;
    constructor(client: BlenderClient);
    /**
     * 아마추어의 본 목록 가져오기
     */
    getBones(armatureName: string): Promise<BoneInfo[]>;
    /**
     * 자동 본 매핑 생성
     * Mixamo 본 이름과 사용자 캐릭터 본 이름을 매칭
     */
    autoMapBones(sourceArmature: string, targetArmature: string): Promise<Record<string, string>>;
    /**
     * 애니메이션 리타게팅 실행
     */
    retarget(options: RetargetOptions): Promise<void>;
    /**
     * NLA(Non-Linear Animation) 트랙에 애니메이션 추가
     */
    addToNLA(armatureName: string, actionName: string, trackName?: string): Promise<void>;
    /**
     * 애니메이션 클립 목록 가져오기
     */
    getAnimations(armatureName: string): Promise<string[]>;
    /**
     * 애니메이션 미리보기 재생
     */
    playAnimation(armatureName: string, actionName: string, loop?: boolean): Promise<void>;
    /**
     * 애니메이션 정지
     */
    stopAnimation(): Promise<void>;
}
declare module './client' {
    interface BlenderClient {
        sendCommand<T = Record<string, unknown>>(method: string, params?: unknown, timeout?: number): Promise<T>;
    }
}
//# sourceMappingURL=retargeting.d.ts.map