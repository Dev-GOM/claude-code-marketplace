"""
Modifier Operations
모디파이어 관리 명령 핸들러
"""

import bpy
from typing import Dict, List, Any, Optional
from ..utils.logger import get_logger

logger = get_logger(__name__)


def add_modifier(object_name: str, modifier_type: str, name: Optional[str] = None) -> Dict[str, Any]:
    """오브젝트에 모디파이어 추가

    Args:
        object_name: 대상 오브젝트 이름
        modifier_type: 모디파이어 타입 (SUBSURF, MIRROR, ARRAY, BEVEL, etc.)
        name: 모디파이어 이름 (optional)

    Supported modifier types:
        - SUBSURF: Subdivision Surface
        - MIRROR: Mirror
        - ARRAY: Array
        - BEVEL: Bevel
        - BOOLEAN: Boolean
        - SOLIDIFY: Solidify
        - WIREFRAME: Wireframe
        - SKIN: Skin
        - ARMATURE: Armature
        - LATTICE: Lattice
        - CURVE: Curve
        - SIMPLE_DEFORM: Simple Deform
        - CAST: Cast
        - DISPLACE: Displace
        - HOOK: Hook
        - LAPLACIANDEFORM: Laplacian Deform
        - MESH_DEFORM: Mesh Deform
        - SHRINKWRAP: Shrinkwrap
        - WAVE: Wave
        - OCEAN: Ocean
        - PARTICLE_SYSTEM: Particle System
        - CLOTH: Cloth
        - COLLISION: Collision
        - DYNAMIC_PAINT: Dynamic Paint
        - EXPLODE: Explode
        - FLUID: Fluid
        - SOFT_BODY: Soft Body
    """
    logger.info(f"Adding modifier '{modifier_type}' to '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    mod = obj.modifiers.new(name or modifier_type, modifier_type)

    return {
        'name': mod.name,
        'type': mod.type,
        'show_viewport': mod.show_viewport,
        'show_render': mod.show_render
    }


def apply_modifier(object_name: str, modifier_name: str) -> Dict[str, str]:
    """모디파이어 적용"""
    logger.info(f"Applying modifier '{modifier_name}' on '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    mod = obj.modifiers.get(modifier_name)
    if not mod:
        raise ValueError(f"Modifier '{modifier_name}' not found on '{object_name}'")

    # 모디파이어 적용은 Edit 모드에서는 할 수 없음
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    # 오브젝트 선택 및 활성화
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # 모디파이어 적용
    bpy.ops.object.modifier_apply(modifier=modifier_name)

    return {'status': 'success', 'message': f"Applied modifier '{modifier_name}' to '{object_name}'"}


def list_modifiers(object_name: str) -> List[Dict[str, Any]]:
    """오브젝트의 모디파이어 목록 조회"""
    logger.info(f"Listing modifiers for '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    modifiers = []
    for mod in obj.modifiers:
        mod_info = {
            'name': mod.name,
            'type': mod.type,
            'show_viewport': mod.show_viewport,
            'show_render': mod.show_render,
        }

        # 타입별 특화 속성 추가
        if mod.type == 'SUBSURF':
            mod_info['levels'] = mod.levels
            mod_info['render_levels'] = mod.render_levels
        elif mod.type == 'MIRROR':
            mod_info['use_axis'] = [mod.use_axis[0], mod.use_axis[1], mod.use_axis[2]]
            mod_info['use_bisect_axis'] = [mod.use_bisect_axis[0], mod.use_bisect_axis[1], mod.use_bisect_axis[2]]
        elif mod.type == 'ARRAY':
            mod_info['count'] = mod.count
            mod_info['use_relative_offset'] = mod.use_relative_offset
            mod_info['relative_offset_displace'] = list(mod.relative_offset_displace)
        elif mod.type == 'BEVEL':
            mod_info['width'] = mod.width
            mod_info['segments'] = mod.segments
            mod_info['limit_method'] = mod.limit_method
        elif mod.type == 'BOOLEAN':
            mod_info['operation'] = mod.operation
            mod_info['object'] = mod.object.name if mod.object else None
        elif mod.type == 'SOLIDIFY':
            mod_info['thickness'] = mod.thickness
            mod_info['offset'] = mod.offset
        elif mod.type == 'ARMATURE':
            mod_info['object'] = mod.object.name if mod.object else None
            mod_info['use_vertex_groups'] = mod.use_vertex_groups
        elif mod.type == 'LATTICE':
            mod_info['object'] = mod.object.name if mod.object else None
        elif mod.type == 'CURVE':
            mod_info['object'] = mod.object.name if mod.object else None
        elif mod.type == 'SIMPLE_DEFORM':
            mod_info['deform_method'] = mod.deform_method
            mod_info['factor'] = mod.factor
        elif mod.type == 'CAST':
            mod_info['cast_type'] = mod.cast_type
            mod_info['factor'] = mod.factor
        elif mod.type == 'DISPLACE':
            mod_info['strength'] = mod.strength
            mod_info['direction'] = mod.direction
        elif mod.type == 'WAVE':
            mod_info['time_offset'] = mod.time_offset
            mod_info['height'] = mod.height

        modifiers.append(mod_info)

    return modifiers


def remove_modifier(object_name: str, modifier_name: str) -> Dict[str, str]:
    """모디파이어 제거"""
    logger.info(f"Removing modifier '{modifier_name}' from '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    mod = obj.modifiers.get(modifier_name)
    if not mod:
        raise ValueError(f"Modifier '{modifier_name}' not found on '{object_name}'")

    obj.modifiers.remove(mod)

    return {'status': 'success', 'message': f"Removed modifier '{modifier_name}' from '{object_name}'"}


def toggle_modifier(object_name: str, modifier_name: str,
                   viewport: Optional[bool] = None,
                   render: Optional[bool] = None) -> Dict[str, Any]:
    """모디파이어 활성화/비활성화

    Args:
        object_name: 대상 오브젝트 이름
        modifier_name: 모디파이어 이름
        viewport: 뷰포트 표시 on/off (None이면 토글)
        render: 렌더 표시 on/off (None이면 토글)
    """
    logger.info(f"Toggling modifier '{modifier_name}' on '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    mod = obj.modifiers.get(modifier_name)
    if not mod:
        raise ValueError(f"Modifier '{modifier_name}' not found on '{object_name}'")

    if viewport is not None:
        mod.show_viewport = viewport
    else:
        mod.show_viewport = not mod.show_viewport

    if render is not None:
        mod.show_render = render
    else:
        mod.show_render = not mod.show_render

    return {
        'name': mod.name,
        'show_viewport': mod.show_viewport,
        'show_render': mod.show_render
    }


def modify_modifier_properties(object_name: str, modifier_name: str, **properties) -> Dict[str, Any]:
    """모디파이어 속성 수정

    Args:
        object_name: 대상 오브젝트 이름
        modifier_name: 모디파이어 이름
        **properties: 수정할 속성들 (key=value 형태)

    Example properties by modifier type:
        SUBSURF: levels, render_levels
        MIRROR: use_axis, use_bisect_axis, mirror_object
        ARRAY: count, relative_offset_displace
        BEVEL: width, segments, limit_method
        BOOLEAN: operation, object
        SOLIDIFY: thickness, offset
        ARMATURE: object, use_vertex_groups
        SIMPLE_DEFORM: deform_method, factor, angle
        CAST: cast_type, factor, radius
        DISPLACE: strength, direction
    """
    logger.info(f"Modifying properties of '{modifier_name}' on '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    mod = obj.modifiers.get(modifier_name)
    if not mod:
        raise ValueError(f"Modifier '{modifier_name}' not found on '{object_name}'")

    updated_properties = {}
    for key, value in properties.items():
        if hasattr(mod, key):
            # 특수 처리가 필요한 속성들
            if key in ['use_axis', 'use_bisect_axis'] and isinstance(value, list):
                # Mirror 모디파이어의 axis는 boolean 배열
                for i, v in enumerate(value):
                    if i < 3:
                        getattr(mod, key)[i] = v
            elif key == 'relative_offset_displace' and isinstance(value, list):
                # Array 모디파이어의 offset은 Vector
                for i, v in enumerate(value):
                    if i < 3:
                        mod.relative_offset_displace[i] = v
            elif key == 'object' and isinstance(value, str):
                # 오브젝트 참조는 문자열로 받아서 변환
                target_obj = bpy.data.objects.get(value)
                if target_obj:
                    setattr(mod, key, target_obj)
                else:
                    logger.warn(f"Target object '{value}' not found for property '{key}'")
                    continue
            else:
                # 일반 속성
                setattr(mod, key, value)

            updated_properties[key] = value
        else:
            logger.warn(f"Property '{key}' not found on modifier '{modifier_name}'")

    return {
        'name': mod.name,
        'type': mod.type,
        'updated_properties': updated_properties
    }


def get_modifier_info(object_name: str, modifier_name: str) -> Dict[str, Any]:
    """특정 모디파이어의 상세 정보 조회"""
    logger.info(f"Getting info for modifier '{modifier_name}' on '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    mod = obj.modifiers.get(modifier_name)
    if not mod:
        raise ValueError(f"Modifier '{modifier_name}' not found on '{object_name}'")

    # 모든 읽기 가능한 속성을 추출
    info = {
        'name': mod.name,
        'type': mod.type,
        'show_viewport': mod.show_viewport,
        'show_render': mod.show_render,
    }

    # 타입별 모든 관련 속성 추가
    if mod.type == 'SUBSURF':
        info.update({
            'levels': mod.levels,
            'render_levels': mod.render_levels,
            'subdivision_type': mod.subdivision_type,
            'use_limit_surface': mod.use_limit_surface
        })
    elif mod.type == 'MIRROR':
        info.update({
            'use_axis': [mod.use_axis[0], mod.use_axis[1], mod.use_axis[2]],
            'use_bisect_axis': [mod.use_bisect_axis[0], mod.use_bisect_axis[1], mod.use_bisect_axis[2]],
            'use_bisect_flip_axis': [mod.use_bisect_flip_axis[0], mod.use_bisect_flip_axis[1], mod.use_bisect_flip_axis[2]],
            'mirror_object': mod.mirror_object.name if mod.mirror_object else None,
            'use_clip': mod.use_clip,
            'use_mirror_merge': mod.use_mirror_merge,
            'merge_threshold': mod.merge_threshold
        })
    elif mod.type == 'ARRAY':
        info.update({
            'count': mod.count,
            'use_constant_offset': mod.use_constant_offset,
            'use_relative_offset': mod.use_relative_offset,
            'use_object_offset': mod.use_object_offset,
            'constant_offset_displace': list(mod.constant_offset_displace),
            'relative_offset_displace': list(mod.relative_offset_displace),
            'offset_object': mod.offset_object.name if mod.offset_object else None
        })
    elif mod.type == 'BEVEL':
        info.update({
            'width': mod.width,
            'segments': mod.segments,
            'limit_method': mod.limit_method,
            'offset_type': mod.offset_type,
            'profile': mod.profile,
            'material': mod.material
        })
    elif mod.type == 'BOOLEAN':
        info.update({
            'operation': mod.operation,
            'object': mod.object.name if mod.object else None,
            'solver': mod.solver
        })
    elif mod.type == 'SOLIDIFY':
        info.update({
            'thickness': mod.thickness,
            'offset': mod.offset,
            'use_rim': mod.use_rim,
            'use_even_offset': mod.use_even_offset,
            'material_offset': mod.material_offset
        })

    return info


def reorder_modifier(object_name: str, modifier_name: str, direction: str) -> Dict[str, Any]:
    """모디파이어 순서 변경

    Args:
        object_name: 대상 오브젝트 이름
        modifier_name: 모디파이어 이름
        direction: 'UP' 또는 'DOWN'
    """
    logger.info(f"Moving modifier '{modifier_name}' {direction} on '{object_name}'")

    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")

    mod = obj.modifiers.get(modifier_name)
    if not mod:
        raise ValueError(f"Modifier '{modifier_name}' not found on '{object_name}'")

    # 오브젝트 선택 및 활성화
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    if direction.upper() == 'UP':
        bpy.ops.object.modifier_move_up(modifier=modifier_name)
    elif direction.upper() == 'DOWN':
        bpy.ops.object.modifier_move_down(modifier=modifier_name)
    else:
        raise ValueError(f"Invalid direction '{direction}'. Use 'UP' or 'DOWN'")

    # 현재 순서 반환
    modifiers = [m.name for m in obj.modifiers]

    return {
        'status': 'success',
        'modifier': modifier_name,
        'new_order': modifiers
    }
