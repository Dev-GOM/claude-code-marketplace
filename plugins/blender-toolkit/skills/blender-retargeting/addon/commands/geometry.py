"""
Geometry Operations
도형 생성, 수정, 삭제 등 기하학적 작업을 처리하는 명령 핸들러
"""

import bpy
import bmesh
from typing import Dict, List, Tuple, Optional, Any
from ..utils.logger import get_logger

logger = get_logger(__name__)


# ============================================================================
# Primitive Creation (기본 도형 생성)
# ============================================================================

def create_cube(
    location: Tuple[float, float, float] = (0, 0, 0),
    size: float = 2.0,
    name: Optional[str] = None
) -> Dict[str, Any]:
    """
    큐브 생성

    Args:
        location: 위치 (x, y, z)
        size: 크기
        name: 오브젝트 이름 (None이면 자동 생성)

    Returns:
        생성된 오브젝트 정보
    """
    logger.info(f"Creating cube at {location} with size {size}")

    bpy.ops.mesh.primitive_cube_add(size=size, location=location)
    obj = bpy.context.active_object

    if name:
        obj.name = name

    return {
        'name': obj.name,
        'type': obj.type,
        'location': list(obj.location),
        'vertices': len(obj.data.vertices),
        'faces': len(obj.data.polygons)
    }


def create_sphere(
    location: Tuple[float, float, float] = (0, 0, 0),
    radius: float = 1.0,
    segments: int = 32,
    ring_count: int = 16,
    name: Optional[str] = None
) -> Dict[str, Any]:
    """
    구(Sphere) 생성

    Args:
        location: 위치 (x, y, z)
        radius: 반지름
        segments: 세그먼트 수 (수평)
        ring_count: 링 수 (수직)
        name: 오브젝트 이름

    Returns:
        생성된 오브젝트 정보
    """
    logger.info(f"Creating sphere at {location} with radius {radius}")

    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius,
        segments=segments,
        ring_count=ring_count,
        location=location
    )
    obj = bpy.context.active_object

    if name:
        obj.name = name

    return {
        'name': obj.name,
        'type': obj.type,
        'location': list(obj.location),
        'vertices': len(obj.data.vertices),
        'faces': len(obj.data.polygons)
    }


def create_cylinder(
    location: Tuple[float, float, float] = (0, 0, 0),
    radius: float = 1.0,
    depth: float = 2.0,
    vertices: int = 32,
    name: Optional[str] = None
) -> Dict[str, Any]:
    """
    실린더 생성

    Args:
        location: 위치 (x, y, z)
        radius: 반지름
        depth: 높이
        vertices: 버텍스 수
        name: 오브젝트 이름

    Returns:
        생성된 오브젝트 정보
    """
    logger.info(f"Creating cylinder at {location}")

    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=depth,
        vertices=vertices,
        location=location
    )
    obj = bpy.context.active_object

    if name:
        obj.name = name

    return {
        'name': obj.name,
        'type': obj.type,
        'location': list(obj.location),
        'vertices': len(obj.data.vertices),
        'faces': len(obj.data.polygons)
    }


def create_plane(
    location: Tuple[float, float, float] = (0, 0, 0),
    size: float = 2.0,
    name: Optional[str] = None
) -> Dict[str, Any]:
    """
    평면(Plane) 생성

    Args:
        location: 위치 (x, y, z)
        size: 크기
        name: 오브젝트 이름

    Returns:
        생성된 오브젝트 정보
    """
    logger.info(f"Creating plane at {location}")

    bpy.ops.mesh.primitive_plane_add(size=size, location=location)
    obj = bpy.context.active_object

    if name:
        obj.name = name

    return {
        'name': obj.name,
        'type': obj.type,
        'location': list(obj.location),
        'vertices': len(obj.data.vertices),
        'faces': len(obj.data.polygons)
    }


def create_cone(
    location: Tuple[float, float, float] = (0, 0, 0),
    radius1: float = 1.0,
    depth: float = 2.0,
    vertices: int = 32,
    name: Optional[str] = None
) -> Dict[str, Any]:
    """
    원뿔(Cone) 생성

    Args:
        location: 위치 (x, y, z)
        radius1: 아래 반지름
        depth: 높이
        vertices: 버텍스 수
        name: 오브젝트 이름

    Returns:
        생성된 오브젝트 정보
    """
    logger.info(f"Creating cone at {location}")

    bpy.ops.mesh.primitive_cone_add(
        radius1=radius1,
        depth=depth,
        vertices=vertices,
        location=location
    )
    obj = bpy.context.active_object

    if name:
        obj.name = name

    return {
        'name': obj.name,
        'type': obj.type,
        'location': list(obj.location),
        'vertices': len(obj.data.vertices),
        'faces': len(obj.data.polygons)
    }


def create_torus(
    location: Tuple[float, float, float] = (0, 0, 0),
    major_radius: float = 1.0,
    minor_radius: float = 0.25,
    major_segments: int = 48,
    minor_segments: int = 12,
    name: Optional[str] = None
) -> Dict[str, Any]:
    """
    토러스(Torus) 생성

    Args:
        location: 위치 (x, y, z)
        major_radius: 주 반지름
        minor_radius: 부 반지름
        major_segments: 주 세그먼트 수
        minor_segments: 부 세그먼트 수
        name: 오브젝트 이름

    Returns:
        생성된 오브젝트 정보
    """
    logger.info(f"Creating torus at {location}")

    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=location
    )
    obj = bpy.context.active_object

    if name:
        obj.name = name

    return {
        'name': obj.name,
        'type': obj.type,
        'location': list(obj.location),
        'vertices': len(obj.data.vertices),
        'faces': len(obj.data.polygons)
    }


# ============================================================================
# Object Operations (오브젝트 작업)
# ============================================================================

def delete_object(name: str) -> Dict[str, str]:
    """
    오브젝트 삭제

    Args:
        name: 오브젝트 이름

    Returns:
        삭제 결과
    """
    logger.info(f"Deleting object: {name}")

    obj = bpy.data.objects.get(name)
    if not obj:
        raise ValueError(f"Object '{name}' not found")

    bpy.data.objects.remove(obj, do_unlink=True)

    return {'status': 'success', 'message': f"Object '{name}' deleted"}


def transform_object(
    name: str,
    location: Optional[Tuple[float, float, float]] = None,
    rotation: Optional[Tuple[float, float, float]] = None,
    scale: Optional[Tuple[float, float, float]] = None
) -> Dict[str, Any]:
    """
    오브젝트 변형 (이동, 회전, 스케일)

    Args:
        name: 오브젝트 이름
        location: 위치 (x, y, z)
        rotation: 회전 (x, y, z) in radians
        scale: 스케일 (x, y, z)

    Returns:
        변형된 오브젝트 정보
    """
    logger.info(f"Transforming object: {name}")

    obj = bpy.data.objects.get(name)
    if not obj:
        raise ValueError(f"Object '{name}' not found")

    if location:
        obj.location = location

    if rotation:
        obj.rotation_euler = rotation

    if scale:
        obj.scale = scale

    return {
        'name': obj.name,
        'location': list(obj.location),
        'rotation': list(obj.rotation_euler),
        'scale': list(obj.scale)
    }


def duplicate_object(
    name: str,
    new_name: Optional[str] = None,
    location: Optional[Tuple[float, float, float]] = None
) -> Dict[str, Any]:
    """
    오브젝트 복제

    Args:
        name: 원본 오브젝트 이름
        new_name: 새 오브젝트 이름 (None이면 자동 생성)
        location: 새 위치 (None이면 원본 위치)

    Returns:
        복제된 오브젝트 정보
    """
    logger.info(f"Duplicating object: {name}")

    obj = bpy.data.objects.get(name)
    if not obj:
        raise ValueError(f"Object '{name}' not found")

    # 복제
    new_obj = obj.copy()
    new_obj.data = obj.data.copy()

    if new_name:
        new_obj.name = new_name

    if location:
        new_obj.location = location

    # 씬에 추가
    bpy.context.collection.objects.link(new_obj)

    return {
        'name': new_obj.name,
        'type': new_obj.type,
        'location': list(new_obj.location)
    }


def list_objects(object_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    씬의 오브젝트 목록 조회

    Args:
        object_type: 오브젝트 타입 필터 (None이면 전체)
                     예: 'MESH', 'ARMATURE', 'CAMERA', 'LIGHT'

    Returns:
        오브젝트 목록
    """
    logger.info(f"Listing objects (type: {object_type or 'ALL'})")

    objects = []
    for obj in bpy.data.objects:
        if object_type and obj.type != object_type:
            continue

        objects.append({
            'name': obj.name,
            'type': obj.type,
            'location': list(obj.location),
            'rotation': list(obj.rotation_euler),
            'scale': list(obj.scale)
        })

    return objects


# ============================================================================
# Vertex Operations (버텍스 작업)
# ============================================================================

def get_vertices(name: str) -> List[Dict[str, Any]]:
    """
    오브젝트의 버텍스 정보 조회

    Args:
        name: 오브젝트 이름

    Returns:
        버텍스 목록
    """
    logger.info(f"Getting vertices for object: {name}")

    obj = bpy.data.objects.get(name)
    if not obj or obj.type != 'MESH':
        raise ValueError(f"Mesh object '{name}' not found")

    vertices = []
    for i, vert in enumerate(obj.data.vertices):
        vertices.append({
            'index': i,
            'co': list(vert.co),
            'normal': list(vert.normal)
        })

    return vertices


def move_vertex(
    object_name: str,
    vertex_index: int,
    new_position: Tuple[float, float, float]
) -> Dict[str, Any]:
    """
    버텍스 이동

    Args:
        object_name: 오브젝트 이름
        vertex_index: 버텍스 인덱스
        new_position: 새 위치 (x, y, z)

    Returns:
        수정된 버텍스 정보
    """
    logger.info(f"Moving vertex {vertex_index} in object {object_name}")

    obj = bpy.data.objects.get(object_name)
    if not obj or obj.type != 'MESH':
        raise ValueError(f"Mesh object '{object_name}' not found")

    mesh = obj.data
    if vertex_index >= len(mesh.vertices):
        raise ValueError(f"Vertex index {vertex_index} out of range")

    mesh.vertices[vertex_index].co = new_position
    mesh.update()

    return {
        'object': object_name,
        'vertex_index': vertex_index,
        'position': list(mesh.vertices[vertex_index].co)
    }


def subdivide_mesh(
    name: str,
    cuts: int = 1
) -> Dict[str, Any]:
    """
    메쉬 세분화 (Subdivide)

    Args:
        name: 오브젝트 이름
        cuts: 세분화 횟수

    Returns:
        세분화된 메쉬 정보
    """
    logger.info(f"Subdividing mesh: {name} (cuts: {cuts})")

    obj = bpy.data.objects.get(name)
    if not obj or obj.type != 'MESH':
        raise ValueError(f"Mesh object '{name}' not found")

    # Edit 모드로 전환
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')

    # 모든 에지 선택
    bpy.ops.mesh.select_all(action='SELECT')

    # 세분화
    bpy.ops.mesh.subdivide(number_cuts=cuts)

    # Object 모드로 복귀
    bpy.ops.object.mode_set(mode='OBJECT')

    return {
        'name': obj.name,
        'vertices': len(obj.data.vertices),
        'edges': len(obj.data.edges),
        'faces': len(obj.data.polygons)
    }


def extrude_face(
    object_name: str,
    face_index: int,
    offset: float = 1.0
) -> Dict[str, Any]:
    """
    페이스 돌출 (Extrude)

    Args:
        object_name: 오브젝트 이름
        face_index: 페이스 인덱스
        offset: 돌출 거리

    Returns:
        돌출 결과 정보
    """
    logger.info(f"Extruding face {face_index} in object {object_name}")

    obj = bpy.data.objects.get(object_name)
    if not obj or obj.type != 'MESH':
        raise ValueError(f"Mesh object '{object_name}' not found")

    # BMesh를 사용한 extrude
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)

    # 페이스 선택
    if face_index >= len(bm.faces):
        bm.free()
        raise ValueError(f"Face index {face_index} out of range")

    face = bm.faces[face_index]

    # Extrude
    ret = bmesh.ops.extrude_face_region(bm, geom=[face])
    extruded_verts = [v for v in ret['geom'] if isinstance(v, bmesh.types.BMVert)]

    # 오프셋 적용
    for v in extruded_verts:
        v.co += face.normal * offset

    # 메쉬 업데이트
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    return {
        'object': object_name,
        'face_index': face_index,
        'vertices': len(mesh.vertices),
        'faces': len(mesh.polygons)
    }
