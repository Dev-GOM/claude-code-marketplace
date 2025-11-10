"""
Animation Retargeting Module
Blender 애니메이션 리타게팅 관련 함수들

주요 기능:
- 아마추어 및 본 정보 조회
- 자동 본 매핑 (Fuzzy matching)
- 애니메이션 리타게팅
- 애니메이션 재생 및 NLA 트랙 관리
- FBX/DAE 임포트
- 본 매핑 저장/로드
"""

import os
from typing import Dict, List, Optional

import bpy

# Fuzzy bone matching utilities
from .utils.bone_matching import (
    fuzzy_match_bones,
    get_match_quality_report,
)

# Logging utilities
from .utils.logger import get_logger

# 모듈 로거 초기화
logger = get_logger('retargeting')


# ============================================================================
# Armature & Bone Query Functions
# ============================================================================

def list_armatures() -> List[str]:
    """
    모든 아마추어 오브젝트 목록 반환

    Returns:
        아마추어 오브젝트 이름 리스트
    """
    return [obj.name for obj in bpy.data.objects if obj.type == 'ARMATURE']


def get_bones(armature_name: str) -> List[Dict[str, Optional[str]]]:
    """
    아마추어의 본 정보 가져오기

    Args:
        armature_name: 아마추어 오브젝트 이름

    Returns:
        본 정보 리스트 (name, parent, children)

    Raises:
        ValueError: 아마추어를 찾을 수 없는 경우
    """
    armature = bpy.data.objects.get(armature_name)
    if not armature or armature.type != 'ARMATURE':
        raise ValueError(f"Armature '{armature_name}' not found")

    bones = []
    for bone in armature.data.bones:
        bones.append({
            "name": bone.name,
            "parent": bone.parent.name if bone.parent else None,
            "children": [child.name for child in bone.children]
        })

    return bones


# ============================================================================
# Bone Mapping Functions
# ============================================================================

def auto_map_bones(source_armature: str, target_armature: str) -> Dict[str, str]:
    """
    자동 본 매핑 (Mixamo -> 사용자 캐릭터)
    Fuzzy matching 알고리즘 사용으로 정확도 개선

    Args:
        source_armature: 소스 아마추어 이름 (예: Mixamo)
        target_armature: 타겟 아마추어 이름 (사용자 캐릭터)

    Returns:
        본 매핑 딕셔너리 {소스 본: 타겟 본}

    Raises:
        ValueError: 아마추어를 찾을 수 없는 경우
    """
    source = bpy.data.objects.get(source_armature)
    target = bpy.data.objects.get(target_armature)

    if not source or not target:
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
    logger.debug("Source bones: %d, Target bones: %d", len(source_bones), len(target_bones))

    bone_map = fuzzy_match_bones(
        source_bones=source_bones,
        target_bones=target_bones,
        known_aliases=mixamo_bone_aliases,
        threshold=0.6,  # 60% 이상 유사도
        prefer_exact=True  # 정확한 매칭 우선
    )

    # 매칭 품질 보고서
    quality_report = get_match_quality_report(bone_map)
    logger.info("Auto-mapped %d bones", quality_report['total_mappings'])
    logger.info("Quality: %s", quality_report['quality'].upper())
    logger.info("Critical bones: %s", quality_report['critical_bones_mapped'])
    logger.debug("Bone mapping: %s", bone_map)

    # 콘솔 출력 (사용자에게 피드백)
    print(f"✅ Auto-mapped {quality_report['total_mappings']} bones")
    print(f"   Quality: {quality_report['quality'].upper()}")
    print(f"   Critical bones: {quality_report['critical_bones_mapped']}")

    return bone_map


def get_preset_bone_mapping(preset: str) -> Dict[str, str]:
    """
    미리 정의된 본 매핑 프리셋 반환

    Args:
        preset: 프리셋 이름 (예: "mixamo_to_rigify")

    Returns:
        본 매핑 딕셔너리
    """
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
            # ... 더 많은 매핑
        }
    }

    return presets.get(preset, {})


def store_bone_mapping(
    source_armature: str, target_armature: str, bone_mapping: Dict[str, str]
) -> str:
    """
    본 매핑을 Scene 속성에 저장

    Args:
        source_armature: 소스 아마추어 이름
        target_armature: 타겟 아마추어 이름
        bone_mapping: 본 매핑 딕셔너리

    Returns:
        작업 결과 메시지
    """
    scene = bpy.context.scene

    # 기존 매핑 클리어
    scene.bone_mapping_items.clear()

    # 새 매핑 저장
    for source_bone, target_bone in bone_mapping.items():
        item = scene.bone_mapping_items.add()
        item.source_bone = source_bone
        item.target_bone = target_bone

    # 아마추어 정보 저장
    scene.bone_mapping_source_armature = source_armature
    scene.bone_mapping_target_armature = target_armature

    print(f"✅ Stored bone mapping: {len(bone_mapping)} bones")
    return f"Bone mapping stored ({len(bone_mapping)} bones)"


def load_bone_mapping(source_armature: str, target_armature: str) -> Dict[str, str]:
    """
    Scene 속성에서 본 매핑 로드

    Args:
        source_armature: 소스 아마추어 이름
        target_armature: 타겟 아마추어 이름

    Returns:
        본 매핑 딕셔너리

    Raises:
        ValueError: 저장된 매핑이 없거나 아마추어가 일치하지 않는 경우
    """
    scene = bpy.context.scene

    # 아마추어 검증
    if not scene.bone_mapping_source_armature:
        raise ValueError(
            "No bone mapping stored. Please generate mapping first using "
            "BoneMapping.show command."
        )

    if (scene.bone_mapping_source_armature != source_armature or
        scene.bone_mapping_target_armature != target_armature):
        raise ValueError(
            f"Stored mapping for ({scene.bone_mapping_source_armature} → "
            f"{scene.bone_mapping_target_armature}) doesn't match requested "
            f"({source_armature} → {target_armature})"
        )

    # 매핑 로드
    bone_mapping = {}
    for item in scene.bone_mapping_items:
        bone_mapping[item.source_bone] = item.target_bone

    if not bone_mapping:
        raise ValueError("Bone mapping is empty. Please generate mapping first.")

    print(f"✅ Loaded bone mapping: {len(bone_mapping)} bones")
    return bone_mapping


# ============================================================================
# Animation Retargeting Functions
# ============================================================================

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
        preserve_location: 위치 보존 여부

    Returns:
        작업 결과 메시지

    Raises:
        ValueError: 아마추어를 찾을 수 없거나 애니메이션이 없는 경우
    """
    source = bpy.data.objects.get(source_armature)
    target = bpy.data.objects.get(target_armature)

    if not source or not target:
        raise ValueError("Source or target armature not found")

    if not source.animation_data or not source.animation_data.action:
        raise ValueError("Source armature has no animation")

    # 타겟 아마추어 선택
    bpy.context.view_layer.objects.active = target
    target.select_set(True)

    # Pose 모드로 전환
    bpy.ops.object.mode_set(mode='POSE')

    # 각 본에 대해 컨스트레인트 생성
    for source_bone_name, target_bone_name in bone_map.items():
        if source_bone_name not in source.pose.bones:
            continue
        if target_bone_name not in target.pose.bones:
            continue

        target_bone = target.pose.bones[target_bone_name]

        # Rotation constraint
        if preserve_rotation:
            constraint = target_bone.constraints.new('COPY_ROTATION')
            constraint.target = source
            constraint.subtarget = source_bone_name

        # Location constraint (일반적으로 루트 본만)
        if preserve_location and source_bone_name == "Hips":
            constraint = target_bone.constraints.new('COPY_LOCATION')
            constraint.target = source
            constraint.subtarget = source_bone_name

    # 컨스트레인트를 키프레임으로 베이크
    bpy.ops.nla.bake(
        frame_start=bpy.context.scene.frame_start,
        frame_end=bpy.context.scene.frame_end,
        only_selected=False,
        visual_keying=True,
        clear_constraints=True,
        bake_types={'POSE'}
    )

    bpy.ops.object.mode_set(mode='OBJECT')

    return f"Animation retargeted to {target_armature}"


# ============================================================================
# Animation Playback Functions
# ============================================================================

def list_animations(armature_name: str) -> List[str]:
    """
    아마추어의 애니메이션 액션 목록 반환

    Args:
        armature_name: 아마추어 이름

    Returns:
        액션 이름 리스트

    Raises:
        ValueError: 아마추어를 찾을 수 없는 경우
    """
    armature = bpy.data.objects.get(armature_name)
    if not armature:
        raise ValueError(f"Armature '{armature_name}' not found")

    actions = []
    if armature.animation_data:
        for action in bpy.data.actions:
            if action.id_root == 'OBJECT':
                actions.append(action.name)

    return actions


def play_animation(armature_name: str, action_name: str, loop: bool = True) -> str:
    """
    애니메이션 재생

    Args:
        armature_name: 아마추어 이름
        action_name: 액션 이름
        loop: 루프 재생 여부

    Returns:
        작업 결과 메시지

    Raises:
        ValueError: 아마추어 또는 액션을 찾을 수 없는 경우
    """
    armature = bpy.data.objects.get(armature_name)
    if not armature:
        raise ValueError(f"Armature '{armature_name}' not found")

    action = bpy.data.actions.get(action_name)
    if not action:
        raise ValueError(f"Action '{action_name}' not found")

    if not armature.animation_data:
        armature.animation_data_create()

    armature.animation_data.action = action
    bpy.context.scene.frame_set(int(action.frame_range[0]))
    bpy.ops.screen.animation_play()

    return f"Playing {action_name}"


def stop_animation() -> str:
    """
    애니메이션 중지

    Returns:
        작업 결과 메시지
    """
    bpy.ops.screen.animation_cancel()
    return "Animation stopped"


def add_to_nla(armature_name: str, action_name: str, track_name: str) -> str:
    """
    NLA 트랙에 애니메이션 추가

    Args:
        armature_name: 아마추어 이름
        action_name: 액션 이름
        track_name: NLA 트랙 이름

    Returns:
        작업 결과 메시지

    Raises:
        ValueError: 아마추어 또는 액션을 찾을 수 없는 경우
    """
    armature = bpy.data.objects.get(armature_name)
    action = bpy.data.actions.get(action_name)

    if not armature or not action:
        raise ValueError("Armature or action not found")

    if not armature.animation_data:
        armature.animation_data_create()

    nla_track = armature.animation_data.nla_tracks.new()
    nla_track.name = track_name
    nla_track.strips.new(action.name, int(action.frame_range[0]), action)

    return f"Added {action_name} to NLA track {track_name}"


# ============================================================================
# Import Functions
# ============================================================================

def import_fbx(filepath: str) -> str:
    """
    FBX 파일 임포트

    Args:
        filepath: FBX 파일 경로

    Returns:
        작업 결과 메시지

    Raises:
        ValueError: 파일을 찾을 수 없는 경우
    """
    if not os.path.exists(filepath):
        raise ValueError(f"File not found: {filepath}")

    bpy.ops.import_scene.fbx(filepath=filepath)
    return f"Imported {filepath}"


def import_dae(filepath: str) -> str:
    """
    Collada (.dae) 파일 임포트

    Args:
        filepath: DAE 파일 경로

    Returns:
        작업 결과 메시지

    Raises:
        ValueError: 파일을 찾을 수 없는 경우
    """
    if not os.path.exists(filepath):
        raise ValueError(f"File not found: {filepath}")

    bpy.ops.wm.collada_import(filepath=filepath)
    return f"Imported {filepath}"
