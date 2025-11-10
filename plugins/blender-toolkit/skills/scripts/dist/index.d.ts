/**
 * Blender Animation Retargeting Workflow
 * Mixamo 애니메이션을 사용자 캐릭터에 리타게팅하는 전체 워크플로우
 */
export interface RetargetWorkflowOptions {
    blenderPort?: number;
    targetCharacterArmature: string;
    animationFilePath: string;
    animationName?: string;
    boneMapping?: 'auto' | 'mixamo_to_rigify' | 'custom';
    customBoneMap?: Record<string, string>;
    skipConfirmation?: boolean;
    outputDir?: string;
}
export declare class AnimationRetargetingWorkflow {
    private blenderClient;
    private retargetingController;
    private mixamoHelper;
    private outputDir;
    constructor();
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
    run(options: RetargetWorkflowOptions): Promise<void>;
    /**
     * 애니메이션 파일 임포트
     */
    private importAnimation;
    /**
     * 아마추어 목록 가져오기
     */
    private getArmatures;
    /**
     * 출력 디렉토리 생성
     */
    private ensureOutputDirectory;
    /**
     * Get manual download instructions for Mixamo
     */
    getManualDownloadInstructions(animationName: string): string;
    /**
     * Get list of popular Mixamo animations
     */
    getPopularAnimations(): {
        name: string;
        category: string;
    }[];
    /**
     * Get recommended Mixamo download settings
     */
    getRecommendedSettings(): {
        format: string;
        skin: string;
        fps: number;
    };
}
export declare function runRetargetingFromCLI(): Promise<void>;
//# sourceMappingURL=index.d.ts.map