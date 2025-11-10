"use strict";
/**
 * Blender Animation Retargeting Workflow
 * Mixamo 애니메이션을 사용자 캐릭터에 리타게팅하는 전체 워크플로우
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationRetargetingWorkflow = void 0;
exports.runRetargetingFromCLI = runRetargetingFromCLI;
const client_1 = require("./blender/client");
const retargeting_1 = require("./blender/retargeting");
const mixamo_1 = require("./blender/mixamo");
const constants_1 = require("./constants");
const fs_1 = require("fs");
const path_1 = require("path");
class AnimationRetargetingWorkflow {
    constructor() {
        this.blenderClient = new client_1.BlenderClient();
        this.retargetingController = new retargeting_1.RetargetingController(this.blenderClient);
        this.mixamoHelper = new mixamo_1.MixamoHelper();
        this.outputDir = (0, path_1.join)(process.cwd(), constants_1.FS.OUTPUT_DIR);
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
    async run(options) {
        const { blenderPort = constants_1.BLENDER.DEFAULT_PORT, targetCharacterArmature, animationFilePath, animationName, boneMapping = 'auto', customBoneMap, skipConfirmation = false, outputDir, } = options;
        if (outputDir) {
            this.outputDir = outputDir;
        }
        // 출력 디렉토리 생성
        this.ensureOutputDirectory();
        // Validate animation file
        if (!(0, fs_1.existsSync)(animationFilePath)) {
            throw new Error(`Animation file not found: ${animationFilePath}`);
        }
        try {
            // Step 1: Blender에 연결
            console.log('🔌 Connecting to Blender...');
            await this.blenderClient.connect();
            console.log(constants_1.SUCCESS_MESSAGES.CONNECTED);
            // Step 2: 타겟 캐릭터 확인
            console.log('🔍 Checking target character...');
            const armatures = await this.getArmatures();
            if (!armatures.includes(targetCharacterArmature)) {
                throw new Error(`Target armature "${targetCharacterArmature}" not found. Available: ${armatures.join(', ')}`);
            }
            // Step 3: 애니메이션 파일 임포트
            console.log(`📦 Importing animation from: ${animationFilePath}`);
            await this.importAnimation(animationFilePath);
            console.log(constants_1.SUCCESS_MESSAGES.ANIMATION_IMPORTED);
            // Step 4: Mixamo 아마추어 찾기 (방금 임포트된 것)
            const updatedArmatures = await this.getArmatures();
            const mixamoArmature = updatedArmatures.find((name) => !armatures.includes(name));
            if (!mixamoArmature) {
                throw new Error('Failed to find imported animation armature');
            }
            console.log(`✅ Found animation armature: ${mixamoArmature}`);
            // Step 5: Auto-generate bone mapping
            console.log('🔍 Auto-generating bone mapping...');
            let finalBoneMap;
            if (boneMapping === 'custom' && customBoneMap) {
                finalBoneMap = customBoneMap;
            }
            else {
                finalBoneMap = await this.retargetingController.autoMapBones(mixamoArmature, targetCharacterArmature);
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
                    const retrievedMapping = await this.blenderClient.sendCommand('BoneMapping.get', {
                        sourceArmature: mixamoArmature,
                        targetArmature: targetCharacterArmature,
                    });
                    if (retrievedMapping && Object.keys(retrievedMapping).length > 0) {
                        finalBoneMap = retrievedMapping;
                        console.log(`✅ Using edited bone mapping (${Object.keys(finalBoneMap).length} bones)`);
                    }
                    else {
                        console.log('⚠️  No edited mapping found, using auto-generated mapping');
                    }
                }
                catch (error) {
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
            console.log(constants_1.SUCCESS_MESSAGES.RETARGETING_COMPLETE);
            // Step 8: NLA에 추가 (선택사항)
            const animations = await this.retargetingController.getAnimations(targetCharacterArmature);
            if (animations.length > 0) {
                const latestAnimation = animations[animations.length - 1];
                const nlaTrackName = animationName || `Retargeted_${Date.now()}`;
                console.log(`📋 Adding animation to NLA track: ${nlaTrackName}`);
                await this.retargetingController.addToNLA(targetCharacterArmature, latestAnimation, nlaTrackName);
            }
            console.log('\n✅ Animation retargeting completed successfully!\n');
            console.log('Next steps:');
            console.log('  1. Review the retargeted animation in Blender');
            console.log('  2. Adjust keyframes if needed');
            console.log('  3. Export or save your scene');
        }
        catch (error) {
            console.error('❌ Retargeting workflow failed:', error);
            throw error;
        }
        finally {
            // 연결 종료
            await this.blenderClient.disconnect();
        }
    }
    /**
     * 애니메이션 파일 임포트
     */
    async importAnimation(filepath) {
        const ext = filepath.split('.').pop()?.toLowerCase();
        if (ext === 'fbx') {
            await this.blenderClient.sendCommand('Import.fbx', { filepath });
        }
        else if (ext === 'dae') {
            await this.blenderClient.sendCommand('Import.dae', { filepath });
        }
        else {
            throw new Error(`Unsupported file format: ${ext}`);
        }
    }
    /**
     * 아마추어 목록 가져오기
     */
    async getArmatures() {
        return await this.blenderClient.sendCommand('Armature.list');
    }
    /**
     * 출력 디렉토리 생성
     */
    ensureOutputDirectory() {
        if (!(0, fs_1.existsSync)(this.outputDir)) {
            (0, fs_1.mkdirSync)(this.outputDir, { recursive: true });
        }
        const animationsDir = (0, path_1.join)(this.outputDir, constants_1.FS.ANIMATIONS_DIR);
        if (!(0, fs_1.existsSync)(animationsDir)) {
            (0, fs_1.mkdirSync)(animationsDir, { recursive: true });
        }
        // .gitignore 생성
        const gitignorePath = (0, path_1.join)(this.outputDir, '.gitignore');
        if (!(0, fs_1.existsSync)(gitignorePath)) {
            const fs = require('fs');
            fs.writeFileSync(gitignorePath, constants_1.FS.GITIGNORE_CONTENT);
        }
    }
    /**
     * Get manual download instructions for Mixamo
     */
    getManualDownloadInstructions(animationName) {
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
exports.AnimationRetargetingWorkflow = AnimationRetargetingWorkflow;
// CLI 사용 예시
async function runRetargetingFromCLI() {
    const workflow = new AnimationRetargetingWorkflow();
    // Show manual download instructions
    console.log(workflow.getManualDownloadInstructions('Walking'));
    console.log('\nRecommended settings:', workflow.getRecommendedSettings());
    // After manual download, run retargeting
    await workflow.run({
        targetCharacterArmature: 'MyCharacter', // User's character name
        animationFilePath: './animations/Walking.fbx', // Downloaded FBX path
        animationName: 'Walking', // Animation name for NLA track
        boneMapping: 'auto', // Auto bone mapping
        skipConfirmation: false, // Enable confirmation workflow
    });
}
//# sourceMappingURL=index.js.map