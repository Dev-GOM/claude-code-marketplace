"""
WebSocket Server for Blender Toolkit
Claude Code와 통신하기 위한 WebSocket 서버

이 모듈은 Blender 내부에서 WebSocket 서버를 실행하여
외부 클라이언트(Claude Code)와 JSON-RPC 스타일 통신을 제공합니다.
"""

import asyncio
import json
from typing import Any, Dict, Union

import bpy
from aiohttp import web
from aiohttp.web import Request, WebSocketResponse

from .utils.logger import get_logger
from .utils.security import validate_port

# 모듈 로거 초기화
logger = get_logger('websocket_server')

# 보안 상수
MAX_CONNECTIONS = 5  # 최대 동시 연결 수 (로컬 환경)


class BlenderWebSocketServer:
    """WebSocket 서버 메인 클래스"""

    def __init__(self, port: int = 9400):
        self.port = validate_port(port)
        self.app = None
        self.runner = None
        self.site = None
        self.clients = []

    async def handle_command(
        self, request: Request
    ) -> Union[WebSocketResponse, web.Response]:
        """WebSocket 연결 핸들러"""
        # 로컬호스트만 허용 (보안)
        peername = request.transport.get_extra_info('peername')
        if peername:
            host = peername[0]
            if host not in ('127.0.0.1', '::1', 'localhost'):
                logger.warning(
                    "Rejected connection from non-localhost: %s", host
                )
                return web.Response(
                    status=403, text="Only localhost connections allowed"
                )

        # 최대 연결 수 제한 (DoS 방지)
        if len(self.clients) >= MAX_CONNECTIONS:
            logger.warning(
                "Connection limit reached (%d)", MAX_CONNECTIONS
            )
            return web.Response(status=503, text="Too many connections")

        ws = web.WebSocketResponse()
        await ws.prepare(request)

        self.clients.append(ws)
        logger.info("Client connected (total: %d)", len(self.clients))
        print(f"✅ Client connected (total: {len(self.clients)})")

        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    logger.debug("Received message: %s", data)
                    response = await self.process_command(data)
                    await ws.send_json(response)
                except (json.JSONDecodeError, KeyError, ValueError) as e:
                    logger.error("Error handling message: %s", e, exc_info=True)
                    await ws.send_json({
                        "id": data.get("id") if 'data' in locals() else None,
                        "error": {
                            "code": -1,
                            "message": str(e)
                        }
                    })
            elif msg.type == web.WSMsgType.ERROR:
                logger.error('WebSocket error: %s', ws.exception())
                print(f'❌ WebSocket error: {ws.exception()}')

        self.clients.remove(ws)
        logger.info("Client disconnected (total: %d)", len(self.clients))
        print(f"🔌 Client disconnected (total: {len(self.clients)})")
        return ws

    async def process_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """명령 처리"""
        method = data.get("method")
        params = data.get("params", {})
        msg_id = data.get("id")

        logger.info("Processing command: %s", method)
        logger.debug("Command params: %s", params)
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
            elif method.startswith("Geometry."):
                result = await self.handle_geometry_command(method, params)
            elif method.startswith("Object."):
                result = await self.handle_object_command(method, params)
            elif method.startswith("Modifier."):
                result = await self.handle_modifier_command(method, params)
            elif method.startswith("Material."):
                result = await self.handle_material_command(method, params)
            elif method.startswith("Collection."):
                result = await self.handle_collection_command(method, params)
            else:
                raise ValueError(f"Unknown method: {method}")

            logger.info("Command %s completed successfully", method)
            return {"id": msg_id, "result": result}
        except (ValueError, KeyError, AttributeError, RuntimeError) as e:
            logger.error("Error processing %s: %s", method, str(e), exc_info=True)
            print(f"❌ Error processing {method}: {str(e)}")
            return {
                "id": msg_id,
                "error": {"code": -1, "message": str(e)}
            }

    async def handle_armature_command(self, method: str, params: Dict) -> Any:
        """아마추어 관련 명령 처리"""
        from .retargeting import get_bones, list_armatures

        if method == "Armature.getBones":
            armature_name = params.get("armatureName")
            return get_bones(armature_name)
        elif method == "Armature.list":
            return list_armatures()
        else:
            raise ValueError(f"Unknown armature method: {method}")

    async def handle_retargeting_command(self, method: str, params: Dict) -> Any:
        """리타게팅 명령 처리"""
        from .retargeting import auto_map_bones, retarget_animation, get_preset_bone_mapping

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
        from .retargeting import store_bone_mapping, load_bone_mapping

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
        from .retargeting import list_animations, play_animation, stop_animation, add_to_nla

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
        from .retargeting import import_fbx, import_dae

        if method == "Import.fbx":
            return import_fbx(params.get("filepath"))
        elif method == "Import.dae":
            return import_dae(params.get("filepath"))
        else:
            raise ValueError(f"Unknown import method: {method}")

    async def handle_geometry_command(self, method: str, params: Dict) -> Any:
        """도형 생성 명령 처리"""
        from .commands.geometry import (
            create_cube, create_sphere, create_cylinder,
            create_plane, create_cone, create_torus,
            get_vertices, move_vertex, subdivide_mesh, extrude_face
        )

        if method == "Geometry.createCube":
            return create_cube(
                location=tuple(params.get("location", [0, 0, 0])),
                size=params.get("size", 2.0),
                name=params.get("name")
            )
        elif method == "Geometry.createSphere":
            return create_sphere(
                location=tuple(params.get("location", [0, 0, 0])),
                radius=params.get("radius", 1.0),
                segments=params.get("segments", 32),
                ring_count=params.get("ringCount", 16),
                name=params.get("name")
            )
        elif method == "Geometry.createCylinder":
            return create_cylinder(
                location=tuple(params.get("location", [0, 0, 0])),
                radius=params.get("radius", 1.0),
                depth=params.get("depth", 2.0),
                vertices=params.get("vertices", 32),
                name=params.get("name")
            )
        elif method == "Geometry.createPlane":
            return create_plane(
                location=tuple(params.get("location", [0, 0, 0])),
                size=params.get("size", 2.0),
                name=params.get("name")
            )
        elif method == "Geometry.createCone":
            return create_cone(
                location=tuple(params.get("location", [0, 0, 0])),
                radius1=params.get("radius1", 1.0),
                depth=params.get("depth", 2.0),
                vertices=params.get("vertices", 32),
                name=params.get("name")
            )
        elif method == "Geometry.createTorus":
            return create_torus(
                location=tuple(params.get("location", [0, 0, 0])),
                major_radius=params.get("majorRadius", 1.0),
                minor_radius=params.get("minorRadius", 0.25),
                major_segments=params.get("majorSegments", 48),
                minor_segments=params.get("minorSegments", 12),
                name=params.get("name")
            )
        elif method == "Geometry.getVertices":
            return get_vertices(params.get("name"))
        elif method == "Geometry.moveVertex":
            return move_vertex(
                object_name=params.get("objectName"),
                vertex_index=params.get("vertexIndex"),
                new_position=tuple(params.get("newPosition"))
            )
        elif method == "Geometry.subdivideMesh":
            return subdivide_mesh(
                name=params.get("name"),
                cuts=params.get("cuts", 1)
            )
        elif method == "Geometry.extrudeFace":
            return extrude_face(
                object_name=params.get("objectName"),
                face_index=params.get("faceIndex"),
                offset=params.get("offset", 1.0)
            )
        else:
            raise ValueError(f"Unknown geometry method: {method}")

    async def handle_object_command(self, method: str, params: Dict) -> Any:
        """오브젝트 명령 처리"""
        from .commands.geometry import (
            delete_object, transform_object, duplicate_object, list_objects
        )

        if method == "Object.delete":
            return delete_object(params.get("name"))
        elif method == "Object.transform":
            location = params.get("location")
            rotation = params.get("rotation")
            scale = params.get("scale")
            return transform_object(
                name=params.get("name"),
                location=tuple(location) if location else None,
                rotation=tuple(rotation) if rotation else None,
                scale=tuple(scale) if scale else None
            )
        elif method == "Object.duplicate":
            location = params.get("location")
            return duplicate_object(
                name=params.get("name"),
                new_name=params.get("newName"),
                location=tuple(location) if location else None
            )
        elif method == "Object.list":
            return list_objects(params.get("type"))
        else:
            raise ValueError(f"Unknown object method: {method}")

    async def handle_modifier_command(self, method: str, params: Dict) -> Any:
        """모디파이어 명령 처리"""
        from .commands.modifier import (
            add_modifier, apply_modifier, list_modifiers, remove_modifier,
            toggle_modifier, modify_modifier_properties, get_modifier_info, reorder_modifier
        )

        if method == "Modifier.add":
            properties = params.get("properties", {})
            return add_modifier(
                object_name=params.get("objectName"),
                modifier_type=params.get("modifierType"),
                name=params.get("name")
            )
        elif method == "Modifier.apply":
            return apply_modifier(
                object_name=params.get("objectName"),
                modifier_name=params.get("modifierName")
            )
        elif method == "Modifier.list":
            return list_modifiers(
                object_name=params.get("objectName")
            )
        elif method == "Modifier.remove":
            return remove_modifier(
                object_name=params.get("objectName"),
                modifier_name=params.get("modifierName")
            )
        elif method == "Modifier.toggle":
            return toggle_modifier(
                object_name=params.get("objectName"),
                modifier_name=params.get("modifierName"),
                viewport=params.get("viewport"),
                render=params.get("render")
            )
        elif method == "Modifier.modify":
            properties = params.get("properties", {})
            return modify_modifier_properties(
                object_name=params.get("objectName"),
                modifier_name=params.get("modifierName"),
                **properties
            )
        elif method == "Modifier.getInfo":
            return get_modifier_info(
                object_name=params.get("objectName"),
                modifier_name=params.get("modifierName")
            )
        elif method == "Modifier.reorder":
            return reorder_modifier(
                object_name=params.get("objectName"),
                modifier_name=params.get("modifierName"),
                direction=params.get("direction")
            )
        else:
            raise ValueError(f"Unknown modifier method: {method}")

    async def handle_material_command(self, method: str, params: Dict) -> Any:
        """머티리얼 명령 처리"""
        from .commands.material import (
            create_material, list_materials, delete_material,
            assign_material, list_object_materials,
            set_material_base_color, set_material_metallic, set_material_roughness,
            set_material_emission, get_material_properties
        )

        if method == "Material.create":
            return create_material(
                name=params.get("name"),
                use_nodes=params.get("useNodes", True)
            )
        elif method == "Material.list":
            return list_materials()
        elif method == "Material.delete":
            return delete_material(name=params.get("name"))
        elif method == "Material.assign":
            return assign_material(
                object_name=params.get("objectName"),
                material_name=params.get("materialName"),
                slot_index=params.get("slotIndex", 0)
            )
        elif method == "Material.listObjectMaterials":
            return list_object_materials(object_name=params.get("objectName"))
        elif method == "Material.setBaseColor":
            color = params.get("color")
            return set_material_base_color(
                material_name=params.get("materialName"),
                color=tuple(color) if isinstance(color, list) else color
            )
        elif method == "Material.setMetallic":
            return set_material_metallic(
                material_name=params.get("materialName"),
                metallic=params.get("metallic")
            )
        elif method == "Material.setRoughness":
            return set_material_roughness(
                material_name=params.get("materialName"),
                roughness=params.get("roughness")
            )
        elif method == "Material.setEmission":
            color = params.get("color")
            return set_material_emission(
                material_name=params.get("materialName"),
                color=tuple(color) if isinstance(color, list) else color,
                strength=params.get("strength", 1.0)
            )
        elif method == "Material.getProperties":
            return get_material_properties(material_name=params.get("materialName"))
        else:
            raise ValueError(f"Unknown material method: {method}")

    async def handle_collection_command(self, method: str, params: Dict) -> Any:
        """컬렉션 명령 처리"""
        from .commands.collection import (
            create_collection, list_collections, add_to_collection,
            remove_from_collection, delete_collection
        )

        if method == "Collection.create":
            return create_collection(name=params.get("name"))
        elif method == "Collection.list":
            return list_collections()
        elif method == "Collection.addObject":
            return add_to_collection(
                object_name=params.get("objectName"),
                collection_name=params.get("collectionName")
            )
        elif method == "Collection.removeObject":
            return remove_from_collection(
                object_name=params.get("objectName"),
                collection_name=params.get("collectionName")
            )
        elif method == "Collection.delete":
            return delete_collection(name=params.get("name"))
        else:
            raise ValueError(f"Unknown collection method: {method}")

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
