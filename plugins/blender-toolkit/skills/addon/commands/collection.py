"""
Collection Operations
컬렉션 관리 명령 핸들러
"""

import bpy
from typing import Dict, List, Any
from ..utils.logger import get_logger

logger = get_logger(__name__)


def create_collection(name: str) -> Dict[str, Any]:
    """컬렉션 생성"""
    logger.info(f"Creating collection: {name}")
    
    if name in bpy.data.collections:
        logger.warn(f"Collection '{name}' already exists")
        coll = bpy.data.collections[name]
    else:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
    
    return {'name': coll.name, 'objects': len(coll.objects)}


def list_collections() -> List[Dict[str, Any]]:
    """모든 컬렉션 목록 조회"""
    logger.info("Listing all collections")
    
    collections = []
    for coll in bpy.data.collections:
        collections.append({
            'name': coll.name,
            'objects': len(coll.objects),
            'children': len(coll.children)
        })
    
    return collections


def add_to_collection(object_name: str, collection_name: str) -> Dict[str, str]:
    """오브젝트를 컬렉션에 추가"""
    logger.info(f"Adding '{object_name}' to collection '{collection_name}'")
    
    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")
    
    coll = bpy.data.collections.get(collection_name)
    if not coll:
        raise ValueError(f"Collection '{collection_name}' not found")
    
    if obj.name not in coll.objects:
        coll.objects.link(obj)
    
    return {'status': 'success', 'message': f"Added '{object_name}' to '{collection_name}'"}


def remove_from_collection(object_name: str, collection_name: str) -> Dict[str, str]:
    """오브젝트를 컬렉션에서 제거"""
    logger.info(f"Removing '{object_name}' from collection '{collection_name}'")
    
    obj = bpy.data.objects.get(object_name)
    if not obj:
        raise ValueError(f"Object '{object_name}' not found")
    
    coll = bpy.data.collections.get(collection_name)
    if not coll:
        raise ValueError(f"Collection '{collection_name}' not found")
    
    if obj.name in coll.objects:
        coll.objects.unlink(obj)
    
    return {'status': 'success', 'message': f"Removed '{object_name}' from '{collection_name}'"}


def delete_collection(name: str) -> Dict[str, str]:
    """컬렉션 삭제"""
    logger.info(f"Deleting collection: {name}")
    
    coll = bpy.data.collections.get(name)
    if not coll:
        raise ValueError(f"Collection '{name}' not found")
    
    bpy.data.collections.remove(coll)
    
    return {'status': 'success', 'message': f"Collection '{name}' deleted"}
