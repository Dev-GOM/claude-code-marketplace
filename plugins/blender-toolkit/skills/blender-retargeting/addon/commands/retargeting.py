"""
Animation Retargeting 관련 명령 핸들러
본 매핑, 애니메이션 리타게팅 실행
"""

import bpy
from typing import Dict
from ..utils.logger import get_logger
from ..utils.bone_matching import fuzzy_match_bones, get_match_quality_report

logger = get_logger(__name__)


def auto_map_bones(source_armature: str, target_armature: str) -> Dict[str, str]:
    """
    자동 본 매핑 (Mixamo -> 사용자 캐릭터)
    Fuzzy matching 알고리즘 사용으로 정확도 개선

    Args:
        source_armature: 소스 아마추어 이름 (Mixamo)
        target_armature: 타겟 아마추어 이름 (사용자 캐릭터)

    Returns:
        본 매핑 딕셔너리 {source_bone: target_bone}

    Raises:
        ValueError: 아마추어를 찾을 수 없는 경우
    """
    logger.info(f"Auto-mapping bones: {source_armature} -> {target_armature}")

    source = bpy.data.objects.get(source_armature)
    target = bpy.data.objects.get(target_armature)

    if not source or not target:
        logger.error("Source or target armature not found")
        raise ValueError("Source or target armature not found")

    # Mixamo 표준 본 이름과 알려진 별칭 (확장: 손가락, 발가락 포함)
    mixamo_bone_aliases = {
        # 몸통 (6개)
        "Hips": ["hips", "pelvis", "root"],
        "Spine": ["spine", "spine1"],
        "Spine1": ["spine1", "spine2"],
        "Spine2": ["spine2", "spine3", "chest"],
        "Neck": ["neck"],
        "Head": ["head"],

        # 왼쪽 팔 (4개)
        "LeftShoulder": ["shoulder.l", "clavicle.l", "leftshoulder"],
        "LeftArm": ["upper_arm.l", "leftarm", "upperarm.l"],
        "LeftForeArm": ["forearm.l", "leftforearm", "lowerarm.l"],
        "LeftHand": ["hand.l", "lefthand"],

        # 오른쪽 팔 (4개)
        "RightShoulder": ["shoulder.r", "clavicle.r", "rightshoulder"],
        "RightArm": ["upper_arm.r", "rightarm", "upperarm.r"],
        "RightForeArm": ["forearm.r", "rightforearm", "lowerarm.r"],
        "RightHand": ["hand.r", "righthand"],

        # 왼쪽 다리 (4개)
        "LeftUpLeg": ["thigh.l", "leftupleg", "upperleg.l"],
        "LeftLeg": ["shin.l", "leftleg", "lowerleg.l"],
        "LeftFoot": ["foot.l", "leftfoot"],
        "LeftToeBase": ["toe.l", "lefttoebase", "foot.l.001"],

        # 오른쪽 다리 (4개)
        "RightUpLeg": ["thigh.r", "rightupleg", "upperleg.r"],
        "RightLeg": ["shin.r", "rightleg", "lowerleg.r"],
        "RightFoot": ["foot.r", "rightfoot"],
        "RightToeBase": ["toe.r", "righttoebase", "foot.r.001"],

        # 왼쪽 손가락 (15개)
        "LeftHandThumb1": ["thumb.01.l", "lefthandthumb1", "thumb_01.l"],
        "LeftHandThumb2": ["thumb.02.l", "lefthandthumb2", "thumb_02.l"],
        "LeftHandThumb3": ["thumb.03.l", "lefthandthumb3", "thumb_03.l"],
        "LeftHandIndex1": ["f_index.01.l", "lefthandindex1", "index_01.l"],
        "LeftHandIndex2": ["f_index.02.l", "lefthandindex2", "index_02.l"],
        "LeftHandIndex3": ["f_index.03.l", "lefthandindex3", "index_03.l"],
        "LeftHandMiddle1": ["f_middle.01.l", "lefthandmiddle1", "middle_01.l"],
        "LeftHandMiddle2": ["f_middle.02.l", "lefthandmiddle2", "middle_02.l"],
        "LeftHandMiddle3": ["f_middle.03.l", "lefthandmiddle3", "middle_03.l"],
        "LeftHandRing1": ["f_ring.01.l", "lefthandring1", "ring_01.l"],
        "LeftHandRing2": ["f_ring.02.l", "lefthandring2", "ring_02.l"],
        "LeftHandRing3": ["f_ring.03.l", "lefthandring3", "ring_03.l"],
        "LeftHandPinky1": ["f_pinky.01.l", "lefthandpinky1", "pinky_01.l"],
        "LeftHandPinky2": ["f_pinky.02.l", "lefthandpinky2", "pinky_02.l"],
        "LeftHandPinky3": ["f_pinky.03.l", "lefthandpinky3", "pinky_03.l"],

        # 오른쪽 손가락 (15개)
        "RightHandThumb1": ["thumb.01.r", "righthandthumb1", "thumb_01.r"],
        "RightHandThumb2": ["thumb.02.r", "righthandthumb2", "thumb_02.r"],
        "RightHandThumb3": ["thumb.03.r", "righthandthumb3", "thumb_03.r"],
        "RightHandIndex1": ["f_index.01.r", "righthandindex1", "index_01.r"],
        "RightHandIndex2": ["f_index.02.r", "righthandindex2", "index_02.r"],
        "RightHandIndex3": ["f_index.03.r", "righthandindex3", "index_03.r"],
        "RightHandMiddle1": ["f_middle.01.r", "righthandmiddle1", "middle_01.r"],
        "RightHandMiddle2": ["f_middle.02.r", "righthandmiddle2", "middle_02.r"],
        "RightHandMiddle3": ["f_middle.03.r", "righthandmiddle3", "middle_03.r"],
        "RightHandRing1": ["f_ring.01.r", "righthandring1", "ring_01.r"],
        "RightHandRing2": ["f_ring.02.r", "righthandring2", "ring_02.r"],
        "RightHandRing3": ["f_ring.03.r", "righthandring3", "ring_03.r"],
        "RightHandPinky1": ["f_pinky.01.r", "righthandpinky1", "pinky_01.r"],
        "RightHandPinky2": ["f_pinky.02.r", "righthandpinky2", "pinky_02.r"],
        "RightHandPinky3": ["f_pinky.03.r", "righthandpinky3", "pinky_03.r"],
    }

    # 소스 본 리스트 (실제로 존재하는 본만)
    source_bones = [bone.name for bone in source.data.bones
                    if bone.name in mixamo_bone_aliases]

    # 타겟 본 리스트
    target_bones = [bone.name for bone in target.data.bones]

    # Fuzzy matching 실행 (정확한 매칭 우선, 그 다음 유사도 매칭)
    logger.info("Running fuzzy bone matching algorithm...")
    logger.debug(f"Source bones: {len(source_bones)}, Target bones: {len(target_bones)}")

    bone_map = fuzzy_match_bones(
        source_bones=source_bones,
        target_bones=target_bones,
        known_aliases=mixamo_bone_aliases,
        threshold=0.6,  # 60% 이상 유사도
        prefer_exact=True  # 정확한 매칭 우선
    )

    # 매칭 품질 보고서
    quality_report = get_match_quality_report(bone_map)
    logger.info(f"Auto-mapped {quality_report['total_mappings']} bones")
    logger.info(f"Quality: {quality_report['quality'].upper()}")
    logger.info(f"Critical bones: {quality_report['critical_bones_mapped']}")
    logger.debug(f"Bone mapping: {bone_map}")

    # 콘솔 출력 (사용자에게 피드백)
    print(f"✅ Auto-mapped {quality_report['total_mappings']} bones")
    print(f"   Quality: {quality_report['quality'].upper()}")
    print(f"   Critical bones: {quality_report['critical_bones_mapped']}")

    return bone_map


def retarget_animation(
    source_armature: str,
    target_armature: str,
    bone_map: Dict[str, str],
    preserve_rotation: bool = True,
    preserve_location: bool = False
) -> str:
    """
    애니메이션 리타게팅 실행

    Args:
        source_armature: 소스 아마추어 이름
        target_armature: 타겟 아마추어 이름
        bone_map: 본 매핑 딕셔너리
        preserve_rotation: 회전 보존 여부
        preserve_location: 위치 보존 여부 (보통 루트 본만)

    Returns:
        결과 메시지

    Raises:
        ValueError: 아마추어를 찾을 수 없거나 애니메이션이 없는 경우
    """
    logger.info(f"Retargeting animation: {source_armature} -> {target_armature}")
    logger.debug(f"Bone mappings: {len(bone_map)}, Rotation: {preserve_rotation}, Location: {preserve_location}")

    source = bpy.data.objects.get(source_armature)
    target = bpy.data.objects.get(target_armature)

    if not source or not target:
        logger.error("Source or target armature not found")
        raise ValueError("Source or target armature not found")

    if not source.animation_data or not source.animation_data.action:
        logger.error("Source armature has no animation")
        raise ValueError("Source armature has no animation")

    # 타겟 아마추어 선택
    bpy.context.view_layer.objects.active = target
    target.select_set(True)

    # Pose 모드로 전환
    bpy.ops.object.mode_set(mode='POSE')

    # 각 본에 대해 컨스트레인트 생성
    constraints_added = 0
    for source_bone_name, target_bone_name in bone_map.items():
        if source_bone_name not in source.pose.bones:
            logger.debug(f"Source bone not found: {source_bone_name}")
            continue
        if target_bone_name not in target.pose.bones:
            logger.debug(f"Target bone not found: {target_bone_name}")
            continue

        target_bone = target.pose.bones[target_bone_name]

        # Rotation constraint
        if preserve_rotation:
            constraint = target_bone.constraints.new('COPY_ROTATION')
            constraint.target = source
            constraint.subtarget = source_bone_name
            constraints_added += 1

        # Location constraint (일반적으로 루트 본만)
        if preserve_location and source_bone_name == "Hips":
            constraint = target_bone.constraints.new('COPY_LOCATION')
            constraint.target = source
            constraint.subtarget = source_bone_name
            constraints_added += 1

    logger.info(f"Added {constraints_added} constraints")

    # 컨스트레인트를 키프레임으로 베이크
    logger.info("Baking constraints to keyframes...")
    bpy.ops.nla.bake(
        frame_start=bpy.context.scene.frame_start,
        frame_end=bpy.context.scene.frame_end,
        only_selected=False,
        visual_keying=True,
        clear_constraints=True,
        bake_types={'POSE'}
    )

    bpy.ops.object.mode_set(mode='OBJECT')

    logger.info("Animation retargeting completed successfully")
    return f"Animation retargeted to {target_armature}"


def get_preset_bone_mapping(preset: str) -> Dict[str, str]:
    """
    미리 정의된 본 매핑 프리셋

    Args:
        preset: 프리셋 이름 (예: "mixamo_to_rigify")

    Returns:
        본 매핑 딕셔너리
    """
    logger.debug(f"Getting bone mapping preset: {preset}")

    presets = {
        "mixamo_to_rigify": {
            "Hips": "torso",
            "Spine": "spine",
            "Spine1": "spine.001",
            "Spine2": "spine.002",
            "Neck": "neck",
            "Head": "head",
            "LeftShoulder": "shoulder.L",
            "LeftArm": "upper_arm.L",
            "LeftForeArm": "forearm.L",
            "LeftHand": "hand.L",
            # ... 더 많은 매핑 추가 가능
        }
    }

    bone_map = presets.get(preset, {})
    logger.info(f"Preset '{preset}' loaded with {len(bone_map)} mappings")
    return bone_map
