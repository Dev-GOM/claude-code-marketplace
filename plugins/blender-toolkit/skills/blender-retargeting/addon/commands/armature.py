"""
Armature 관련 명령 핸들러
아마추어 정보 조회 및 본 구조 분석
"""

import bpy
from typing import List, Dict
from ..utils.logger import get_logger

logger = get_logger(__name__)


def list_armatures() -> List[str]:
    """
    모든 아마추어 오브젝트 목록 반환

    Returns:
        아마추어 이름 리스트
    """
    logger.debug("Listing all armatures")
    armatures = [obj.name for obj in bpy.data.objects if obj.type == 'ARMATURE']
    logger.info(f"Found {len(armatures)} armatures")
    return armatures


def get_bones(armature_name: str) -> List[Dict]:
    """
    아마추어의 본 정보 가져오기

    Args:
        armature_name: 아마추어 이름

    Returns:
        본 정보 리스트 (name, parent, children)

    Raises:
        ValueError: 아마추어를 찾을 수 없거나 타입이 잘못된 경우
    """
    logger.debug(f"Getting bones for armature: {armature_name}")

    armature = bpy.data.objects.get(armature_name)
    if not armature or armature.type != 'ARMATURE':
        logger.error(f"Armature '{armature_name}' not found or invalid type")
        raise ValueError(f"Armature '{armature_name}' not found")

    bones = []
    for bone in armature.data.bones:
        bones.append({
            "name": bone.name,
            "parent": bone.parent.name if bone.parent else None,
            "children": [child.name for child in bone.children]
        })

    logger.info(f"Retrieved {len(bones)} bones from {armature_name}")
    return bones
