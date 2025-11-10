"""
Blender Toolkit WebSocket Server
Claude Code와 통신하기 위한 WebSocket 서버 애드온

설치 방법:
1. Blender > Edit > Preferences > Add-ons > Install
2. 이 파일 선택
3. "Blender Toolkit WebSocket Server" 활성화
"""

bl_info = {
    "name": "Blender Toolkit WebSocket Server",
    "author": "Dev GOM",
    "version": (1, 0, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > Blender Toolkit",
    "description": "WebSocket server for Claude Code integration with animation retargeting",
    "category": "Animation",
}

import bpy
import asyncio
import json
import os
from aiohttp import web
from typing import Dict, Any, Optional


# ============================================================================
# WebSocket Server
# ============================================================================

class BlenderWebSocketServer:
    """WebSocket 서버 메인 클래스"""

    def __init__(self, port: int = 9400):
        self.port = port
        self.app = None
        self.runner = None
        self.site = None
        self.clients = []

    async def handle_command(self, request):
        """WebSocket 연결 핸들러"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        self.clients.append(ws)
        print(f"✅ Client connected (total: {len(self.clients)})")

        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    response = await self.process_command(data)
                    await ws.send_json(response)
                except Exception as e:
                    await ws.send_json({
                        "id": data.get("id"),
                        "error": {
                            "code": -1,
                            "message": str(e)
                        }
                    })
            elif msg.type == web.WSMsgType.ERROR:
                print(f'❌ WebSocket error: {ws.exception()}')

        self.clients.remove(ws)
        print(f"🔌 Client disconnected (total: {len(self.clients)})")
        return ws

    async def process_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """명령 처리"""
        method = data.get("method")
        params = data.get("params", {})
        msg_id = data.get("id")

        print(f"📨 Received command: {method}")

        try:
            # 메서드 라우팅
            if method.startswith("Armature."):
                result = await self.handle_armature_command(method, params)
            elif method.startswith("Retargeting."):
                result = await self.handle_retargeting_command(method, params)
            elif method.startswith("BoneMapping."):
                result = await self.handle_bonemapping_command(method, params)
            elif method.startswith("Animation."):
                result = await self.handle_animation_command(method, params)
            elif method.startswith("Import."):
                result = await self.handle_import_command(method, params)
            else:
                raise ValueError(f"Unknown method: {method}")

            return {"id": msg_id, "result": result}
        except Exception as e:
            print(f"❌ Error processing {method}: {str(e)}")
            return {
                "id": msg_id,
                "error": {"code": -1, "message": str(e)}
            }

    async def handle_armature_command(self, method: str, params: Dict) -> Any:
        """아마추어 관련 명령 처리"""
        if method == "Armature.getBones":
            armature_name = params.get("armatureName")
            return get_bones(armature_name)
        elif method == "Armature.list":
            return list_armatures()
        else:
            raise ValueError(f"Unknown armature method: {method}")

    async def handle_retargeting_command(self, method: str, params: Dict) -> Any:
        """리타게팅 명령 처리"""
        if method == "Retargeting.autoMapBones":
            return auto_map_bones(
                params.get("sourceArmature"),
                params.get("targetArmature")
            )
        elif method == "Retargeting.retargetAnimation":
            return retarget_animation(
                params.get("sourceArmature"),
                params.get("targetArmature"),
                params.get("boneMap"),
                params.get("preserveRotation", True),
                params.get("preserveLocation", False)
            )
        elif method == "Retargeting.getPresetMapping":
            preset = params.get("preset")
            return get_preset_bone_mapping(preset)
        else:
            raise ValueError(f"Unknown retargeting method: {method}")

    async def handle_bonemapping_command(self, method: str, params: Dict) -> Any:
        """본 매핑 명령 처리"""
        if method == "BoneMapping.show":
            return store_bone_mapping(
                params.get("sourceArmature"),
                params.get("targetArmature"),
                params.get("boneMapping")
            )
        elif method == "BoneMapping.get":
            return load_bone_mapping(
                params.get("sourceArmature"),
                params.get("targetArmature")
            )
        else:
            raise ValueError(f"Unknown bone mapping method: {method}")

    async def handle_animation_command(self, method: str, params: Dict) -> Any:
        """애니메이션 명령 처리"""
        if method == "Animation.list":
            armature_name = params.get("armatureName")
            return list_animations(armature_name)
        elif method == "Animation.play":
            return play_animation(
                params.get("armatureName"),
                params.get("actionName"),
                params.get("loop", True)
            )
        elif method == "Animation.stop":
            return stop_animation()
        elif method == "Animation.addToNLA":
            return add_to_nla(
                params.get("armatureName"),
                params.get("actionName"),
                params.get("trackName")
            )
        else:
            raise ValueError(f"Unknown animation method: {method}")

    async def handle_import_command(self, method: str, params: Dict) -> Any:
        """임포트 명령 처리"""
        if method == "Import.fbx":
            return import_fbx(params.get("filepath"))
        elif method == "Import.dae":
            return import_dae(params.get("filepath"))
        else:
            raise ValueError(f"Unknown import method: {method}")

    async def start(self):
        """서버 시작"""
        self.app = web.Application()
        self.app.router.add_get('/ws', self.handle_command)

        self.runner = web.AppRunner(self.app)
        await self.runner.setup()

        self.site = web.TCPSite(self.runner, '127.0.0.1', self.port)
        await self.site.start()

        print(f"✅ Blender WebSocket Server started on port {self.port}")

    async def stop(self):
        """서버 중지"""
        if self.site:
            await self.site.stop()
        if self.runner:
            await self.runner.cleanup()
        print("🛑 Blender WebSocket Server stopped")


# ============================================================================
# Blender API 함수들
# ============================================================================

def list_armatures() -> list:
    """모든 아마추어 오브젝트 목록"""
    return [obj.name for obj in bpy.data.objects if obj.type == 'ARMATURE']


def get_bones(armature_name: str) -> list:
    """아마추어의 본 정보 가져오기"""
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


def auto_map_bones(source_armature: str, target_armature: str) -> Dict[str, str]:
    """자동 본 매핑 (Mixamo -> 사용자 캐릭터)"""
    source = bpy.data.objects.get(source_armature)
    target = bpy.data.objects.get(target_armature)

    if not source or not target:
        raise ValueError("Source or target armature not found")

    # Mixamo 표준 본 이름 (확장: 손가락, 발가락 포함)
    mixamo_bones = {
        # 몸통
        "Hips": ["hips", "pelvis", "root"],
        "Spine": ["spine", "spine1"],
        "Spine1": ["spine1", "spine2"],
        "Spine2": ["spine2", "spine3", "chest"],
        "Neck": ["neck"],
        "Head": ["head"],

        # 왼쪽 팔
        "LeftShoulder": ["shoulder.l", "clavicle.l", "leftshoulder"],
        "LeftArm": ["upper_arm.l", "leftarm", "upperarm.l"],
        "LeftForeArm": ["forearm.l", "leftforearm", "lowerarm.l"],
        "LeftHand": ["hand.l", "lefthand"],

        # 오른쪽 팔
        "RightShoulder": ["shoulder.r", "clavicle.r", "rightshoulder"],
        "RightArm": ["upper_arm.r", "rightarm", "upperarm.r"],
        "RightForeArm": ["forearm.r", "rightforearm", "lowerarm.r"],
        "RightHand": ["hand.r", "righthand"],

        # 왼쪽 다리
        "LeftUpLeg": ["thigh.l", "leftupleg", "upperleg.l"],
        "LeftLeg": ["shin.l", "leftleg", "lowerleg.l"],
        "LeftFoot": ["foot.l", "leftfoot"],
        "LeftToeBase": ["toe.l", "lefttoebase", "foot.l.001"],

        # 오른쪽 다리
        "RightUpLeg": ["thigh.r", "rightupleg", "upperleg.r"],
        "RightLeg": ["shin.r", "rightleg", "lowerleg.r"],
        "RightFoot": ["foot.r", "rightfoot"],
        "RightToeBase": ["toe.r", "righttoebase", "foot.r.001"],

        # 왼쪽 손가락
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

        # 오른쪽 손가락
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

    bone_map = {}
    target_bone_names = [b.name.lower() for b in target.data.bones]

    for mixamo_bone, target_variants in mixamo_bones.items():
        # Mixamo 본이 source에 있는지 확인
        if mixamo_bone not in source.data.bones:
            continue

        # 타겟에서 매칭되는 본 찾기
        for variant in target_variants:
            if variant in target_bone_names:
                actual_name = target.data.bones[target_bone_names.index(variant)].name
                bone_map[mixamo_bone] = actual_name
                break

    print(f"✅ Auto-mapped {len(bone_map)} bones")
    return bone_map


def retarget_animation(
    source_armature: str,
    target_armature: str,
    bone_map: Dict[str, str],
    preserve_rotation: bool = True,
    preserve_location: bool = False
) -> str:
    """애니메이션 리타게팅 실행"""
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


def get_preset_bone_mapping(preset: str) -> Dict[str, str]:
    """미리 정의된 본 매핑 프리셋"""
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


def list_animations(armature_name: str) -> list:
    """아마추어의 애니메이션 액션 목록"""
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
    """애니메이션 재생"""
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
    """애니메이션 중지"""
    bpy.ops.screen.animation_cancel()
    return "Animation stopped"


def add_to_nla(armature_name: str, action_name: str, track_name: str) -> str:
    """NLA 트랙에 애니메이션 추가"""
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


def import_fbx(filepath: str) -> str:
    """FBX 파일 임포트"""
    if not os.path.exists(filepath):
        raise ValueError(f"File not found: {filepath}")

    bpy.ops.import_scene.fbx(filepath=filepath)
    return f"Imported {filepath}"


def import_dae(filepath: str) -> str:
    """Collada (.dae) 파일 임포트"""
    if not os.path.exists(filepath):
        raise ValueError(f"File not found: {filepath}")

    bpy.ops.wm.collada_import(filepath=filepath)
    return f"Imported {filepath}"


def store_bone_mapping(source_armature: str, target_armature: str, bone_mapping: Dict[str, str]) -> str:
    """본 매핑을 Scene 속성에 저장"""
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
    """Scene 속성에서 본 매핑 로드"""
    scene = bpy.context.scene

    # 아마추어 검증
    if not scene.bone_mapping_source_armature:
        raise ValueError("No bone mapping stored. Please generate mapping first using BoneMapping.show command.")

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
        port = context.scene.blender_toolkit_port

        # TODO: Implement WebSocket server startup using Blender's timer system
        # Implementation strategy:
        # 1. Create a modal operator that runs in background
        # 2. Use bpy.app.timers to run async server loop
        # 3. Store server instance in Scene property
        # 4. Add server state indicator in UI
        #
        # Example implementation:
        # server = BlenderWebSocketServer(port)
        # bpy.app.timers.register(lambda: server.run_step())
        # context.scene.blender_toolkit_server_running = True

        self.report({'WARNING'},
                   f"Server startup not implemented yet. "
                   f"Please run Blender WebSocket server manually from Python console:\n"
                   f"  import asyncio\n"
                   f"  server = BlenderWebSocketServer({port})\n"
                   f"  asyncio.run(server.start())")
        return {'FINISHED'}


class BLENDERTOOLKIT_OT_StopServer(bpy.types.Operator):
    """서버 중지 오퍼레이터"""
    bl_idname = "blendertoolkit.stop_server"
    bl_label = "Stop WebSocket Server"

    def execute(self, context):
        # TODO: Implement server stop
        # Should stop the server started by BLENDERTOOLKIT_OT_StartServer
        # and clean up resources

        self.report({'WARNING'}, "Server stop not implemented yet.")
        return {'FINISHED'}


class BLENDERTOOLKIT_PT_BoneMappingPanel(bpy.types.Panel):
    """본 매핑 리뷰 패널"""
    bl_label = "Bone Mapping Review"
    bl_idname = "BLENDERTOOLKIT_PT_bone_mapping"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Blender Toolkit'
    bl_options = {'DEFAULT_CLOSED'}

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        # Show armature info
        if scene.bone_mapping_source_armature and scene.bone_mapping_target_armature:
            layout.label(text=f"Source: {scene.bone_mapping_source_armature}", icon='ARMATURE_DATA')
            layout.label(text=f"Target: {scene.bone_mapping_target_armature}", icon='ARMATURE_DATA')
            layout.separator()

            # Bone mapping table
            if len(scene.bone_mapping_items) > 0:
                layout.label(text=f"Bone Mappings ({len(scene.bone_mapping_items)}):", icon='BONE_DATA')

                # Header
                box = layout.box()
                row = box.row()
                row.label(text="Source Bone")
                row.label(text="→")
                row.label(text="Target Bone")

                # Mapping items (scrollable)
                for i, item in enumerate(scene.bone_mapping_items):
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
                layout.operator("blendertoolkit.auto_remap", text="Auto Re-map", icon='FILE_REFRESH')

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

                layout.operator("blendertoolkit.apply_retargeting", text="Apply Retargeting", icon='PLAY')
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
        except Exception as e:
            self.report({'ERROR'}, f"Auto re-mapping failed: {str(e)}")
            return {'CANCELLED'}

        return {'FINISHED'}


class BLENDERTOOLKIT_OT_ApplyRetargeting(bpy.types.Operator):
    """리타게팅 적용 오퍼레이터"""
    bl_idname = "blendertoolkit.apply_retargeting"
    bl_label = "Apply Retargeting"
    bl_description = "Apply retargeting with current bone mapping"

    def execute(self, context):
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
        except Exception as e:
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


# ============================================================================
# 등록/해제
# ============================================================================

def register():
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
