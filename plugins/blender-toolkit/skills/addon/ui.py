"""
Blender Toolkit UI Components
UI 패널, 오퍼레이터, 속성 그룹 정의
"""

import asyncio
import threading
from typing import Any

import bpy

from .retargeting import auto_map_bones, retarget_animation


# ============================================================================
# Blender UI Panel
# ============================================================================

class BLENDERTOOLKIT_PT_Panel(bpy.types.Panel):
    """Blender Toolkit 사이드바 패널"""
    bl_label = "Blender Toolkit"
    bl_idname = "BLENDERTOOLKIT_PT_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Blender Toolkit'

    def draw(self, context):
        """UI 패널 그리기."""
        layout = self.layout

        # 서버 상태 표시
        layout.label(text="WebSocket Server", icon='NETWORK_DRIVE')

        # 서버 시작/중지 버튼
        row = layout.row()
        row.operator("blendertoolkit.start_server", text="Start Server", icon='PLAY')
        row.operator("blendertoolkit.stop_server", text="Stop Server", icon='PAUSE')

        layout.separator()

        # 포트 설정
        layout.prop(context.scene, "blender_toolkit_port", text="Port")


class BLENDERTOOLKIT_OT_StartServer(bpy.types.Operator):
    """서버 시작 오퍼레이터"""
    bl_idname = "blendertoolkit.start_server"
    bl_label = "Start WebSocket Server"

    def execute(self, context):
        """WebSocket 서버를 시작하는 오퍼레이터 실행."""
        # Import here to avoid circular dependency
        from . import BlenderWebSocketServer

        port = context.scene.blender_toolkit_port

        # Check if server is already running
        if hasattr(bpy.types.Scene, '_blender_toolkit_server_thread'):
            server_thread = bpy.types.Scene._blender_toolkit_server_thread
            if server_thread and server_thread.is_alive():
                self.report({'INFO'}, f"WebSocket server already running on port {port}")
                return {'CANCELLED'}

        # Start server in background thread

        def run_server():
            """서버를 별도 스레드에서 실행"""
            try:
                server = BlenderWebSocketServer(port)
                # Store server instance globally
                bpy.types.Scene._blender_toolkit_server = server

                # Create new event loop for this thread
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                # Store loop reference for graceful shutdown
                bpy.types.Scene._blender_toolkit_event_loop = loop

                # Run server until stopped
                loop.run_until_complete(server.start())

                # Keep loop running until stop() is called
                loop.run_forever()
            except (RuntimeError, OSError, ValueError) as e:
                print(f"Blender Toolkit Server Error: {e}")
            finally:
                # Cleanup
                loop.close()

        # Start server thread
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()

        # Store thread reference
        bpy.types.Scene._blender_toolkit_server_thread = server_thread
        bpy.types.Scene._blender_toolkit_server_port = port

        self.report({'INFO'}, f"✓ WebSocket server started on port {port}")
        print(f"Blender Toolkit: WebSocket server started on ws://127.0.0.1:{port}")
        return {'FINISHED'}


class BLENDERTOOLKIT_OT_StopServer(bpy.types.Operator):
    """서버 중지 오퍼레이터"""
    bl_idname = "blendertoolkit.stop_server"
    bl_label = "Stop WebSocket Server"

    def execute(self, context):
        """WebSocket 서버를 중지하는 오퍼레이터 실행."""
        # Check if server is running
        if not hasattr(bpy.types.Scene, '_blender_toolkit_server_thread'):
            self.report({'WARNING'}, "WebSocket server is not running")
            return {'CANCELLED'}

        server_thread = bpy.types.Scene._blender_toolkit_server_thread
        if not server_thread or not server_thread.is_alive():
            self.report({'WARNING'}, "WebSocket server is not running")
            # Clean up stale references
            self._cleanup_references()
            return {'CANCELLED'}

        # Get server instance and event loop
        server = getattr(bpy.types.Scene, '_blender_toolkit_server', None)
        loop = getattr(bpy.types.Scene, '_blender_toolkit_event_loop', None)
        port = getattr(bpy.types.Scene, '_blender_toolkit_server_port', 'unknown')

        if not server or not loop:
            self.report({'WARNING'}, "Server instance not found. Please restart Blender to fully stop the server.")
            self._cleanup_references()
            return {'CANCELLED'}

        try:
            # Schedule server stop in the event loop thread
            def stop_server():
                """이벤트 루프에서 서버를 안전하게 종료합니다."""
                async def _shutdown():
                    try:
                        # 서버의 비동기 중지 메서드를 호출하고 완료될 때까지 기다립니다.
                        await server.stop()
                    except (RuntimeError, ValueError) as e:
                        print(f"Error stopping server: {e}")
                    finally:
                        # 서버가 완전히 중지된 후에 이벤트 루프를 멈춥니다.
                        loop.stop()

                # 스레드 안전하게 비동기 종료 시퀀스를 스케줄링합니다.
                asyncio.ensure_future(_shutdown())

            # Call stop_server() in the event loop thread (thread-safe)
            loop.call_soon_threadsafe(stop_server)

            self.report({'INFO'}, f"✓ WebSocket server on port {port} stopped successfully")
            print(f"Blender Toolkit: WebSocket server on port {port} stopped")
        except (RuntimeError, ValueError, AttributeError) as e:
            self.report({'ERROR'}, f"Failed to stop server: {str(e)}")
            print(f"Blender Toolkit: Error stopping server: {e}")
            return {'CANCELLED'}
        finally:
            # Clean up all references
            self._cleanup_references()

        return {'FINISHED'}

    def _cleanup_references(self):
        """Clean up all server references"""
        if hasattr(bpy.types.Scene, '_blender_toolkit_server'):
            delattr(bpy.types.Scene, '_blender_toolkit_server')
        if hasattr(bpy.types.Scene, '_blender_toolkit_event_loop'):
            delattr(bpy.types.Scene, '_blender_toolkit_event_loop')
        if hasattr(bpy.types.Scene, '_blender_toolkit_server_thread'):
            delattr(bpy.types.Scene, '_blender_toolkit_server_thread')
        if hasattr(bpy.types.Scene, '_blender_toolkit_server_port'):
            delattr(bpy.types.Scene, '_blender_toolkit_server_port')


class BLENDERTOOLKIT_PT_BoneMappingPanel(bpy.types.Panel):
    """본 매핑 리뷰 패널"""
    bl_label = "Bone Mapping Review"
    bl_idname = "BLENDERTOOLKIT_PT_bone_mapping"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Blender Toolkit'
    bl_options = {'DEFAULT_CLOSED'}

    def draw(self, context):
        """본 매핑 리뷰 패널 그리기."""
        layout = self.layout
        scene = context.scene

        # Show armature info
        if scene.bone_mapping_source_armature and scene.bone_mapping_target_armature:
            layout.label(text=f"Source: {scene.bone_mapping_source_armature}", icon='ARMATURE_DATA')
            layout.label(text=f"Target: {scene.bone_mapping_target_armature}", icon='ARMATURE_DATA')
            layout.separator()

            # Bone mapping table
            if len(scene.bone_mapping_items) > 0:
                mapping_count = len(scene.bone_mapping_items)
                layout.label(
                    text=f"Bone Mappings ({mapping_count}):", icon='BONE_DATA'
                )

                # Header
                box = layout.box()
                row = box.row()
                row.label(text="Source Bone")
                row.label(text="→")
                row.label(text="Target Bone")

                # Mapping items (scrollable)
                for _, item in enumerate(scene.bone_mapping_items):
                    row = layout.row()
                    row.label(text=item.source_bone)
                    row.label(text="→")

                    # Editable target bone dropdown
                    target_armature = bpy.data.objects.get(scene.bone_mapping_target_armature)
                    if target_armature and target_armature.type == 'ARMATURE':
                        row.prop_search(item, "target_bone", target_armature.data, "bones", text="")
                    else:
                        row.prop(item, "target_bone", text="")

                layout.separator()

                # Auto re-map button
                layout.operator(
                    "blendertoolkit.auto_remap", text="Auto Re-map",
                    icon='FILE_REFRESH'
                )

                # Apply retargeting button
                layout.separator()

                # Show status
                if hasattr(scene, 'bone_mapping_status'):
                    if scene.bone_mapping_status == "APPLYING":
                        layout.label(text="⏳ Applying retargeting...", icon='TIME')
                    elif scene.bone_mapping_status == "COMPLETED":
                        layout.label(text="✓ Retargeting completed!", icon='CHECKMARK')
                    elif scene.bone_mapping_status == "FAILED":
                        layout.label(text="✗ Retargeting failed", icon='ERROR')

                layout.operator(
                    "blendertoolkit.apply_retargeting",
                    text="Apply Retargeting", icon='PLAY'
                )
            else:
                layout.label(text="No bone mapping data", icon='INFO')
        else:
            layout.label(text="No bone mapping loaded", icon='INFO')
            layout.label(text="Waiting for Claude Code...", icon='TIME')


class BLENDERTOOLKIT_OT_AutoRemap(bpy.types.Operator):
    """자동 재매핑 오퍼레이터"""
    bl_idname = "blendertoolkit.auto_remap"
    bl_label = "Auto Re-map Bones"
    bl_description = "Re-generate bone mapping automatically"

    def execute(self, context):
        """자동 본 재매핑 오퍼레이터 실행."""
        scene = context.scene
        source_armature = scene.bone_mapping_source_armature
        target_armature = scene.bone_mapping_target_armature

        if not source_armature or not target_armature:
            self.report({'ERROR'}, "Source or target armature not set")
            return {'CANCELLED'}

        try:
            # Auto-map bones
            bone_map = auto_map_bones(source_armature, target_armature)

            # Update scene properties
            scene.bone_mapping_items.clear()
            for source_bone, target_bone in bone_map.items():
                item = scene.bone_mapping_items.add()
                item.source_bone = source_bone
                item.target_bone = target_bone

            self.report({'INFO'}, f"Re-mapped {len(bone_map)} bones")
        except (ValueError, KeyError, AttributeError) as e:
            self.report({'ERROR'}, f"Auto re-mapping failed: {str(e)}")
            return {'CANCELLED'}

        return {'FINISHED'}


class BLENDERTOOLKIT_OT_ApplyRetargeting(bpy.types.Operator):
    """리타게팅 적용 오퍼레이터"""
    bl_idname = "blendertoolkit.apply_retargeting"
    bl_label = "Apply Retargeting"
    bl_description = "Apply retargeting with current bone mapping"

    def execute(self, context):
        """애니메이션 리타게팅을 적용하는 오퍼레이터 실행."""
        scene = context.scene
        source_armature = scene.bone_mapping_source_armature
        target_armature = scene.bone_mapping_target_armature

        if not source_armature or not target_armature:
            self.report({'ERROR'}, "Source or target armature not set")
            return {'CANCELLED'}

        # Build bone map from items
        bone_map = {}
        for item in scene.bone_mapping_items:
            if item.target_bone:  # Skip empty mappings
                bone_map[item.source_bone] = item.target_bone

        if not bone_map:
            self.report({'ERROR'}, "No bone mappings defined")
            return {'CANCELLED'}

        try:
            # Show progress in UI
            self.report({'INFO'}, f"Applying retargeting to {len(bone_map)} bones...")

            # Set status flag
            scene.bone_mapping_status = "APPLYING"

            result = retarget_animation(
                source_armature,
                target_armature,
                bone_map,
                preserve_rotation=True,
                preserve_location=True
            )

            # Update status
            scene.bone_mapping_status = "COMPLETED"

            self.report({'INFO'}, result)
        except (ValueError, KeyError, AttributeError, RuntimeError) as e:
            scene.bone_mapping_status = "FAILED"
            self.report({'ERROR'}, f"Retargeting failed: {str(e)}")
            return {'CANCELLED'}

        return {'FINISHED'}


# ============================================================================
# Property Groups
# ============================================================================

class BoneMappingItem(bpy.types.PropertyGroup):
    """본 매핑 아이템"""
    source_bone: bpy.props.StringProperty(name="Source Bone")
    target_bone: bpy.props.StringProperty(name="Target Bone")
