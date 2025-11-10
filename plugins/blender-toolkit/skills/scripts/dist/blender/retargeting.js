"use strict";
/**
 * Animation Retargeting Controller
 * Mixamo 애니메이션을 사용자 캐릭터에 리타게팅
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetargetingController = void 0;
const constants_1 = require("../constants");
class RetargetingController {
    constructor(client) {
        this.client = client;
    }
    /**
     * 아마추어의 본 목록 가져오기
     */
    async getBones(armatureName) {
        return await this.client.sendCommand('Armature.getBones', {
            armatureName,
        });
    }
    /**
     * 자동 본 매핑 생성
     * Mixamo 본 이름과 사용자 캐릭터 본 이름을 매칭
     */
    async autoMapBones(sourceArmature, targetArmature) {
        return await this.client.sendCommand('Retargeting.autoMapBones', {
            sourceArmature,
            targetArmature,
        });
    }
    /**
     * 애니메이션 리타게팅 실행
     */
    async retarget(options) {
        const { sourceArmature, targetArmature, boneMapping = 'auto', customBoneMap, preserveRotation = true, preserveLocation = false, } = options;
        // 본 매핑 생성
        let boneMap;
        if (boneMapping === 'custom' && customBoneMap) {
            boneMap = customBoneMap;
        }
        else if (boneMapping === 'auto') {
            console.log('🔍 Auto-detecting bone mapping...');
            boneMap = await this.autoMapBones(sourceArmature, targetArmature);
            console.log(`✅ Mapped ${Object.keys(boneMap).length} bones`);
        }
        else {
            // 미리 정의된 프리셋 사용
            boneMap = await this.client.sendCommand('Retargeting.getPresetMapping', {
                preset: boneMapping,
            });
        }
        // 본 매핑 검증
        if (!boneMap || Object.keys(boneMap).length === 0) {
            throw new Error('Bone mapping is empty. Cannot proceed with retargeting.');
        }
        // 리타게팅 실행
        console.log('🎬 Starting animation retargeting...');
        console.log(`   Mapping ${Object.keys(boneMap).length} bones...`);
        await this.client.sendCommand('Retargeting.retargetAnimation', {
            sourceArmature,
            targetArmature,
            boneMap,
            preserveRotation,
            preserveLocation,
        }, constants_1.TIMING.RETARGET_TIMEOUT);
        console.log('✅ Animation retargeted successfully');
    }
    /**
     * NLA(Non-Linear Animation) 트랙에 애니메이션 추가
     */
    async addToNLA(armatureName, actionName, trackName) {
        await this.client.sendCommand('Animation.addToNLA', {
            armatureName,
            actionName,
            trackName: trackName || `Mixamo_${Date.now()}`,
        });
    }
    /**
     * 애니메이션 클립 목록 가져오기
     */
    async getAnimations(armatureName) {
        return await this.client.sendCommand('Animation.list', {
            armatureName,
        });
    }
    /**
     * 애니메이션 미리보기 재생
     */
    async playAnimation(armatureName, actionName, loop = true) {
        await this.client.sendCommand('Animation.play', {
            armatureName,
            actionName,
            loop,
        });
    }
    /**
     * 애니메이션 정지
     */
    async stopAnimation() {
        await this.client.sendCommand('Animation.stop');
    }
}
exports.RetargetingController = RetargetingController;
//# sourceMappingURL=retargeting.js.map