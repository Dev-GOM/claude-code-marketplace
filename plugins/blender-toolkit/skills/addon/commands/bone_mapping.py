"""
Bone Mapping 관련 명령 핸들러
본 매핑 저장/로드, UI 표시
"""

import bpy
from typing import Dict
from ..utils.logger import get_logger

logger = get_logger(__name__)


def store_bone_mapping(source_armature: str, target_armature: str, bone_mapping: Dict[str, str]) -> str:
    """
    본 매핑을 Scene 속성에 저장

    Args:
        source_armature: 소스 아마추어 이름
        target_armature: 타겟 아마추어 이름
        bone_mapping: 본 매핑 딕셔너리

    Returns:
        결과 메시지
    """
    logger.info(f"Storing bone mapping: {source_armature} -> {target_armature} ({len(bone_mapping)} bones)")

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

    logger.info(f"Stored {len(bone_mapping)} bone mappings")
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
        ValueError: 저장된 매핑이 없거나 불일치하는 경우
    """
    logger.info(f"Loading bone mapping: {source_armature} -> {target_armature}")

    scene = bpy.context.scene

    # 아마추어 검증
    if not scene.bone_mapping_source_armature:
        logger.error("No bone mapping stored")
        raise ValueError("No bone mapping stored. Please generate mapping first using BoneMapping.show command.")

    if (scene.bone_mapping_source_armature != source_armature or
        scene.bone_mapping_target_armature != target_armature):
        logger.error("Stored mapping doesn't match requested armatures")
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
        logger.error("Bone mapping is empty")
        raise ValueError("Bone mapping is empty. Please generate mapping first.")

    logger.info(f"Loaded {len(bone_mapping)} bone mappings")
    print(f"✅ Loaded bone mapping: {len(bone_mapping)} bones")
    return bone_mapping
