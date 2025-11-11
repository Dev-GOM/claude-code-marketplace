"""
Blender Toolkit WebSocket Server
Claude Code와 통신하기 위한 WebSocket 서버 애드온

설치 방법:
1. Blender > Edit > Preferences > Add-ons > Install
2. 이 파일 선택
3. "Blender Toolkit WebSocket Server" 활성화
"""

# flake8: noqa: E402
# Blender addon requires bl_info at top of file

bl_info = {  # type: ignore[misc]
    "name": "Blender Toolkit WebSocket Server",
    "author": "Dev GOM",
    "version": (1, 0, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > Blender Toolkit",
    "description": (
        "WebSocket server for Claude Code integration "
        "with animation retargeting"
    ),
    "category": "Animation",
}

# Add bundled dependencies to sys.path
import sys
import os
_addon_dir = os.path.dirname(os.path.realpath(__file__))
_libs_dir = os.path.join(_addon_dir, 'libs')
if os.path.exists(_libs_dir) and _libs_dir not in sys.path:
    sys.path.insert(0, _libs_dir)

import bpy

# Logging utilities
from .utils.logger import get_logger

# WebSocket Server
from .websocket_server import BlenderWebSocketServer

# UI Classes
from .ui import (
    BoneMappingItem,
    BLENDERTOOLKIT_PT_Panel,
    BLENDERTOOLKIT_PT_BoneMappingPanel,
    BLENDERTOOLKIT_OT_StartServer,
    BLENDERTOOLKIT_OT_StopServer,
    BLENDERTOOLKIT_OT_AutoRemap,
    BLENDERTOOLKIT_OT_ApplyRetargeting,
)

# 모듈 로거 초기화
logger = get_logger('addon')


# ============================================================================
# 등록/해제
# ============================================================================

def register():
    """Blender 애드온 클래스 및 속성 등록."""
    # Register property groups first
    bpy.utils.register_class(BoneMappingItem)

    # Register UI panels
    bpy.utils.register_class(BLENDERTOOLKIT_PT_Panel)
    bpy.utils.register_class(BLENDERTOOLKIT_PT_BoneMappingPanel)

    # Register operators
    bpy.utils.register_class(BLENDERTOOLKIT_OT_StartServer)
    bpy.utils.register_class(BLENDERTOOLKIT_OT_StopServer)
    bpy.utils.register_class(BLENDERTOOLKIT_OT_AutoRemap)
    bpy.utils.register_class(BLENDERTOOLKIT_OT_ApplyRetargeting)

    # 포트 설정 속성
    bpy.types.Scene.blender_toolkit_port = bpy.props.IntProperty(
        name="Port",
        description="WebSocket server port",
        default=9400,
        min=1024,
        max=65535
    )

    # 본 매핑 속성
    bpy.types.Scene.bone_mapping_items = bpy.props.CollectionProperty(
        type=BoneMappingItem,
        name="Bone Mapping Items"
    )
    bpy.types.Scene.bone_mapping_source_armature = bpy.props.StringProperty(
        name="Source Armature",
        description="Source armature name"
    )
    bpy.types.Scene.bone_mapping_target_armature = bpy.props.StringProperty(
        name="Target Armature",
        description="Target armature name"
    )
    bpy.types.Scene.bone_mapping_status = bpy.props.StringProperty(
        name="Bone Mapping Status",
        description="Current status of bone mapping operation",
        default=""
    )

    print("✅ Blender Toolkit WebSocket Server registered")


def unregister():
    """Blender 애드온 클래스 및 속성 등록 해제."""
    # Unregister operators
    bpy.utils.unregister_class(BLENDERTOOLKIT_OT_ApplyRetargeting)
    bpy.utils.unregister_class(BLENDERTOOLKIT_OT_AutoRemap)
    bpy.utils.unregister_class(BLENDERTOOLKIT_OT_StopServer)
    bpy.utils.unregister_class(BLENDERTOOLKIT_OT_StartServer)

    # Unregister UI panels
    bpy.utils.unregister_class(BLENDERTOOLKIT_PT_BoneMappingPanel)
    bpy.utils.unregister_class(BLENDERTOOLKIT_PT_Panel)

    # Unregister property groups
    bpy.utils.unregister_class(BoneMappingItem)

    # Delete properties
    del bpy.types.Scene.bone_mapping_status
    del bpy.types.Scene.bone_mapping_target_armature
    del bpy.types.Scene.bone_mapping_source_armature
    del bpy.types.Scene.bone_mapping_items
    del bpy.types.Scene.blender_toolkit_port

    print("🔌 Blender Toolkit WebSocket Server unregistered")


if __name__ == "__main__":
    register()
