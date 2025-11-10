"""
Material Operations
머티리얼 및 셰이더 관련 작업을 처리하는 명령 핸들러
"""

import bpy
from typing import Dict, List, Tuple, Optional, Any
from ..utils.logger import get_logger

logger = get_logger(__name__)


# ============================================================================
# Material Creation (머티리얼 생성)
# ============================================================================

def create_material(
    name: str,
    use_nodes: bool = True
) -> Dict[str, Any]:
    """
    머티리얼 생성

    Args:
        name: 머티리얼 이름
        use_nodes: 노드 시스템 사용 여부 (기본값: True)

    Returns:
        생성된 머티리얼 정보
    """
    logger.info(f"Creating material: {name}")

    # 기존 머티리얼 확인
    if name in bpy.data.materials:
        logger.warn(f"Material '{name}' already exists, returning existing")
        mat = bpy.data.materials[name]
    else:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = use_nodes

    return {
        'name': mat.name,
        'use_nodes': mat.use_nodes
    }


def list_materials() -> List[Dict[str, Any]]:
    """
    모든 머티리얼 목록 조회

    Returns:
        머티리얼 목록
    """
    logger.info("Listing all materials")

    materials = []
    for mat in bpy.data.materials:
        materials.append({
            'name': mat.name,
            'use_nodes': mat.use_nodes,
            'users': mat.users  # 사용 중인 오브젝트 수
        })

    return materials


def delete_material(name: str) -> Dict[str, str]:
    """
    머티리얼 삭제

    Args:
        name: 머티리얼 이름

    Returns:
        삭제 결과
    """
    logger.info(f"Deleting material: {name}")

    mat = bpy.data.materials.get(name)
    if not mat:
        raise ValueError(f"Material '{name}' not found")

    bpy.data.materials.remove(mat)

    return {'status': 'success', 'message': f"Material '{name}' deleted"}


# ============================================================================
# Material Assignment (머티리얼 할당)
# ============================================================================

def assign_material(
    object_name: str,
    material_name: str,
    slot_index: int = 0
) -> Dict[str, Any]:
    """
    오브젝트에 머티리얼 할당

    Args:
        object_name: 오브젝트 이름
        material_name: 머티리얼 이름
        slot_index: 머티리얼 슬롯 인덱스 (기본값: 0)

    Returns:
        할당 결과
    """
    logger.info(f"Assigning material '{material_name}' to object '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    mat = bpy.data.materials.get(material_name)
    if not mat:
        raise ValueError(f"Material '{material_name}' not found")

    # 머티리얼 슬롯이 없으면 생성
    if len(obj.data.materials) == 0:
        obj.data.materials.append(mat)
    else:
        # 기존 슬롯에 할당
        if slot_index < len(obj.data.materials):
            obj.data.materials[slot_index] = mat
        else:
            obj.data.materials.append(mat)

    return {
        'object': object_name,
        'material': material_name,
        'slot_index': slot_index
    }


def list_object_materials(object_name: str) -> List[Dict[str, Any]]:
    """
    오브젝트의 머티리얼 슬롯 목록 조회

    Args:
        object_name: 오브젝트 이름

    Returns:
        머티리얼 슬롯 목록
    """
    logger.info(f"Listing materials for object: {object_name}")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    materials = []
    for i, mat_slot in enumerate(obj.material_slots):
        materials.append({
            'slot_index': i,
            'material': mat_slot.material.name if mat_slot.material else None
        })

    return materials


# ============================================================================
# Material Properties (머티리얼 속성)
# ============================================================================

def set_material_base_color(
    material_name: str,
    color: Tuple[float, float, float, float]
) -> Dict[str, Any]:
    """
    머티리얼 기본 색상 설정 (Principled BSDF)

    Args:
        material_name: 머티리얼 이름
        color: RGBA 색상 (0.0 ~ 1.0)

    Returns:
        설정 결과
    """
    logger.info(f"Setting base color for material: {material_name}")

    mat = bpy.data.materials.get(material_name)
    if not mat:
        raise ValueError(f"Material '{material_name}' not found")

    if not mat.use_nodes:
        raise ValueError(f"Material '{material_name}' does not use nodes")

    # Principled BSDF 노드 찾기
    principled = None
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            principled = node
            break

    if not principled:
        raise ValueError(f"Principled BSDF node not found in material '{material_name}'")

    # Base Color 설정
    principled.inputs['Base Color'].default_value = color

    return {
        'material': material_name,
        'base_color': list(color)
    }


def set_material_metallic(
    material_name: str,
    metallic: float
) -> Dict[str, Any]:
    """
    머티리얼 Metallic 값 설정

    Args:
        material_name: 머티리얼 이름
        metallic: Metallic 값 (0.0 ~ 1.0)

    Returns:
        설정 결과
    """
    logger.info(f"Setting metallic for material: {material_name}")

    mat = bpy.data.materials.get(material_name)
    if not mat or not mat.use_nodes:
        raise ValueError(f"Material '{material_name}' not found or does not use nodes")

    # Principled BSDF 노드 찾기
    principled = None
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            principled = node
            break

    if not principled:
        raise ValueError(f"Principled BSDF node not found")

    principled.inputs['Metallic'].default_value = metallic

    return {
        'material': material_name,
        'metallic': metallic
    }


def set_material_roughness(
    material_name: str,
    roughness: float
) -> Dict[str, Any]:
    """
    머티리얼 Roughness 값 설정

    Args:
        material_name: 머티리얼 이름
        roughness: Roughness 값 (0.0 ~ 1.0)

    Returns:
        설정 결과
    """
    logger.info(f"Setting roughness for material: {material_name}")

    mat = bpy.data.materials.get(material_name)
    if not mat or not mat.use_nodes:
        raise ValueError(f"Material '{material_name}' not found or does not use nodes")

    # Principled BSDF 노드 찾기
    principled = None
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            principled = node
            break

    if not principled:
        raise ValueError(f"Principled BSDF node not found")

    principled.inputs['Roughness'].default_value = roughness

    return {
        'material': material_name,
        'roughness': roughness
    }


def set_material_emission(
    material_name: str,
    color: Tuple[float, float, float, float],
    strength: float = 1.0
) -> Dict[str, Any]:
    """
    머티리얼 Emission 설정

    Args:
        material_name: 머티리얼 이름
        color: Emission 색상 RGBA (0.0 ~ 1.0)
        strength: Emission 강도 (기본값: 1.0)

    Returns:
        설정 결과
    """
    logger.info(f"Setting emission for material: {material_name}")

    mat = bpy.data.materials.get(material_name)
    if not mat or not mat.use_nodes:
        raise ValueError(f"Material '{material_name}' not found or does not use nodes")

    # Principled BSDF 노드 찾기
    principled = None
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            principled = node
            break

    if not principled:
        raise ValueError(f"Principled BSDF node not found")

    principled.inputs['Emission'].default_value = color
    principled.inputs['Emission Strength'].default_value = strength

    return {
        'material': material_name,
        'emission_color': list(color),
        'emission_strength': strength
    }


def get_material_properties(material_name: str) -> Dict[str, Any]:
    """
    머티리얼 속성 조회

    Args:
        material_name: 머티리얼 이름

    Returns:
        머티리얼 속성
    """
    logger.info(f"Getting properties for material: {material_name}")

    mat = bpy.data.materials.get(material_name)
    if not mat:
        raise ValueError(f"Material '{material_name}' not found")

    props = {
        'name': mat.name,
        'use_nodes': mat.use_nodes
    }

    if mat.use_nodes:
        # Principled BSDF 속성 가져오기
        principled = None
        for node in mat.node_tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                principled = node
                break

        if principled:
            props['base_color'] = list(principled.inputs['Base Color'].default_value)
            props['metallic'] = principled.inputs['Metallic'].default_value
            props['roughness'] = principled.inputs['Roughness'].default_value
            props['emission'] = list(principled.inputs['Emission'].default_value)
            props['emission_strength'] = principled.inputs['Emission Strength'].default_value

    return props
