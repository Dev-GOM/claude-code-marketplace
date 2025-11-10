"""
Command Handlers
WebSocket 명령 핸들러 모듈
"""

from .armature import list_armatures, get_bones
from .retargeting import auto_map_bones, retarget_animation, get_preset_bone_mapping
from .animation import list_animations, play_animation, stop_animation, add_to_nla
from .import_ import import_fbx, import_dae
from .bone_mapping import store_bone_mapping, load_bone_mapping
from .geometry import (
    # Primitive creation
    create_cube, create_sphere, create_cylinder, create_plane,
    create_cone, create_torus,
    # Object operations
    delete_object, transform_object, duplicate_object, list_objects,
    # Vertex operations
    get_vertices, move_vertex, subdivide_mesh, extrude_face
)
from .modifier import (
    # Modifier operations
    add_modifier, apply_modifier, list_modifiers, remove_modifier,
    toggle_modifier, modify_modifier_properties, get_modifier_info, reorder_modifier
)
from .material import (
    # Material creation
    create_material, list_materials, delete_material,
    # Material assignment
    assign_material, list_object_materials,
    # Material properties
    set_material_base_color, set_material_metallic, set_material_roughness,
    set_material_emission, get_material_properties
)

__all__ = [
    # Armature commands
    'list_armatures',
    'get_bones',
    # Retargeting commands
    'auto_map_bones',
    'retarget_animation',
    'get_preset_bone_mapping',
    # Animation commands
    'list_animations',
    'play_animation',
    'stop_animation',
    'add_to_nla',
    # Import commands
    'import_fbx',
    'import_dae',
    # Bone mapping commands
    'store_bone_mapping',
    'load_bone_mapping',
    # Geometry - Primitive creation
    'create_cube',
    'create_sphere',
    'create_cylinder',
    'create_plane',
    'create_cone',
    'create_torus',
    # Geometry - Object operations
    'delete_object',
    'transform_object',
    'duplicate_object',
    'list_objects',
    # Geometry - Vertex operations
    'get_vertices',
    'move_vertex',
    'subdivide_mesh',
    'extrude_face',
    # Modifier operations
    'add_modifier',
    'apply_modifier',
    'list_modifiers',
    'remove_modifier',
    'toggle_modifier',
    'modify_modifier_properties',
    'get_modifier_info',
    'reorder_modifier',
    # Material operations
    'create_material',
    'list_materials',
    'delete_material',
    'assign_material',
    'list_object_materials',
    'set_material_base_color',
    'set_material_metallic',
    'set_material_roughness',
    'set_material_emission',
    'get_material_properties',
]
